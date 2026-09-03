# Robotics Laboratory CMS API

The backend is a FastAPI application backed by PostgreSQL in deployment and SQLite for local smoke tests. It exposes the public contract under `/api/v1` and authenticated CMS operations under `/api/v1/admin`.

## Local setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
$env:DATABASE_URL = "sqlite:///./backend/data/cms.local.db"
alembic -c backend/alembic.ini upgrade head
python backend/scripts/create_admin.py admin "use-a-local-password"
python backend/scripts/export_openapi.py
uvicorn app.main:app --app-dir backend --reload
```

Use environment variables for `SECRET_KEY`, `DATABASE_URL`, `MEDIA_ROOT`, `FRONTEND_ORIGINS`, and the upload limits. Do not commit `.env` files or passwords.

## Checks

```powershell
python backend/scripts/check_contract.py
python -m pytest backend/tests
```

