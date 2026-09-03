# Docker deployment

The Compose stack runs the public site, CMS API, and PostgreSQL as three
separate containers on the private `cms_net` bridge network:

| Service | Container port | Host exposure | Internal DNS name |
| --- | ---: | --- | --- |
| `frontend` | 3000 | `${FRONTEND_PORT:-3000}` | `frontend` |
| `backend` | 8000 | none by default | `backend` |
| `postgres` | 5432 | none | `postgres` |

The browser talks only to `frontend`. Next.js proxies `/api/v1/*` to
`http://backend:8000`, and the API connects to PostgreSQL at
`postgres:5432`. PostgreSQL is not published to the host network.

## Start

From the repository root:

```powershell
Copy-Item infra/.env.example infra/.env
# Edit infra/.env and replace both placeholder secrets.
docker compose --env-file infra/.env -f infra/docker-compose.yml up --build -d
```

Open `http://localhost:3000` (or the host LAN address and configured
`FRONTEND_PORT`). The API readiness endpoint is available inside the network
at `http://backend:8000/readyz`; it is intentionally not published as a host
port.

## Persistence

- `postgres_data` stores the PostgreSQL data directory.
- `media_data` stores uploaded media.
- On the first backend start, the tracked sanitized media snapshot is copied
  into an empty `media_data` volume. Existing volume contents are never
  overwritten.
- On the first backend start with `SEED_SNAPSHOT=true`, the tracked CMS rows
  are imported into an empty PostgreSQL database. A marker in `media_data`
  makes this one-shot; later restarts and edits are never overwritten. Set
  `SEED_SNAPSHOT=false` for a blank deployment.

The tracked `backend/data/cms.db` is the SQLite source snapshot used for local
tests and, when enabled, the first-run PostgreSQL import. PostgreSQL is then
managed through the admin API.

## Stop / inspect

```powershell
docker compose --env-file infra/.env -f infra/docker-compose.yml ps
docker compose --env-file infra/.env -f infra/docker-compose.yml logs -f frontend backend
docker compose --env-file infra/.env -f infra/docker-compose.yml down
```

The sanitized snapshot intentionally contains no administrator password. After
the first start, create a local admin through the backend container:

```powershell
docker compose --env-file infra/.env -f infra/docker-compose.yml exec backend `
  python scripts/create_admin.py admin "choose-a-local-password"
```

Do not add `-v` to `down` unless you intentionally want to remove the
PostgreSQL and media volumes.
