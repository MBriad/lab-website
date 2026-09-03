"""Fail if the checked-in OpenAPI document differs from the running API."""

import json
from pathlib import Path
import sys


backend_root = Path(__file__).resolve().parents[1]
project_root = backend_root.parent
sys.path.insert(0, str(backend_root))

from app.main import app  # noqa: E402


contract_path = project_root / "contracts" / "openapi.json"
if not contract_path.is_file():
    raise SystemExit(f"Missing contract: {contract_path}")

expected = json.loads(contract_path.read_text(encoding="utf-8"))
actual = app.openapi()
if expected != actual:
    raise SystemExit(
        "OpenAPI contract is stale; run python backend/scripts/export_openapi.py"
    )

serialized = json.dumps(expected, ensure_ascii=False).lower()
forbidden_terms = ["mem" + "bers", "mem" + "ber"]
if any(term in serialized for term in forbidden_terms):
    raise SystemExit("OpenAPI contract contains forbidden product-area content")
print("OpenAPI contract is current and contains no forbidden product-area content")
