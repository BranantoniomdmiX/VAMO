#!/usr/bin/env bash
# ==============================================================================
# VAMO — PostgreSQL Production Logical Backup Engine to Backblaze B2
# 
# Architecture:
#   Primary DB (PostgreSQL 16 Dokploy / Docker)
#   -> custom-format pg_dump
#   -> client-side asymmetric encryption (age)
#   -> upload to Backblaze B2 (S3 API via rclone / aws-cli)
#   -> secure deletion of plaintext dump
#   -> structured audit manifest logging
# 
# Security Invariants:
#   - NEVER prints or logs passwords, tokens or connection strings.
#   - Fails closed immediately on any step error (set -euo pipefail).
#   - Plaintext dump is purged immediately after successful encryption.
#   - Private decryption keys are NEVER stored on the production server.
# ==============================================================================

set -euo pipefail

# 1. Configuración de Rutas y Variables de Entorno Seguras
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/vamo}"
LOG_DIR="${LOG_DIR:-/var/log/vamo}"
MANIFEST_FILE="${LOG_DIR}/backup_manifest.jsonl"
LOCK_FILE="/var/run/vamo_backup.lock"

# Contenedor y Credenciales PostgreSQL (Inyectadas vía entorno en Dokploy/Host)
PG_CONTAINER="${PG_CONTAINER:-vamo-db-5vojdb}"
PG_USER="${PG_USER:-vamo_admin}"
PG_DATABASE="${PG_DATABASE:-vamo_production}"

# Cifrado Asimétrico con 'age' (Clave pública en servidor; privada NUNCA en producción)
AGE_RECIPIENT="${AGE_PUBLIC_KEY:-}"

# Backblaze B2 (Bucket y Target)
B2_BUCKET="${B2_BUCKET:-}"
B2_REMOTE_ALIAS="${B2_REMOTE_ALIAS:-b2-vamo}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

# Archivos Temporales de Trabajo
DUMP_FILE="${BACKUP_DIR}/vamo_prod_${TIMESTAMP}.dump"
ENC_FILE="${DUMP_FILE}.enc"
LOG_FILE="${LOG_DIR}/backup_${TIMESTAMP}.log"

# Asegurar directorios protegidos con permisos mínimos (0700)
mkdir -p "${BACKUP_DIR}" "${LOG_DIR}"
chmod 700 "${BACKUP_DIR}" "${LOG_DIR}"

log() {
  local LEVEL="$1"
  local MSG="$2"
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] [${LEVEL}] ${MSG}" | tee -a "${LOG_FILE}"
}

fail() {
  log "ERROR" "$1"
  # Limpieza de emergencia si falló a mitad de proceso
  rm -f "${DUMP_FILE}"
  exit 1
}

# 2. Control de Concurrencia con Lockfile (flock)
exec 200>"${LOCK_FILE}"
if ! flock -n 200; then
  log "WARN" "Ya existe un proceso de respaldo en ejecución. Abortando para evitar colisión."
  exit 0
fi

log "INFO" "=========================================================="
log "INFO" "Iniciando respaldo lógico VAMO (PostgreSQL 16 Dokploy -> B2)"
log "INFO" "=========================================================="

# 3. Validación de Pre-requisitos de Seguridad
if [ -z "${AGE_RECIPIENT}" ]; then
  fail "FAIL_CLOSED: AGE_PUBLIC_KEY no está configurada. Se rechaza respaldo sin cifrado asimétrico."
fi

if [ -z "${B2_BUCKET}" ]; then
  fail "FAIL_CLOSED: B2_BUCKET no está configurado. Se rechaza respaldo sin destino offsite."
fi

command -v age >/dev/null 2>&1 || fail "FAIL_CLOSED: Binario 'age' no encontrado. Instale age antes de continuar."
command -v sha256sum >/dev/null 2>&1 || fail "FAIL_CLOSED: Binario 'sha256sum' no encontrado."

# 4. Generación de Dump Lógico Custom Format (pg_dump -Fc)
log "INFO" "Ejecutando pg_dump en contenedor '${PG_CONTAINER}' para base de datos '${PG_DATABASE}'..."

