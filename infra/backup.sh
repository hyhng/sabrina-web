#!/usr/bin/env bash
# Daily database backup to R2 (docs/TECH.md 7).
#
# Runs on the server from cron. Dumps Postgres out of its container, uploads the
# dump to R2 under backups/, and deletes anything older than the retention
# window — locally and in the bucket.
#
# Photographs are not backed up: they are already in R2, which is replicated, and
# they are immutable. What cannot be reconstructed is this database.
#
#   0 3 * * *  /opt/sabrina/infra/backup.sh >> /var/log/sabrina-backup.log 2>&1
#
# Restoring is part of the handover, not optional (docs/PHASES.md F6):
#   gunzip -c payload-2026-10-01.sql.gz | docker compose exec -T db psql -U <user> -d <db>

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

# shellcheck disable=SC1091
[ -f .env ] && set -a && . ./.env && set +a

RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/sabrina}"
COMPOSE_FILE="${COMPOSE_FILE:-$HERE/docker-compose.prod.yml}"
STAMP="$(date -u +%Y-%m-%d_%H%M)"
FILE="payload-${STAMP}.sql.gz"

say() { printf '%s  %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"; }

for name in POSTGRES_USER POSTGRES_DB; do
  if [ -z "${!name:-}" ]; then
    say "ERROR: $name is not set. Is .env beside this script?"
    exit 1
  fi
done

mkdir -p "$BACKUP_DIR"

# --- dump -------------------------------------------------------------------
# Through the container, so the host needs no postgres client of its own, and
# the version always matches the server that wrote the data.
say "dumping to ${BACKUP_DIR}/${FILE}"
docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_dump --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --clean --if-exists \
  | gzip -9 > "${BACKUP_DIR}/${FILE}"

# A dump that cannot be read back is not a backup. gzip -t catches a truncated
# upload or a disk that filled up halfway, which is the common way this fails.
gzip -t "${BACKUP_DIR}/${FILE}"
SIZE="$(wc -c < "${BACKUP_DIR}/${FILE}" | tr -d ' ')"
if [ "$SIZE" -lt 1000 ]; then
  say "ERROR: the dump is only ${SIZE} B — refusing to treat that as a backup"
  exit 1
fi
say "dump is ${SIZE} B and gunzips cleanly"

# --- upload -----------------------------------------------------------------
if [ -z "${R2_BUCKET:-}" ] || [ -z "${R2_ACCOUNT_ID:-}" ]; then
  say "R2 is not configured — the dump stays in ${BACKUP_DIR} only."
  say "Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET in .env."
else
  say "uploading to r2://${R2_BUCKET}/backups/${FILE}"
  # aws-cli in a container: nothing to install or keep updated on the host.
  docker run --rm \
    -e AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
    -e AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
    -e AWS_DEFAULT_REGION=auto \
    -v "${BACKUP_DIR}:/backups:ro" \
    amazon/aws-cli:latest \
    s3 cp "/backups/${FILE}" "s3://${R2_BUCKET}/backups/${FILE}" \
    --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

  # Retention in the bucket. Listed and deleted one by one on purpose: a
  # lifecycle rule would also be fine, but this way the log says what went.
  CUTOFF="$(date -u -d "${RETENTION_DAYS} days ago" +%Y-%m-%d 2>/dev/null \
    || date -u -v-"${RETENTION_DAYS}"d +%Y-%m-%d)"
  say "removing bucket backups older than ${CUTOFF}"
  docker run --rm \
    -e AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
    -e AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
    -e AWS_DEFAULT_REGION=auto \
    amazon/aws-cli:latest \
    s3 ls "s3://${R2_BUCKET}/backups/" \
    --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
    | awk '{print $4}' | grep -E '^payload-[0-9]{4}-[0-9]{2}-[0-9]{2}' \
    | while read -r key; do
        key_date="${key#payload-}"
        key_date="${key_date:0:10}"
        if [[ "$key_date" < "$CUTOFF" ]]; then
          say "  deleting ${key}"
          docker run --rm \
            -e AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
            -e AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
            -e AWS_DEFAULT_REGION=auto \
            amazon/aws-cli:latest \
            s3 rm "s3://${R2_BUCKET}/backups/${key}" \
            --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
        fi
      done
fi

# --- local retention --------------------------------------------------------
# The server has 40 GB; a few weeks of dumps is nothing, but unbounded is not.
say "removing local backups older than ${RETENTION_DAYS} days"
find "$BACKUP_DIR" -name 'payload-*.sql.gz' -type f -mtime "+${RETENTION_DAYS}" -print -delete

say "done"
