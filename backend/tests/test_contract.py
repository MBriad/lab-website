import json
from pathlib import Path

from app.main import app


def test_checked_in_openapi_contract_is_current():
    contract_path = Path(__file__).resolve().parents[2] / "contracts" / "openapi.json"
    contract = json.loads(contract_path.read_text(encoding="utf-8"))
    assert contract == app.openapi()
    serialized = json.dumps(contract).lower()
    assert "mem" + "bers" not in serialized

    for schema_name, field_name in (
        ("ProjectCreate", "demo_url"),
        ("ProjectUpdate", "demo_url"),
        ("ProjectPublic", "demo_url"),
        ("ProjectAdmin", "demo_url"),
        ("ProjectReferencePublic", "demo_url"),
        ("SiteSettingsUpdate", "papers_url"),
        ("SiteSettingsUpdate", "join_url"),
        ("SiteSettingsUpdate", "cooperation_url"),
        ("SiteSettingsPublic", "papers_url"),
        ("SiteSettingsPublic", "join_url"),
        ("SiteSettingsPublic", "cooperation_url"),
    ):
        field = contract["components"]["schemas"][schema_name]["properties"][field_name]
        url_schema = next(
            option for option in field["anyOf"] if option.get("type") == "string"
        )
        assert url_schema["format"] == "uri"
        assert url_schema["pattern"] == r"^https?://"

    gallery_create = contract["components"]["schemas"]["GalleryItemCreate"]
    assert gallery_create["required"] == ["media_id", "title"]
    assert (
        "media" in contract["components"]["schemas"]["GalleryItemPublic"]["properties"]
    )
    assert "/api/v1/gallery" in contract["paths"]
    assert "/api/v1/admin/gallery" in contract["paths"]
