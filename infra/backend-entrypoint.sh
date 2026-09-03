#!/bin/sh
set -eu

# The repository carries a sanitized media snapshot for local reproduction.
# Copy it into the named volume only when the volume is empty; later restarts
# preserve uploads and never overwrite operator-managed media.
if [ -d /app/backend/data/media ] && [ -d /app/media ] && [ -z "$(ls -A /app/media 2>/dev/null)" ]; then
  cp -a /app/backend/data/media/. /app/media/
fi

alembic -c alembic.ini upgrade head
exec "$@"
