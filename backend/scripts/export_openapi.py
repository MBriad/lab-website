"""Export the deterministic OpenAPI contract consumed by the frontend."""

import json
from pathlib import Path
import sys


backend_root = Path(__file__).resolve().parents[1]
project_root = backend_root.parent
sys.path.insert(0, str(backend_root))

from app.main import app  # noqa: E402


output_path = project_root / "contracts" / "openapi.json"
output_path.parent.mkdir(parents=True, exist_ok=True)
with output_path.open("w", encoding="utf-8", newline="\n") as contract_file:
    contract_file.write(
        json.dumps(app.openapi(), ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    )
print(f"Exported OpenAPI contract to {output_path}")
