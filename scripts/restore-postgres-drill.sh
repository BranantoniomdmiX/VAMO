#!/usr/bin/env bash
# ==============================================================================
# VAMO — Safe Restore Drill Engine (Isolated Temporary Environment Only)
# 
# Invariants:
#   - STRICTLY REFUSES to execute against production databases or hosts.
#   - Requires an isolated temporary PostgreSQL 16 container.
#   - Decrypts client-side using an offline private key.
#   - Executes pg_restore on the temporary test database.
#   - Performs non-destructive read integrity tests.
#   - Destroys the temporary container immediately upon drill completion.
# ==============================================================================

set -euo pipefail

TARGET_CONTAINER="${1:-}"
BACKUP_ENC_FILE="${2:-}"
AGE_IDENTITY_FILE="${3:-}"

# Imagen de PostgreSQL para el entorno temporal aislado.
# Por defecto se utiliza una imagen compatible con PostgreSQL 16 y extensiones requeridas (ej. PostGIS).
# El valor definitivo debe alinearse con la inspección en producción de 'SELECT extname, extversion FROM pg_extension;'.
RESTORE_DB_IMAGE="${RESTORE_DB_IMAGE:-postgis/postgis:16-3.4-alpine}"

log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] [DRILL] $1"
}

fail() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] [DRILL ERROR] $1" >&2
  exit 1
}

# 1. 🛡️ GUARDIA ANTI-PRODUCCIÓN (Inviolable)
if [ -z "${TARGET_CONTAINER}" ] || [ -z "${BACKUP_ENC_FILE}" ] || [ -z "${AGE_IDENTITY_FILE}" ]; then
  echo "Uso:"
  echo "  $0 <temporary-container-name> <backup-file.dump.enc> <age-private-key-file>"
  echo "Variables opcionales de entorno:"
  echo "  RESTORE_DB_IMAGE (por defecto: postgis/postgis:16-3.4-alpine)"
  fail "Faltan parámetros obligatorios."
fi

# Lista negra de nombres de producción
if [[ "${TARGET_CONTAINER}" =~ (vamo-db|prod|production|dokploy-pg) ]]; then
  fail "ALERTA CRÍTICA: Se rechazó el intento de restaurar sobre un contenedor con nombre de producción ('${TARGET_CONTAINER}'). El drill DEBE ejecutarse únicamente sobre un contenedor temporal efímero (ej. 'test-pg-restore-drill')."
fi

if [ ! -f "${BACKUP_ENC_FILE}" ]; then
  fail "El archivo de respaldo cifrado '${BACKUP_ENC_FILE}' no existe."
fi

if [ ! -f "${AGE_IDENTITY_FILE}" ]; then
  fail "El archivo de clave privada age '${AGE_IDENTITY_FILE}' no existe."
fi

command -v age >/dev/null 2>&1 || fail "Binario 'age' requerido para descifrado."
command -v docker >/dev/null 2>&1 || fail "Binario 'docker' requerido para el drill."

TEMP_DIR="$(mktemp -d)"
TEMP_DUMP="${TEMP_DIR}/restore_payload.dump"
CREATED_DRILL_CONTAINER=false

cleanup() {
  log "Limpiando artefactos temporales descifrados..."
  rm -rf "${TEMP_DIR}"
  if [ "${CREATED_DRILL_CONTAINER}" = "true" ]; then
    log "CONTAINER_CLEANUP: Deteniendo y destruyendo contenedor temporal aislado '${TARGET_CONTAINER}'..."
    docker rm -f "${TARGET_CONTAINER}" >/dev/null 2>&1 || true
    log "CONTAINER_CLEANUP_COMPLETED: Contenedor temporal '${TARGET_CONTAINER}' destruido exitosamente."
  else
    log "CONTAINER_CLEANUP_NOTE: El contenedor '${TARGET_CONTAINER}' preexistía; no fue destruido por este script."
  fi
}
trap cleanup EXIT

