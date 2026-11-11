#!/bin/sh
# Calls the backend's cron endpoints: the lead-webhook retry sweep every 15 minutes
# and the scenario-log purge once a day. Runs in the `cron` container (see docker-compose.yml).
BACKEND="${BACKEND_URL:-http://backend:8001}"

call() {
  curl -fsS -m 30 -X POST "$BACKEND/api/cron/$1" \
    -H "Authorization: Bearer $WEBHOOK_CRON_SECRET" \
    -H "Content-Type: application/json" \
    -d "{\"run_id\":\"$1-$2\"}" >/dev/null || echo "cron $1 failed"
}

last_purge=""
while true; do
  call webhook-sweep "$(date +%Y%m%d%H%M)"
  today="$(date +%Y%m%d)"
  if [ "$today" != "$last_purge" ]; then
    call purge-scenarios "$today"
    last_purge="$today"
  fi
  sleep 900
done
