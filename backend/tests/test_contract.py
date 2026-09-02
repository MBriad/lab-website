import json
from pathlib import Path

from app.main import app


def test_checked_in_openapi_contract_is_current():
    contract_path = Path(__file__).resolve().parents[2] / "contracts" / "openapi.json"
    contract = json.loads(contract_path.read_text(encoding="utf-8"))
    assert contract == app.openapi()
    serialized = json.dumps(contract).lower()
    assert "mem" + "bers" not in serialized
