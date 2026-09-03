from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db
from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.models import Award, Media, News, Project, ResearchArea, SiteSettings
from app.schemas import (
    AwardPublic,
    AwardSort,
    ErrorResponse,
    GalleryItemPublic,
    NewsPublic,
    PageResponse,
    ProjectPublic,
    ResearchAreaPublic,
    SiteSettingsPublic,
)
from app.services.common import page_query
from app.services.serializers import (
    award_public,
    gallery_item_public,
    news_public,
    project_public,
    research_area_public,
    site_settings_public,
)
from app.storage import LocalMediaStorage


router = APIRouter(tags=["public"], responses={422: {"model": ErrorResponse}})


def _visible_content(model: type[News] | type[Project]) -> object:
    now = datetime.now(timezone.utc)
    return and_(
        model.is_visible.is_(True),
        or_(model.published_at.is_(None), model.published_at <= now),
    )


def _page_response(
    items: list[object], page: int, page_size: int, total: int, pages: int
) -> dict[str, object]:
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "pages": pages,
    }


@router.get(
    "/news",
    response_model=PageResponse[NewsPublic],
    responses={422: {"model": ErrorResponse}},
    summary="List published news",
)
def list_news(
    request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    query = (
        select(News)
        .where(_visible_content(News))
        .options(joinedload(News.cover_media))
        .order_by(
            News.published_at.desc().nullslast(), News.sort_order.asc(), News.id.asc()
        )
    )
    items, total, pages = page_query(db, query, page, page_size)
    return _page_response(
        [news_public(item, request) for item in items], page, page_size, total, pages
    )


@router.get(
    "/news/{slug}", response_model=NewsPublic, responses={404: {"model": ErrorResponse}}
)
def get_news(slug: str, request: Request, db: Session = Depends(get_db)) -> NewsPublic:
    item = db.scalar(
        select(News)
        .where(News.slug == slug, _visible_content(News))
        .options(joinedload(News.cover_media))
    )
    if item is None:
        raise AppError(404, "not_found", "News was not found")
    return news_public(item, request)


@router.get(
    "/projects",
    response_model=PageResponse[ProjectPublic],
    responses={422: {"model": ErrorResponse}},
    summary="List published projects",
)
def list_projects(
    request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    query = (
        select(Project)
        .where(_visible_content(Project))
        .options(joinedload(Project.cover_media))
        .order_by(
            Project.sort_order.asc(),
            Project.published_at.desc().nullslast(),
            Project.id.asc(),
        )
    )
    items, total, pages = page_query(db, query, page, page_size)
    return _page_response(
        [project_public(item, request) for item in items], page, page_size, total, pages
    )


@router.get(
    "/projects/{slug}",
    response_model=ProjectPublic,
    responses={404: {"model": ErrorResponse}},
)
def get_project(
    slug: str, request: Request, db: Session = Depends(get_db)
) -> ProjectPublic:
    item = db.scalar(
        select(Project)
        .where(Project.slug == slug, _visible_content(Project))
        .options(joinedload(Project.cover_media))
    )
    if item is None:
        raise AppError(404, "not_found", "Project was not found")
    return project_public(item, request)


@router.get(
    "/research-areas",
    response_model=PageResponse[ResearchAreaPublic],
    responses={422: {"model": ErrorResponse}},
    summary="List visible research areas",
)
def list_research_areas(
    request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    query = (
        select(ResearchArea)
        .where(ResearchArea.is_visible.is_(True))
        .options(
            joinedload(ResearchArea.representative_project).joinedload(
                Project.cover_media
            )
        )
        .order_by(ResearchArea.sort_order.asc(), ResearchArea.id.asc())
    )
    items, total, pages = page_query(db, query, page, page_size)
    return _page_response(
        [research_area_public(item, request) for item in items],
        page,
        page_size,
        total,
        pages,
    )


@router.get(
    "/awards",
    response_model=PageResponse[AwardPublic],
    responses={422: {"model": ErrorResponse}},
    summary="List visible awards",
)
def list_awards(
    request: Request,
    featured: bool | None = Query(default=None),
    sort: AwardSort = Query(default=AwardSort.DATE_DESC),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    query = (
        select(Award)
        .where(Award.is_visible.is_(True))
        .options(joinedload(Award.certificate_media), joinedload(Award.cover_media))
    )
    if featured is not None:
        query = query.where(Award.is_featured.is_(featured))
    if sort == AwardSort.SORT_ORDER:
        query = query.order_by(
            Award.sort_order.asc(), Award.award_date.desc(), Award.id.asc()
        )
    else:
        query = query.order_by(
            Award.award_date.desc(), Award.sort_order.asc(), Award.id.asc()
        )
    items, total, pages = page_query(db, query, page, page_size)
    return _page_response(
        [award_public(item, request) for item in items], page, page_size, total, pages
    )


@router.get(
    "/awards/{award_id}",
    response_model=AwardPublic,
    responses={404: {"model": ErrorResponse}},
)
def get_award(
    award_id: UUID, request: Request, db: Session = Depends(get_db)
) -> AwardPublic:
    item = db.scalar(
        select(Award)
        .where(Award.id == award_id, Award.is_visible.is_(True))
        .options(joinedload(Award.certificate_media), joinedload(Award.cover_media))
    )
    if item is None:
        raise AppError(404, "not_found", "Award was not found")
    return award_public(item, request)


def _default_settings() -> SiteSettings:
    return SiteSettings(key="default")


def _get_or_create_settings(db: Session) -> SiteSettings:
    item = db.get(SiteSettings, "default")
    if item is None:
        item = _default_settings()
        db.add(item)
        db.commit()
        db.refresh(item)
    return item


@router.get("/site-settings", response_model=SiteSettingsPublic)
def get_site_settings(
    request: Request, db: Session = Depends(get_db)
) -> SiteSettingsPublic:
    item = _get_or_create_settings(db)
    return site_settings_public(item, request)


@router.get(
    "/gallery",
    response_model=PageResponse[GalleryItemPublic],
    responses={422: {"model": ErrorResponse}},
    summary="List visible gallery records",
)
def list_gallery(
    request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    query = (
        select(Media)
        .where(Media.is_gallery.is_(True), Media.gallery_is_visible.is_(True))
        .order_by(
            Media.gallery_sort_order.asc(), Media.created_at.desc(), Media.id.asc()
        )
    )
    items, total, pages = page_query(db, query, page, page_size)
    return _page_response(
        [gallery_item_public(item, request) for item in items],
        page,
        page_size,
        total,
        pages,
    )


@router.get(
    "/media/{storage_key:path}",
    name="media_file",
    response_class=FileResponse,
    include_in_schema=False,
)
def get_media_file(
    storage_key: str,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> FileResponse:
    media = db.scalar(select(Media).where(Media.storage_key == storage_key))
    if media is None:
        raise AppError(404, "not_found", "Media was not found")
    storage = LocalMediaStorage(settings.media_root)
    try:
        path = storage.resolve(storage_key)
    except ValueError as exc:
        raise AppError(404, "not_found", "Media was not found") from exc
    if not path.is_file():
        raise AppError(404, "not_found", "Media was not found")
    return FileResponse(path, media_type=media.mime_type, filename=media.original_name)
