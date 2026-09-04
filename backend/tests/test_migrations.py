import os
from datetime import datetime, timezone
from pathlib import Path
import subprocess
from uuid import uuid4

from sqlalchemy import create_engine, inspect, text


def run_alembic(
    project_root: Path, database_url: str, command: str, target: str
) -> None:
    environment = os.environ.copy()
    environment.pop("PYTHONPATH", None)
    environment["DATABASE_URL"] = database_url
    result = subprocess.run(
        ["alembic", "-c", "backend/alembic.ini", command, target],
        cwd=project_root,
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stdout + result.stderr


def test_initial_migration_creates_only_the_core_schema(tmp_path: Path) -> None:
    project_root = Path(__file__).resolve().parents[2]
    database_url = f"sqlite:///{(tmp_path / 'migration.db').as_posix()}"
    run_alembic(project_root, database_url, "upgrade", "head")

    engine = create_engine(database_url)
    try:
        tables = set(inspect(engine).get_table_names())
        assert tables == {
            "admins",
            "alembic_version",
            "awards",
            "media",
            "news",
            "projects",
            "research_areas",
            "site_settings",
        }
        award_columns = {
            column["name"]: column for column in inspect(engine).get_columns("awards")
        }
        assert award_columns["certificate_media_id"]["nullable"] is True
        site_columns = {
            column["name"]: column
            for column in inspect(engine).get_columns("site_settings")
        }
        assert site_columns["core_platforms"]["nullable"] is False
        assert site_columns["paper_count"]["nullable"] is False
        assert site_columns["trained_student_count"]["nullable"] is False
        assert site_columns["homepage_featured_awards_limit"]["nullable"] is False
        assert site_columns["homepage_gallery_limit"]["nullable"] is False
        project_columns = {
            column["name"]: column for column in inspect(engine).get_columns("projects")
        }
        assert project_columns["demo_url"]["nullable"] is True
        media_columns = {
            column["name"]: column for column in inspect(engine).get_columns("media")
        }
        assert media_columns["is_gallery"]["nullable"] is False
        assert media_columns["gallery_sort_order"]["nullable"] is False
        assert media_columns["gallery_is_visible"]["nullable"] is False
        research_columns = {
            column["name"]: column
            for column in inspect(engine).get_columns("research_areas")
        }
        assert research_columns["application_scenarios"]["nullable"] is False
        assert research_columns["representative_project_id"]["nullable"] is True
        research_fks = inspect(engine).get_foreign_keys("research_areas")
        representative_fk = next(
            foreign_key
            for foreign_key in research_fks
            if foreign_key["constrained_columns"] == ["representative_project_id"]
        )
        assert representative_fk["referred_table"] == "projects"
        assert representative_fk["options"]["ondelete"] == "SET NULL"
    finally:
        engine.dispose()

    run_alembic(project_root, database_url, "downgrade", "0001_initial")
    engine = create_engine(database_url)
    try:
        assert "demo_url" not in {
            column["name"] for column in inspect(engine).get_columns("projects")
        }
        assert "is_gallery" not in {
            column["name"] for column in inspect(engine).get_columns("media")
        }
        assert "representative_project_id" not in {
            column["name"] for column in inspect(engine).get_columns("research_areas")
        }
    finally:
        engine.dispose()

    run_alembic(project_root, database_url, "upgrade", "head")
    run_alembic(project_root, database_url, "downgrade", "base")
    engine = create_engine(database_url)
    try:
        assert inspect(engine).get_table_names() == ["alembic_version"]
    finally:
        engine.dispose()


def test_homepage_migration_backfills_existing_rows(tmp_path: Path) -> None:
    project_root = Path(__file__).resolve().parents[2]
    database_url = f"sqlite:///{(tmp_path / 'legacy.db').as_posix()}"
    run_alembic(project_root, database_url, "upgrade", "0001_initial")

    engine = create_engine(database_url)
    project_id = uuid4()
    try:
        now = datetime.now(timezone.utc)
        with engine.begin() as connection:
            connection.execute(
                text(
                    "INSERT INTO site_settings "
                    "(key, site_title, lab_name, created_at, updated_at) "
                    "VALUES (:key, :site_title, :lab_name, :created_at, :updated_at)"
                ),
                {
                    "key": "default",
                    "site_title": "Legacy site",
                    "lab_name": "Legacy lab",
                    "created_at": now,
                    "updated_at": now,
                },
            )
            connection.execute(
                text(
                    "INSERT INTO projects "
                    "(id, slug, title, description, sort_order, is_visible, "
                    "created_at, updated_at) "
                    "VALUES (:id, :slug, :title, :description, 0, 1, "
                    ":created_at, :updated_at)"
                ),
                {
                    "id": str(project_id),
                    "slug": "legacy-project",
                    "title": "Legacy project",
                    "description": "Existing content",
                    "created_at": now,
                    "updated_at": now,
                },
            )
            connection.execute(
                text(
                    "INSERT INTO research_areas "
                    "(id, slug, title, description, sort_order, is_visible, "
                    "created_at, updated_at) "
                    "VALUES (:id, :slug, :title, :description, 0, 1, "
                    ":created_at, :updated_at)"
                ),
                {
                    "id": str(uuid4()),
                    "slug": "legacy-area",
                    "title": "Legacy area",
                    "description": "Existing content",
                    "created_at": now,
                    "updated_at": now,
                },
            )
    finally:
        engine.dispose()

    run_alembic(project_root, database_url, "upgrade", "head")
    engine = create_engine(database_url)
    try:
        with engine.connect() as connection:
            settings = connection.execute(
                text(
                    "SELECT site_title, lab_name, core_platforms, paper_count, "
                    "patent_count, active_project_count, trained_student_count, "
                    "homepage_featured_awards_limit, homepage_gallery_limit "
                    "FROM site_settings WHERE key = 'default'"
                )
            ).one()
            assert settings == (
                "Legacy site",
                "Legacy lab",
                "[]",
                0,
                0,
                0,
                0,
                8,
                8,
            )
            area = connection.execute(
                text(
                    "SELECT application_scenarios, representative_project_id "
                    "FROM research_areas WHERE slug = 'legacy-area'"
                )
            ).one()
            assert area == ("[]", None)
    finally:
        engine.dispose()


def test_gallery_migration_promotes_public_cover_media(tmp_path: Path) -> None:
    project_root = Path(__file__).resolve().parents[2]
    database_url = f"sqlite:///{(tmp_path / 'gallery-legacy.db').as_posix()}"
    run_alembic(project_root, database_url, "upgrade", "0001_initial")

    engine = create_engine(database_url)
    cover_id = uuid4()
    certificate_id = uuid4()
    news_id = uuid4()
    award_id = uuid4()
    now = datetime.now(timezone.utc)
    try:
        with engine.begin() as connection:
            for media_id, name in (
                (cover_id, "scene.jpg"),
                (certificate_id, "certificate.jpg"),
            ):
                connection.execute(
                    text(
                        "INSERT INTO media "
                        "(id, original_name, mime_type, size_bytes, storage_key, "
                        "created_at, updated_at) "
                        "VALUES (:id, :name, 'image/jpeg', 10, :key, :now, :now)"
                    ),
                    {
                        "id": str(media_id),
                        "name": name,
                        "key": f"media/{media_id}.jpg",
                        "now": now,
                    },
                )
            connection.execute(
                text(
                    "INSERT INTO news "
                    "(id, slug, title, content, cover_media_id, sort_order, "
                    "is_visible, published_at, created_at, updated_at) "
                    "VALUES (:id, 'legacy-scene', 'Legacy scene', 'Archive', "
                    ":media_id, 3, 1, :now, :now, :now)"
                ),
                {"id": str(news_id), "media_id": str(cover_id), "now": now},
            )
            connection.execute(
                text(
                    "INSERT INTO awards "
                    "(id, title, category, level, issuer, competition_name, "
                    "description, award_date, year, certificate_media_id, "
                    "sort_order, is_featured, is_visible, created_at, updated_at) "
                    "VALUES (:id, 'Legacy award', 'honor', 'national', 'Lab', "
                    "'Competition', 'Archive', '2025-01-01', 2025, :media_id, "
                    "0, 0, 1, :now, :now)"
                ),
                {"id": str(award_id), "media_id": str(certificate_id), "now": now},
            )
    finally:
        engine.dispose()

    run_alembic(project_root, database_url, "upgrade", "head")
    engine = create_engine(database_url)
    try:
        with engine.connect() as connection:
            records = {
                row[0]: row[1:]
                for row in connection.execute(
                    text(
                        "SELECT id, is_gallery, gallery_title, gallery_is_visible "
                        "FROM media"
                    )
                )
            }
        assert records[str(cover_id)] == (1, "Legacy scene", 1)
        assert records[str(certificate_id)] == (0, None, 0)
    finally:
        engine.dispose()
