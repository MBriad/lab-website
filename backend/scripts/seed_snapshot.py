"""Seed an empty deployment database from the tracked SQLite snapshot.

The repository snapshot keeps the current local CMS content reproducible for a
fresh Docker checkout. The import is deliberately one-shot and only runs when
all content tables are empty; an operator's later edits are never overwritten.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

from sqlalchemy import create_engine, func, select

backend_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_root))

from app.db.session import SessionLocal
from app.models import Award, Media, News, Project, ResearchArea, SiteSettings


SNAPSHOT_MODELS = (Media, News, Project, ResearchArea, Award, SiteSettings)


def has_content() -> bool:
    """Return whether the target database already contains CMS content."""

    with SessionLocal() as db:
        return any(
            db.scalar(select(func.count()).select_from(model))
            for model in SNAPSHOT_MODELS
        )


def seed_snapshot(snapshot_path: Path) -> int:
    """Copy snapshot rows into the configured target database.

    Returns the number of rows inserted. The target transaction is rolled back
    automatically if any table cannot be copied.
    """

    if not snapshot_path.is_file():
        print(f"CMS snapshot not found; skipping: {snapshot_path}")
        return 0
    if has_content():
        print("CMS database already contains content; snapshot import skipped")
        return 0

    source_engine = create_engine(f"sqlite:///{snapshot_path.as_posix()}")
    inserted = 0
    try:
        with source_engine.connect() as source, SessionLocal() as target:
            for model in SNAPSHOT_MODELS:
                rows = source.execute(select(model.__table__)).mappings().all()
                if not rows:
                    continue
                target.execute(model.__table__.insert(), [dict(row) for row in rows])
                inserted += len(rows)
            target.commit()
    finally:
        source_engine.dispose()

    print(f"Imported {inserted} CMS snapshot rows")
    return inserted


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--snapshot", type=Path, required=True)
    parser.add_argument("--marker", type=Path)
    args = parser.parse_args()

    if args.marker and args.marker.exists():
        print(f"CMS snapshot marker exists; import skipped: {args.marker}")
        return

    seed_snapshot(args.snapshot)
    if args.marker:
        args.marker.parent.mkdir(parents=True, exist_ok=True)
        args.marker.touch()


if __name__ == "__main__":
    main()
