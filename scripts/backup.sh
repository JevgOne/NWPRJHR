#!/usr/bin/env bash
# Daily PostgreSQL backup script for Hairora
# Usage: ./scripts/backup.sh
# Env: DATABASE_URL, BACKUP_DIR (optional, default: /var/backups/hairora)
# Retention: 30 days
# Schedule via cron: 0 2 * * * /path/to/hairora/scripts/backup.sh

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/hairora}"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/hairora_${TIMESTAMP}.sql.gz"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Extract connection details from DATABASE_URL
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

# pg_dump using DATABASE_URL directly
echo "Starting backup: ${BACKUP_FILE}"
pg_dump "${DATABASE_URL}" --no-owner --no-acl --clean --if-exists | gzip > "${BACKUP_FILE}"

# Verify file was created and is non-empty
if [ ! -s "${BACKUP_FILE}" ]; then
  echo "ERROR: Backup file is empty or missing"
  exit 1
fi

FILESIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "Backup complete: ${BACKUP_FILE} (${FILESIZE})"

# Remove backups older than retention period
DELETED=$(find "${BACKUP_DIR}" -name "hairora_*.sql.gz" -mtime +${RETENTION_DAYS} -print -delete | wc -l | tr -d ' ')
echo "Cleaned up ${DELETED} old backup(s) (>${RETENTION_DAYS} days)"

echo "Done."
