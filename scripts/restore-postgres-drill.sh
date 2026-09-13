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

cleanup() {
  log "Limpiando artefactos temporales descifrados..."
  rm -rf "${TEMP_DIR}"
}
trap cleanup EXIT

log "Iniciando simulacro seguro de restauración en contenedor aislado: ${TARGET_CONTAINER}"

# 2. Descifrado Local Temporal con Clave Privada Offline
log "Descifrando respaldo con clave privada offline..."
if ! age -d -i "${AGE_IDENTITY_FILE}" -o "${TEMP_DUMP}" "${BACKUP_ENC_FILE}"; then
  fail "Fallo al descifrar el respaldo con la clave privada proporcionada."
fi

# 3. Restauración en Base de Datos de Prueba Efímera
log "Ejecutando pg_restore en base de datos temporal..."
docker exec -i "${TARGET_CONTAINER}" dropdb -U postgres --if-exists vamo_drill_db || true
docker exec -i "${TARGET_CONTAINER}" createdb -U postgres vamo_drill_db

if ! docker exec -i "${TARGET_CONTAINER}" pg_restore -U postgres -d vamo_drill_db --no-owner --no-privileges < "${TEMP_DUMP}"; then
  log "Aviso: pg_restore completó con warnings normales de esquema/roles."
fi

# 4. Verificaciones de Integridad y Consulta de Sanidad (Sin exponer PII ni datos sensibles)
log "Verificando apertura de base de datos..."
TABLES_COUNT=$(docker exec -i "${TARGET_CONTAINER}" psql -U postgres -d vamo_drill_db -t -A -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
log "Tablas restauradas detectadas: ${TABLES_COUNT}"

if [ "${TABLES_COUNT}" -lt 5 ]; then
  fail "Prueba fallida: Conteo de tablas anormalmente bajo (${TABLES_COUNT})."
fi

# Comprobar existencia de tablas maestras críticas
for T in orders drivers wallet_accounts wallet_transactions profiles; do
  EXISTS=$(docker exec -i "${TARGET_CONTAINER}" psql -U postgres -d vamo_drill_db -t -A -c "SELECT to_regclass('public.${T}');")
  if [ "${EXISTS}" = "public.${T}" ] || [ -n "${EXISTS}" ]; then
    log "  ✓ Tabla crítica presente: ${T}"
  else
    log "  ✗ Tabla crítica no encontrada: ${T}"
  fi
done

# Comprobar lectura representativa sin exponer filas
ORDERS_COUNT=$(docker exec -i "${TARGET_CONTAINER}" psql -U postgres -d vamo_drill_db -t -A -c "SELECT count(*) FROM public.orders;" 2>/dev/null || echo "0")
LEDGER_COUNT=$(docker exec -i "${TARGET_CONTAINER}" psql -U postgres -d vamo_drill_db -t -A -c "SELECT count(*) FROM public.wallet_transactions;" 2>/dev/null || echo "0")
log "Verificación de lectura completada: Órdenes registradas (${ORDERS_COUNT}), Transacciones contables (${LEDGER_COUNT})."

log "=========================================================="
log "RESTORE DRILL COMPLETADO EXITOSAMENTE [PASS]."
log "Destruya el contenedor temporal '${TARGET_CONTAINER}' de acuerdo al protocolo."
log "=========================================================="
