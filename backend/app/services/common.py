from math import ceil
from typing import TypeVar

from sqlalchemy import Select, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errors import AppError


T = TypeVar("T")


def commit_or_raise(
    db: Session, message: str = "The resource could not be saved"
) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise AppError(409, "conflict", message) from exc


def page_query(
    db: Session, query: Select[tuple[T]], page: int, page_size: int
) -> tuple[list[T], int, int]:
    total = (
        db.scalar(select(func.count()).select_from(query.order_by(None).subquery()))
        or 0
    )
    rows = list(db.scalars(query.offset((page - 1) * page_size).limit(page_size)).all())
    pages = ceil(total / page_size) if total else 0
    return rows, total, pages


def ensure_media_exists(db: Session, media_id: object | None) -> None:
    if media_id is None:
        return
    from app.models import Media

    if db.get(Media, media_id) is None:
        raise AppError(
            422, "invalid_media_reference", "Referenced media does not exist"
        )


def ensure_project_exists(db: Session, project_id: object | None) -> None:
    if project_id is None:
        return
    from app.models import Project

    if db.get(Project, project_id) is None:
        raise AppError(
            422,
            "invalid_project_reference",
            "Referenced project does not exist",
        )


def get_or_404(db: Session, model: type[T], identifier: object, resource: str) -> T:
    item = db.get(model, identifier)
    if item is None:
        raise AppError(404, "not_found", f"{resource} was not found")
    return item


def update_model(item: object, values: dict[str, object]) -> None:
    for field, value in values.items():
        setattr(item, field, value)