# 2. Gestión del Ciclo de Vida del Contenedor Temporal (Modelo A: Creación y Destrucción Automatizada)
if docker ps -a --format '{{.Names}}' | grep -Eq "^${TARGET_CONTAINER}\$"; then
  log "Usando contenedor temporal existente '${TARGET_CONTAINER}'."
else
  log "Creando contenedor temporal aislado de prueba '${TARGET_CONTAINER}' con imagen '${RESTORE_DB_IMAGE}' (red aislada)..."
  docker run -d \
    --name "${TARGET_CONTAINER}" \
    --network none \
    -e POSTGRES_PASSWORD=vamo_drill_temp_pass \
    "${RESTORE_DB_IMAGE}" >/dev/null
  CREATED_DRILL_CONTAINER=true
  
  # Esperar a que el motor esté listo para recibir conexiones
  log "Esperando inicialización del PostgreSQL temporal..."
  READY=false
  for _ in {1..30}; do
    if docker exec -i "${TARGET_CONTAINER}" pg_isready -U postgres >/dev/null 2>&1; then
      READY=true
      break
    fi
    sleep 1
  done
  if [ "${READY}" != "true" ]; then
    fail "RESTORE_FAIL: El contenedor temporal '${TARGET_CONTAINER}' no respondió a pg_isready a tiempo."
  fi
fi

log "Iniciando simulacro seguro de restauración en contenedor aislado: ${TARGET_CONTAINER}"

# 3. Descifrado Local Temporal con Clave Privada Offline
log "Descifrando respaldo con clave privada offline..."
if ! age -d -i "${AGE_IDENTITY_FILE}" -o "${TEMP_DUMP}" "${BACKUP_ENC_FILE}"; then
  fail "RESTORE_FAIL: Fallo al descifrar el respaldo con la clave privada proporcionada."
fi

# 4. Restauración en Base de Datos de Prueba Efímera (FAIL CLOSED)
log "Ejecutando pg_restore en base de datos temporal..."
docker exec -i "${TARGET_CONTAINER}" dropdb -U postgres --if-exists vamo_drill_db || true
docker exec -i "${TARGET_CONTAINER}" createdb -U postgres vamo_drill_db

# pg_restore debe retornar 0. Cualquier código de salida distinto de 0 es RESTORE_FAIL.
RESTORE_STATUS=0
docker exec -i "${TARGET_CONTAINER}" pg_restore -U postgres -d vamo_drill_db --no-owner --no-privileges < "${TEMP_DUMP}" || RESTORE_STATUS=$?

if [ "${RESTORE_STATUS}" -ne 0 ]; then
  fail "RESTORE_FAIL: pg_restore retornó código de error ${RESTORE_STATUS}. Respaldo rechazado (Fail Closed)."
fi
log "pg_restore finalizó con código de salida 0 (sin errores)."

# 5. Verificaciones de Integridad y Consulta de Sanidad (Sin exponer PII ni datos sensibles)
log "Verificando apertura y accesibilidad de la base de datos..."
if ! docker exec -i "${TARGET_CONTAINER}" psql -U postgres -d vamo_drill_db -c "SELECT 1;" >/dev/null 2>&1; then
  fail "RESTORE_FAIL: La base de datos restaurada no acepta conexiones SQL."
fi

# ==============================================================================
# ASERCIÓN DE EXTENSIONES OBLIGATORIAS (PostgreSQL 16 + PostGIS)
# ==============================================================================
log "Verificando extensiones críticas presentes en la base restaurada..."
INSTALLED_EXTENSIONS=$(docker exec -i "${TARGET_CONTAINER}" psql -U postgres -d vamo_drill_db -t -A -c "SELECT extname FROM pg_extension ORDER BY extname;")

REQUIRED_EXTENSIONS=("postgis" "uuid-ossp" "pgcrypto")
for EXT in "${REQUIRED_EXTENSIONS[@]}"; do
  if echo "${INSTALLED_EXTENSIONS}" | grep -qx "${EXT}"; then
    log "  [REQUIRED_EXTENSION] ✓ Presente: ${EXT}"
  else
    fail "RESTORE_FAIL: Extensión crítica obligatoria ausente tras restore: ${EXT}"
  fi