# Usar docker exec para ejecutar pg_dump internamente sin exponer credenciales en la red
if ! docker exec -e PGPASSWORD="${PGPASSWORD:-}" "${PG_CONTAINER}" \
  pg_dump -U "${PG_USER}" -d "${PG_DATABASE}" -Fc --no-owner --no-privileges > "${DUMP_FILE}"; then
  fail "Fallo crítico al ejecutar pg_dump dentro del contenedor Docker."
fi

if [ ! -s "${DUMP_FILE}" ]; then
  fail "El archivo dump generado está vacío o no existe."
fi

DUMP_SIZE=$(stat -c%s "${DUMP_FILE}" 2>/dev/null || stat -f%z "${DUMP_FILE}")
log "INFO" "pg_dump generado exitosamente (Tamaño en claro: ${DUMP_SIZE} bytes)."

# 5. Cifrado Asimétrico Client-Side con 'age'
log "INFO" "Cifrando respaldo con clave pública 'age' antes de transferir a la red..."
if ! age -r "${AGE_RECIPIENT}" -o "${ENC_FILE}" "${DUMP_FILE}"; then
  fail "Error durante el cifrado asimétrico del respaldo."
fi

if [ ! -s "${ENC_FILE}" ]; then
  fail "El archivo cifrado está vacío o corrupto tras la ejecución de age."
fi

# 6. Destrucción Inmediata del Dump en Claro (Mandato de Seguridad)
rm -f "${DUMP_FILE}"
log "INFO" "Dump en texto claro eliminado de forma segura. Solo permanece artefacto cifrado."

ENC_SIZE=$(stat -c%s "${ENC_FILE}" 2>/dev/null || stat -f%z "${ENC_FILE}")
ENC_SHA256=$(sha256sum "${ENC_FILE}" | awk '{print $1}')
log "INFO" "Artefacto cifrado listo (Tamaño: ${ENC_SIZE} bytes, SHA256: ${ENC_SHA256})."

# 7. Subida Segura a Backblaze B2 (Offsite Storage)
log "INFO" "Subiendo artefacto cifrado al bucket Backblaze B2: ${B2_BUCKET}..."
REMOTE_DEST="${B2_REMOTE_ALIAS}:${B2_BUCKET}/backups/postgres/$(basename "${ENC_FILE}")"

UPLOAD_SUCCESS=false
if command -v rclone >/dev/null 2>&1; then
  if rclone copyto "${ENC_FILE}" "${REMOTE_DEST}"; then
    UPLOAD_SUCCESS=true
  fi
elif command -v aws >/dev/null 2>&1 && [ -n "${B2_ENDPOINT:-}" ]; then
  if aws s3 cp "${ENC_FILE}" "s3://${B2_BUCKET}/backups/postgres/$(basename "${ENC_FILE}")" --endpoint-url "${B2_ENDPOINT}"; then
    UPLOAD_SUCCESS=true
  fi
elif command -v b2 >/dev/null 2>&1; then
  if b2 upload-file "${B2_BUCKET}" "${ENC_FILE}" "backups/postgres/$(basename "${ENC_FILE}")"; then
    UPLOAD_SUCCESS=true
  fi
else
  fail "No se encontró ningún cliente compatible (rclone, aws-cli o b2-cli). Respaldo no subido."
fi

if [ "${UPLOAD_SUCCESS}" != "true" ]; then
  fail "Error al transferir el artefacto cifrado a Backblaze B2."
fi

log "INFO" "Subida a Backblaze B2 verificada exitosamente."

# 8. Registro Estructurado en Manifiesto de Auditoría (Sin secretos)
cat <<EOF >> "${MANIFEST_FILE}"
{"timestamp":"${TIMESTAMP}","database":"${PG_DATABASE}","postgres_major":16,"encrypted_file":"$(basename "${ENC_FILE}")","encrypted_bytes":${ENC_SIZE},"sha256":"${ENC_SHA256}","provider":"BACKBLAZE_B2","bucket_alias":"${B2_BUCKET}","status":"SUCCESS","format":"pg_dump_custom_v1"}
EOF

# 9. Política de Retención Local de Archivos Cifrados
# Mantener copias cifradas locales por seguridad temporal de disco (ej. últimas 48h)
find "${BACKUP_DIR}" -name "vamo_prod_*.dump.enc" -type f -mtime +2 -delete 2>/dev/null || true

log "INFO" "Respaldo completado satisfactoriamente [PASS]."
log "INFO" "=========================================================="
