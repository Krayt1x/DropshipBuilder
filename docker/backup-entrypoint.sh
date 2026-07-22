#!/bin/sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
INTERVAL_HOURS="${BACKUP_INTERVAL_HOURS:-24}"
RETENTION_COUNT="${BACKUP_RETENTION_COUNT:-14}"

mkdir -p "$BACKUP_DIR"

while true; do
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql.gz"

  echo "Backing up $POSTGRES_DB to $FILE"
  PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h postgres -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$FILE"

  ls -1t "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | tail -n +$((RETENTION_COUNT + 1)) | xargs -r rm --

  sleep "$((INTERVAL_HOURS * 3600))"
done
