import os
from pathlib import Path
import subprocess

from sqlalchemy import create_engine, inspect


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
    finally:
        engine.dispose()

    run_alembic(project_root, database_url, "downgrade", "base")
    engine = create_engine(database_url)
    try:
        assert inspect(engine).get_table_names() == ["alembic_version"]
    finally:
        engine.dispose()
