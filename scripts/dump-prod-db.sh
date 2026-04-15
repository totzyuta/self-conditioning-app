#!/usr/bin/env bash
# Production DB dump via Supabase CLI (wraps pg_dump).
#
# Requires DATABASE_URL: Supabase Dashboard → Project Settings → Database
# → "Connection string" → URI (paste full string including password).
# If the password contains @ or other reserved characters, use the encoded
# form or set the password in the dashboard and copy the URI as shown.
#
# Usage (from repo root):
#   export DATABASE_URL='postgresql://...'
#   ./scripts/dump-prod-db.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Copy the Postgres URI from Supabase Dashboard (Settings → Database)." >&2
  exit 1
fi

mkdir -p backups
stamp="$(date +%Y%m%d-%H%M)"
out="backups/prod-${stamp}.sql"

npx supabase@latest db dump --db-url "$DATABASE_URL" -f "$out"
echo "Wrote ${out}"