done

TABLES_COUNT=$(docker exec -i "${TARGET_CONTAINER}" psql -U postgres -d vamo_drill_db -t -A -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
log "Tablas restauradas detectadas en schema public: ${TABLES_COUNT}"

if [ "${TABLES_COUNT}" -lt 5 ]; then
  fail "RESTORE_FAIL: Conteo de tablas anormalmente bajo (${TABLES_COUNT})."
fi

# ==============================================================================
# TABLAS CANÓNICAS AUDITADAS (Esquema Autorizado PostgreSQL 16 Dokploy / Supabase)
# ==============================================================================
# REQUIRED_TABLE: Esenciales para operación, ledger financiero y órdenes.
# OPTIONAL_TABLE: Tablas complementarias de catálogo o soporte.
# LEGACY_TABLE: Tablas del modelo histórico anterior.
# ==============================================================================
REQUIRED_TABLES=("orders" "drivers" "wallet_accounts" "wallet_transactions" "profiles")
OPTIONAL_TABLES=("merchants" "products" "cities" "territories")
LEGACY_TABLES=("franchises")

log "Ejecutando aserciones sobre tablas canónicas requeridas..."
for T in "${REQUIRED_TABLES[@]}"; do
  EXISTS=$(docker exec -i "${TARGET_CONTAINER}" psql -U postgres -d vamo_drill_db -t -A -c "SELECT to_regclass('public.${T}');")
  if [ "${EXISTS}" = "public.${T}" ] || [ -n "${EXISTS}" ]; then
    log "  [REQUIRED_TABLE] ✓ Presente: ${T}"
  else
    fail "RESTORE_FAIL: Asersión violada. Falta la tabla crítica requerida: public.${T}"
  fi
done

for T in "${OPTIONAL_TABLES[@]}"; do
  EXISTS=$(docker exec -i "${TARGET_CONTAINER}" psql -U postgres -d vamo_drill_db -t -A -c "SELECT to_regclass('public.${T}');")
  if [ "${EXISTS}" = "public.${T}" ] || [ -n "${EXISTS}" ]; then
    log "  [OPTIONAL_TABLE] ✓ Presente: ${T}"
  else
    log "  [OPTIONAL_TABLE] - Ausente (opcional): ${T}"
  fi
done

for T in "${LEGACY_TABLES[@]}"; do
  EXISTS=$(docker exec -i "${TARGET_CONTAINER}" psql -U postgres -d vamo_drill_db -t -A -c "SELECT to_regclass('public.${T}');")
  if [ "${EXISTS}" = "public.${T}" ] || [ -n "${EXISTS}" ]; then
    log "  [LEGACY_TABLE] ! Presente (rastreabilidad histórica): ${T}"
  fi
done

# 6. Comprobación de lectura representativa sin exponer filas (Counts únicos)
ORDERS_COUNT=$(docker exec -i "${TARGET_CONTAINER}" psql -U postgres -d vamo_drill_db -t -A -c "SELECT count(*) FROM public.orders;" 2>/dev/null) || fail "RESTORE_FAIL: Falló lectura representativa de tabla de órdenes (orders)."
LEDGER_COUNT=$(docker exec -i "${TARGET_CONTAINER}" psql -U postgres -d vamo_drill_db -t -A -c "SELECT count(*) FROM public.wallet_transactions;" 2>/dev/null) || fail "RESTORE_FAIL: Falló lectura representativa de libro contable (wallet_transactions)."

log "Evidencia de lectura de autoridad completada exitosamente:"
log "  - Conteo de órdenes registradas (order authority): ${ORDERS_COUNT}"
log "  - Conteo de transacciones contables (financial ledger): ${LEDGER_COUNT}"

log "=========================================================="
log "RESTORE DRILL COMPLETADO EXITOSAMENTE [PASS]."
log "STATUS: RESTORE_INTEGRITY_VERIFIED"
log "=========================================================="
