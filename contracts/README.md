# API contract

`openapi.json` is generated from the FastAPI application. After changing a route or schema, run:

```powershell
python backend/scripts/export_openapi.py
python backend/scripts/check_contract.py
```

