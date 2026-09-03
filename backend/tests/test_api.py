from io import BytesIO
from uuid import uuid4

from PIL import Image

from app.core.security import hash_password
from app.models import Admin


def login(client, session_factory) -> str:
    with session_factory() as db:
        db.add(
            Admin(
                username="admin",
                password_hash=hash_password("correct horse battery staple"),
                is_active=True,
            )
        )
        db.commit()
    response = client.post(
        "/api/v1/admin/auth/login",
        json={"username": "admin", "password": "correct horse battery staple"},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def test_health_and_public_visibility(client):
    assert client.get("/healthz").json() == {"status": "ok"}
    assert client.get("/api/v1/news").json()["items"] == []
    assert client.get("/api/v1/admin/awards").status_code == 401


def test_award_enums_auth_and_public_filtering(client, session_factory):
    token = login(client, session_factory)
    headers = {"Authorization": f"Bearer {token}"}
    invalid = {
        "title": "Invalid",
        "category": "invalid",
        "level": "national",
        "issuer": "Lab",
        "competition_name": "Competition",
        "description": "Description",
        "award_date": "2025-01-01",
        "year": 2025,
    }
    response = client.post("/api/v1/admin/awards", json=invalid, headers=headers)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"

    hidden = {
        "title": "Hidden award",
        "category": "research",
        "level": "university",
        "issuer": "Lab",
        "competition_name": "Internal",
        "description": "Not public",
        "award_date": "2024-01-01",
        "year": 2024,
        "is_visible": False,
    }
    visible = {
        **hidden,
        "title": "Visible award",
        "award_date": "2025-01-01",
        "is_visible": True,
        "is_featured": True,
    }
    assert (
        client.post("/api/v1/admin/awards", json=hidden, headers=headers).status_code
        == 201
    )
    assert (
        client.post("/api/v1/admin/awards", json=visible, headers=headers).status_code
        == 201
    )
    public = client.get("/api/v1/awards?featured=true")
    assert public.status_code == 200
    assert [item["title"] for item in public.json()["items"]] == ["Visible award"]


def test_media_upload_and_reference_safe_delete(client, session_factory):
    token = login(client, session_factory)
    headers = {"Authorization": f"Bearer {token}"}
    image = Image.new("RGB", (4, 3), color="red")
    image_bytes = BytesIO()
    image.save(image_bytes, format="PNG")
    upload = client.post(
        "/api/v1/admin/media",
        headers=headers,
        files={"upload": ("certificate.png", image_bytes.getvalue(), "image/png")},
    )
    assert upload.status_code == 201, upload.text
    media = upload.json()
    assert media["width"] == 4 and media["height"] == 3
    assert media["url"].startswith("http://testserver/api/v1/media/")

    award = {
        "title": "Referenced award",
        "category": "honor",
        "level": "national",
        "issuer": "Lab",
        "competition_name": "Competition",
        "description": "Description",
        "award_date": "2025-01-01",
        "year": 2025,
        "certificate_media_id": media["id"],
        "is_visible": True,
    }
    created = client.post("/api/v1/admin/awards", json=award, headers=headers)
    assert created.status_code == 201, created.text
    assert (
        client.delete(f"/api/v1/admin/media/{media['id']}", headers=headers).status_code
        == 409
    )
    assert client.get(f"/api/v1/media/{media['storage_key']}").status_code == 200


def test_admin_content_and_settings_workflows(client, session_factory):
    token = login(client, session_factory)
    headers = {"Authorization": f"Bearer {token}"}

    news = client.post(
        "/api/v1/admin/news",
        headers=headers,
        json={
            "slug": "lab-open-day",
            "title": "Lab open day",
            "content": "The laboratory is open.",
            "is_visible": True,
        },
    )
    assert news.status_code == 201, news.text
    assert client.get("/api/v1/news/lab-open-day").status_code == 200

    project = client.post(
        "/api/v1/admin/projects",
        headers=headers,
        json={
            "slug": "warehouse-robot",
            "title": "Warehouse robot",
            "description": "An autonomous warehouse robot.",
            "is_visible": True,
        },
    )
    assert project.status_code == 201, project.text
    project_id = project.json()["id"]
    assert (
        client.patch(
            f"/api/v1/admin/projects/{project_id}",
            headers=headers,
            json={"sort_order": 1},
        ).status_code
        == 200
    )

    area = client.post(
        "/api/v1/admin/research-areas",
        headers=headers,
        json={
            "slug": "robot-learning",
            "title": "Robot learning",
            "description": "Learning-based robot control.",
            "is_visible": True,
        },
    )
    assert area.status_code == 201, area.text
    assert (
        client.get("/api/v1/research-areas").json()["items"][0]["slug"]
        == "robot-learning"
    )

    settings = client.get("/api/v1/admin/site-settings", headers=headers)
    assert settings.status_code == 200
    updated = client.put(
        "/api/v1/admin/site-settings",
        headers=headers,
        json={"site_title": "Robotics Lab", "contact_email": "lab@example.com"},
    )
    assert updated.status_code == 200, updated.text
    assert client.get("/api/v1/site-settings").json()["site_title"] == "Robotics Lab"


def test_homepage_settings_and_content_extensions(client, session_factory):
    token = login(client, session_factory)
    headers = {"Authorization": f"Bearer {token}"}

    settings_payload = {
        "lab_positioning": "A university robotics research and engineering lab.",
        "founded_year": 2018,
        "founding_background": "Built around field robotics research.",
        "core_platforms": ["Mobile robots", "Vision testbed"],
        "paper_count": 12,
        "patent_count": 5,
        "active_project_count": 3,
        "trained_student_count": 28,
        "papers_url": "https://example.com/papers",
        "join_url": "https://example.com/join",
        "cooperation_url": "https://example.com/cooperate",
    }
    updated_settings = client.patch(
        "/api/v1/admin/site-settings", headers=headers, json=settings_payload
    )
    assert updated_settings.status_code == 200, updated_settings.text
    settings = updated_settings.json()
    assert settings["lab_positioning"] == settings_payload["lab_positioning"]
    assert settings["founded_year"] == 2018
    assert settings["core_platforms"] == ["Mobile robots", "Vision testbed"]
    assert settings["paper_count"] == 12
    assert settings["papers_url"] == settings_payload["papers_url"]
    public_settings = client.get("/api/v1/site-settings")
    assert public_settings.status_code == 200
    assert public_settings.json()["trained_student_count"] == 28

    invalid_settings = (
        {"paper_count": -1},
        {"founded_year": 1799},
        {"core_platforms": ["  "]},
        {"core_platforms": ["platform"] * 9},
        {"papers_url": "ftp://example.com/papers"},
    )
    for payload in invalid_settings:
        response = client.patch(
            "/api/v1/admin/site-settings", headers=headers, json=payload
        )
        assert response.status_code == 422, response.text
        assert response.json()["error"]["code"] == "validation_error"

    project = client.post(
        "/api/v1/admin/projects",
        headers=headers,
        json={
            "slug": "homepage-demo",
            "title": "Homepage demo",
            "summary": "A public project summary.",
            "description": "A project used to verify the homepage contract.",
            "demo_url": "https://example.com/demo",
            "is_visible": True,
        },
    )
    assert project.status_code == 201, project.text
    project_data = project.json()
    assert project_data["demo_url"] == "https://example.com/demo"
    assert client.get("/api/v1/projects/homepage-demo").json()["demo_url"] == (
        "https://example.com/demo"
    )
    invalid_project = client.post(
        "/api/v1/admin/projects",
        headers=headers,
        json={
            "slug": "invalid-demo",
            "title": "Invalid demo",
            "description": "Invalid demo URL.",
            "demo_url": "ftp://example.com/demo",
        },
    )
    assert invalid_project.status_code == 422

    area = client.post(
        "/api/v1/admin/research-areas",
        headers=headers,
        json={
            "slug": "field-robotics",
            "title": "Field robotics",
            "description": "Robots operating in unstructured environments.",
            "problem_statement": "How can robots remain reliable outside the lab?",
            "application_scenarios": ["Inspection", "Rescue"],
            "representative_project_id": project_data["id"],
            "is_visible": True,
        },
    )
    assert area.status_code == 201, area.text
    area_data = area.json()
    assert area_data["representative_project_id"] == project_data["id"]
    assert area_data["representative_project"]["slug"] == "homepage-demo"
    public_area = client.get("/api/v1/research-areas")
    assert public_area.status_code == 200
    public_area_data = public_area.json()["items"][0]
    assert public_area_data["application_scenarios"] == ["Inspection", "Rescue"]
    assert public_area_data["representative_project"]["demo_url"] == (
        "https://example.com/demo"
    )

    invalid_reference = client.post(
        "/api/v1/admin/research-areas",
        headers=headers,
        json={
            "slug": "invalid-reference",
            "title": "Invalid reference",
            "description": "This should fail.",
            "representative_project_id": str(uuid4()),
        },
    )
    assert invalid_reference.status_code == 422
    assert invalid_reference.json()["error"]["code"] == "invalid_project_reference"

    deleted = client.delete(
        f"/api/v1/admin/projects/{project_data['id']}", headers=headers
    )
    assert deleted.status_code == 204, deleted.text
    admin_area = client.get(
        f"/api/v1/admin/research-areas/{area_data['id']}", headers=headers
    )
    assert admin_area.status_code == 200
    assert admin_area.json()["representative_project_id"] is None
    assert (
        client.get("/api/v1/research-areas").json()["items"][0][
            "representative_project"
        ]
        is None
    )
