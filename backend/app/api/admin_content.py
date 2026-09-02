from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, Request, UploadFile, status
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_admin, get_db
from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.models import Admin, Award, Media, News, Project, ResearchArea, SiteSettings
from app.schemas import (
    AwardAdmin,
    AwardCreate,
    AwardUpdate,
    ErrorResponse,
    MediaAdmin,
    NewsAdmin,
    NewsCreate,
    NewsUpdate,
    PageResponse,
    ProjectAdmin,
    ProjectCreate,
    ProjectUpdate,
    ResearchAreaAdmin,
    ResearchAreaCreate,
    ResearchAreaUpdate,
    SiteSettingsAdmin,
    SiteSettingsUpdate,
)
from app.services.common import (
    commit_or_raise,
    ensure_media_exists,
    get_or_404,
    page_query,
    update_model,
)
from app.services.serializers import (
    award_admin,
    media_admin,
    news_admin,
    project_admin,
    research_area_admin,
    site_settings_admin,
)
from app.storage import LocalMediaStorage, normalize_filename


router = APIRouter(
    prefix="/admin",
    tags=["admin-content"],
    dependencies=[Depends(get_current_admin)],
    responses={401: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
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


def _ensure_unique_slug(
    db: Session,
    model: type[News] | type[Project] | type[ResearchArea],
    slug: str,
    item_id: UUID | None = None,
) -> None:
    query = select(model).where(model.slug == slug)
    if item_id is not None:
        query = query.where(model.id != item_id)
    if db.scalar(query) is not None:
        raise AppError(
            409, "duplicate_slug", "A resource with this slug already exists"
        )


def _visible_filter(model: type[News] | type[Project]) -> object:
    now = datetime.now(timezone.utc)
    return and_(
        model.is_visible.is_(True),
        or_(model.published_at.is_(None), model.published_at <= now),
    )


def _admin_id(admin: Admin) -> Admin:
    return admin


@router.get("/news", response_model=PageResponse[NewsAdmin])
def list_admin_news(
    request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    query = (
        select(News)
        .options(joinedload(News.cover_media))
        .order_by(
            News.published_at.desc().nullslast(), News.sort_order.asc(), News.id.asc()
        )
    )
    items, total, pages = page_query(db, query, page, page_size)
    return _page_response(
        [news_admin(item, request) for item in items], page, page_size, total, pages
    )


@router.get(
    "/news/{news_id}",
    response_model=NewsAdmin,
    responses={404: {"model": ErrorResponse}},
)
def get_admin_news(
    news_id: UUID, request: Request, db: Session = Depends(get_db)
) -> NewsAdmin:
    item = db.scalar(
        select(News).where(News.id == news_id).options(joinedload(News.cover_media))
    )
    if item is None:
        raise AppError(404, "not_found", "News was not found")
    return news_admin(item, request)


@router.post("/news", response_model=NewsAdmin, status_code=status.HTTP_201_CREATED)
def create_news(
    payload: NewsCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> NewsAdmin:
    _ensure_unique_slug(db, News, payload.slug)
    ensure_media_exists(db, payload.cover_media_id)
    item = News(**payload.model_dump())
    db.add(item)
    commit_or_raise(db, "A news item with this slug already exists")
    db.refresh(item)
    return news_admin(item, request)


@router.patch(
    "/news/{news_id}",
    response_model=NewsAdmin,
    responses={404: {"model": ErrorResponse}},
)
def update_news(
    news_id: UUID,
    payload: NewsUpdate,
    request: Request,
    db: Session = Depends(get_db),
) -> NewsAdmin:
    item = get_or_404(db, News, news_id, "News")
    values = payload.model_dump(exclude_unset=True)
    if "slug" in values:
        _ensure_unique_slug(db, News, values["slug"], news_id)
    if "cover_media_id" in values:
        ensure_media_exists(db, values["cover_media_id"])
    update_model(item, values)
    commit_or_raise(db, "A news item with this slug already exists")
    db.refresh(item)
    return news_admin(item, request)


@router.post(
    "/news/{news_id}/publish",
    response_model=NewsAdmin,
    responses={404: {"model": ErrorResponse}},
)
def publish_news(
    news_id: UUID, request: Request, db: Session = Depends(get_db)
) -> NewsAdmin:
    item = get_or_404(db, News, news_id, "News")
    item.is_visible = True
    item.published_at = item.published_at or datetime.now(timezone.utc)
    commit_or_raise(db)
    db.refresh(item)
    return news_admin(item, request)


@router.delete(
    "/news/{news_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"model": ErrorResponse}},
)
def delete_news(news_id: UUID, db: Session = Depends(get_db)) -> None:
    item = get_or_404(db, News, news_id, "News")
    db.delete(item)
    commit_or_raise(db)


@router.get("/projects", response_model=PageResponse[ProjectAdmin])
def list_admin_projects(
    request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    query = (
        select(Project)
        .options(joinedload(Project.cover_media))
        .order_by(
            Project.sort_order.asc(),
            Project.published_at.desc().nullslast(),
            Project.id.asc(),
        )
    )
    items, total, pages = page_query(db, query, page, page_size)
    return _page_response(
        [project_admin(item, request) for item in items], page, page_size, total, pages
    )


@router.get(
    "/projects/{project_id}",
    response_model=ProjectAdmin,
    responses={404: {"model": ErrorResponse}},
)
def get_admin_project(
    project_id: UUID, request: Request, db: Session = Depends(get_db)
) -> ProjectAdmin:
    item = db.scalar(
        select(Project)
        .where(Project.id == project_id)
        .options(joinedload(Project.cover_media))
    )
    if item is None:
        raise AppError(404, "not_found", "Project was not found")
    return project_admin(item, request)


@router.post(
    "/projects", response_model=ProjectAdmin, status_code=status.HTTP_201_CREATED
)
def create_project(
    payload: ProjectCreate, request: Request, db: Session = Depends(get_db)
) -> ProjectAdmin:
    _ensure_unique_slug(db, Project, payload.slug)
    ensure_media_exists(db, payload.cover_media_id)
    item = Project(**payload.model_dump())
    db.add(item)
    commit_or_raise(db, "A project with this slug already exists")
    db.refresh(item)
    return project_admin(item, request)


@router.patch(
    "/projects/{project_id}",
    response_model=ProjectAdmin,
    responses={404: {"model": ErrorResponse}},
)
def update_project(
    project_id: UUID,
    payload: ProjectUpdate,
    request: Request,
    db: Session = Depends(get_db),
) -> ProjectAdmin:
    item = get_or_404(db, Project, project_id, "Project")
    values = payload.model_dump(exclude_unset=True)
    if "slug" in values:
        _ensure_unique_slug(db, Project, values["slug"], project_id)
    if "cover_media_id" in values:
        ensure_media_exists(db, values["cover_media_id"])
    update_model(item, values)
    commit_or_raise(db, "A project with this slug already exists")
    db.refresh(item)
    return project_admin(item, request)


@router.post(
    "/projects/{project_id}/publish",
    response_model=ProjectAdmin,
    responses={404: {"model": ErrorResponse}},
)
def publish_project(
    project_id: UUID, request: Request, db: Session = Depends(get_db)
) -> ProjectAdmin:
    item = get_or_404(db, Project, project_id, "Project")
    item.is_visible = True
    item.published_at = item.published_at or datetime.now(timezone.utc)
    commit_or_raise(db)
    db.refresh(item)
    return project_admin(item, request)


@router.delete(
    "/projects/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"model": ErrorResponse}},
)
def delete_project(project_id: UUID, db: Session = Depends(get_db)) -> None:
    item = get_or_404(db, Project, project_id, "Project")
    db.delete(item)
    commit_or_raise(db)


@router.get("/research-areas", response_model=PageResponse[ResearchAreaAdmin])
def list_admin_research_areas(
    request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    query = select(ResearchArea).order_by(
        ResearchArea.sort_order.asc(), ResearchArea.id.asc()
    )
    items, total, pages = page_query(db, query, page, page_size)
    return _page_response(
        [research_area_admin(item) for item in items], page, page_size, total, pages
    )


@router.get(
    "/research-areas/{area_id}",
    response_model=ResearchAreaAdmin,
    responses={404: {"model": ErrorResponse}},
)
def get_admin_research_area(
    area_id: UUID, db: Session = Depends(get_db)
) -> ResearchAreaAdmin:
    return research_area_admin(get_or_404(db, ResearchArea, area_id, "Research area"))


@router.post(
    "/research-areas",
    response_model=ResearchAreaAdmin,
    status_code=status.HTTP_201_CREATED,
)
def create_research_area(
    payload: ResearchAreaCreate, db: Session = Depends(get_db)
) -> ResearchAreaAdmin:
    _ensure_unique_slug(db, ResearchArea, payload.slug)
    item = ResearchArea(**payload.model_dump())
    db.add(item)
    commit_or_raise(db, "A research area with this slug already exists")
    db.refresh(item)
    return research_area_admin(item)


@router.patch(
    "/research-areas/{area_id}",
    response_model=ResearchAreaAdmin,
    responses={404: {"model": ErrorResponse}},
)
def update_research_area(
    area_id: UUID,
    payload: ResearchAreaUpdate,
    db: Session = Depends(get_db),
) -> ResearchAreaAdmin:
    item = get_or_404(db, ResearchArea, area_id, "Research area")
    values = payload.model_dump(exclude_unset=True)
    if "slug" in values:
        _ensure_unique_slug(db, ResearchArea, values["slug"], area_id)
    update_model(item, values)
    commit_or_raise(db, "A research area with this slug already exists")
    db.refresh(item)
    return research_area_admin(item)


@router.delete(
    "/research-areas/{area_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"model": ErrorResponse}},
)
def delete_research_area(area_id: UUID, db: Session = Depends(get_db)) -> None:
    item = get_or_404(db, ResearchArea, area_id, "Research area")
    db.delete(item)
    commit_or_raise(db)


@router.get("/awards", response_model=PageResponse[AwardAdmin])
def list_admin_awards(
    request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    query = (
        select(Award)
        .options(joinedload(Award.certificate_media), joinedload(Award.cover_media))
        .order_by(Award.award_date.desc(), Award.sort_order.asc(), Award.id.asc())
    )
    items, total, pages = page_query(db, query, page, page_size)
    return _page_response(
        [award_admin(item, request) for item in items], page, page_size, total, pages
    )


@router.get(
    "/awards/{award_id}",
    response_model=AwardAdmin,
    responses={404: {"model": ErrorResponse}},
)
def get_admin_award(
    award_id: UUID, request: Request, db: Session = Depends(get_db)
) -> AwardAdmin:
    item = db.scalar(
        select(Award)
        .where(Award.id == award_id)
        .options(joinedload(Award.certificate_media), joinedload(Award.cover_media))
    )
    if item is None:
        raise AppError(404, "not_found", "Award was not found")
    return award_admin(item, request)


def _ensure_award_media(
    db: Session, certificate_media_id: UUID | None, cover_media_id: UUID | None
) -> None:
    ensure_media_exists(db, certificate_media_id)
    ensure_media_exists(db, cover_media_id)


@router.post("/awards", response_model=AwardAdmin, status_code=status.HTTP_201_CREATED)
def create_award(
    payload: AwardCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> AwardAdmin:
    _ensure_award_media(db, payload.certificate_media_id, payload.cover_media_id)
    item = Award(**payload.model_dump())
    db.add(item)
    commit_or_raise(db)
    db.refresh(item)
    return award_admin(item, request)


@router.patch(
    "/awards/{award_id}",
    response_model=AwardAdmin,
    responses={404: {"model": ErrorResponse}},
)
def update_award(
    award_id: UUID,
    payload: AwardUpdate,
    request: Request,
    db: Session = Depends(get_db),
) -> AwardAdmin:
    item = get_or_404(db, Award, award_id, "Award")
    values = payload.model_dump(exclude_unset=True)
    if "certificate_media_id" in values:
        ensure_media_exists(db, values["certificate_media_id"])
    if "cover_media_id" in values:
        ensure_media_exists(db, values["cover_media_id"])
    update_model(item, values)
    commit_or_raise(db)
    db.refresh(item)
    return award_admin(item, request)


@router.delete(
    "/awards/{award_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"model": ErrorResponse}},
)
def delete_award(award_id: UUID, db: Session = Depends(get_db)) -> None:
    item = get_or_404(db, Award, award_id, "Award")
    db.delete(item)
    commit_or_raise(db)


@router.get("/media", response_model=PageResponse[MediaAdmin])
def list_admin_media(
    request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    query = select(Media).order_by(Media.created_at.desc(), Media.id.asc())
    items, total, pages = page_query(db, query, page, page_size)
    return _page_response(
        [media_admin(item, request) for item in items], page, page_size, total, pages
    )


@router.post("/media", response_model=MediaAdmin, status_code=status.HTTP_201_CREATED)
def upload_media(
    request: Request,
    upload: UploadFile = File(..., description="An image file"),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> MediaAdmin:
    mime_type = (upload.content_type or "").lower()
    if mime_type not in settings.allowed_mime_types:
        raise AppError(
            422,
            "unsupported_media_type",
            "Only configured image MIME types are accepted",
        )
    content = upload.file.read(settings.max_upload_bytes + 1)
    if len(content) > settings.max_upload_bytes:
        raise AppError(
            413, "upload_too_large", "The image exceeds the configured byte limit"
        )
    if not content:
        raise AppError(422, "invalid_image", "The uploaded image is empty")

    from io import BytesIO

    from PIL import Image, UnidentifiedImageError

    try:
        with Image.open(BytesIO(content)) as image:
            image.verify()
        with Image.open(BytesIO(content)) as image:
            width, height = image.size
            detected_mime = Image.MIME.get(image.format)
    except (UnidentifiedImageError, OSError) as exc:
        raise AppError(
            422, "invalid_image", "The uploaded file is not a valid image"
        ) from exc
    if detected_mime not in settings.allowed_mime_types:
        raise AppError(
            422, "unsupported_media_type", "The image format is not configured"
        )
    if width * height > settings.max_image_pixels:
        raise AppError(
            422,
            "image_dimensions_too_large",
            "The image exceeds the configured pixel limit",
        )

    storage = LocalMediaStorage(settings.media_root)
    normalized_name = normalize_filename(upload.filename or "upload")
    storage_key = storage.save(content, normalized_name, detected_mime)
    item = Media(
        original_name=normalized_name,
        mime_type=detected_mime,
        size_bytes=len(content),
        width=width,
        height=height,
        storage_key=storage_key,
    )
    db.add(item)
    try:
        commit_or_raise(db)
    except AppError:
        storage.delete(storage_key)
        raise
    db.refresh(item)
    return media_admin(item, request)


def _media_references(db: Session, media_id: UUID) -> bool:
    reference_queries = (
        select(News.id).where(News.cover_media_id == media_id).limit(1),
        select(Project.id).where(Project.cover_media_id == media_id).limit(1),
        select(Award.id)
        .where(
            or_(
                Award.certificate_media_id == media_id, Award.cover_media_id == media_id
            )
        )
        .limit(1),
        select(SiteSettings.key).where(SiteSettings.logo_media_id == media_id).limit(1),
    )
    return any(db.scalar(query) is not None for query in reference_queries)


@router.delete(
    "/media/{media_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"model": ErrorResponse}},
)
def delete_media(
    media_id: UUID,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> None:
    item = get_or_404(db, Media, media_id, "Media")
    if _media_references(db, media_id):
        raise AppError(
            409, "media_in_use", "Detach this media from content before deleting it"
        )
    storage_key = item.storage_key
    db.delete(item)
    commit_or_raise(db)
    LocalMediaStorage(settings.media_root).delete(storage_key)


@router.get("/site-settings", response_model=SiteSettingsAdmin)
def get_admin_site_settings(
    request: Request, db: Session = Depends(get_db)
) -> SiteSettingsAdmin:
    item = db.get(SiteSettings, "default")
    if item is None:
        item = SiteSettings(key="default")
        db.add(item)
        commit_or_raise(db)
        db.refresh(item)
    return site_settings_admin(item, request)


def _update_site_settings(
    payload: SiteSettingsUpdate,
    request: Request,
    db: Session,
) -> SiteSettingsAdmin:
    item = db.get(SiteSettings, "default")
    if item is None:
        item = SiteSettings(key="default")
        db.add(item)
    values = payload.model_dump(exclude_unset=True)
    if "logo_media_id" in values:
        ensure_media_exists(db, values["logo_media_id"])
    update_model(item, values)
    commit_or_raise(db)
    db.refresh(item)
    return site_settings_admin(item, request)


@router.put("/site-settings", response_model=SiteSettingsAdmin)
def put_site_settings(
    payload: SiteSettingsUpdate, request: Request, db: Session = Depends(get_db)
) -> SiteSettingsAdmin:
    return _update_site_settings(payload, request, db)


@router.patch("/site-settings", response_model=SiteSettingsAdmin)
def patch_site_settings(
    payload: SiteSettingsUpdate, request: Request, db: Session = Depends(get_db)
) -> SiteSettingsAdmin:
    return _update_site_settings(payload, request, db)
