from datetime import datetime, timezone

from fastapi import Request

from app.models import Award, Media, News, Project, ResearchArea, SiteSettings
from app.schemas import (
    AdminPublic,
    AwardAdmin,
    AwardPublic,
    GalleryItemAdmin,
    GalleryItemPublic,
    MediaAdmin,
    MediaPublic,
    NewsAdmin,
    NewsPublic,
    ProjectAdmin,
    ProjectPublic,
    ProjectReferencePublic,
    ResearchAreaAdmin,
    ResearchAreaPublic,
    SiteSettingsAdmin,
    SiteSettingsPublic,
)


def media_public(media: Media | None, request: Request) -> MediaPublic | None:
    if media is None:
        return None
    return MediaPublic(
        id=media.id,
        original_name=media.original_name,
        mime_type=media.mime_type,
        size_bytes=media.size_bytes,
        width=media.width,
        height=media.height,
        url=str(request.url_for("media_file", storage_key=media.storage_key)),
    )


def media_admin(media: Media, request: Request) -> MediaAdmin:
    public = media_public(media, request)
    assert public is not None
    return MediaAdmin(
        **public.model_dump(),
        storage_key=media.storage_key,
        created_at=media.created_at,
        updated_at=media.updated_at,
    )


def gallery_item_public(item: Media, request: Request) -> GalleryItemPublic:
    public = media_public(item, request)
    assert public is not None
    return GalleryItemPublic(
        id=item.id,
        title=item.gallery_title or item.original_name,
        description=item.gallery_description,
        media=public,
        sort_order=item.gallery_sort_order,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def gallery_item_admin(item: Media, request: Request) -> GalleryItemAdmin:
    return GalleryItemAdmin(
        **gallery_item_public(item, request).model_dump(),
        media_id=item.id,
        is_visible=item.gallery_is_visible,
    )


def news_public(item: News, request: Request) -> NewsPublic:
    return NewsPublic(
        id=item.id,
        slug=item.slug,
        title=item.title,
        excerpt=item.excerpt,
        content=item.content,
        cover=media_public(item.cover_media, request),
        published_at=item.published_at,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def news_admin(item: News, request: Request) -> NewsAdmin:
    return NewsAdmin(
        **news_public(item, request).model_dump(),
        cover_media_id=item.cover_media_id,
        sort_order=item.sort_order,
        is_visible=item.is_visible,
    )


def project_public(item: Project, request: Request) -> ProjectPublic:
    return ProjectPublic(
        id=item.id,
        slug=item.slug,
        title=item.title,
        summary=item.summary,
        description=item.description,
        demo_url=item.demo_url,
        cover=media_public(item.cover_media, request),
        sort_order=item.sort_order,
        published_at=item.published_at,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def project_admin(item: Project, request: Request) -> ProjectAdmin:
    return ProjectAdmin(
        **project_public(item, request).model_dump(),
        cover_media_id=item.cover_media_id,
        is_visible=item.is_visible,
    )


def _project_is_public(item: Project) -> bool:
    if not item.is_visible:
        return False
    if item.published_at is None:
        return True
    published_at = item.published_at
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)
    return published_at <= datetime.now(timezone.utc)


def _project_reference(item: Project, request: Request) -> ProjectReferencePublic:
    return ProjectReferencePublic(
        id=item.id,
        slug=item.slug,
        title=item.title,
        summary=item.summary,
        cover=media_public(item.cover_media, request),
        demo_url=item.demo_url,
    )


def research_area_public(
    item: ResearchArea, request: Request, *, include_unpublished: bool = False
) -> ResearchAreaPublic:
    project = item.representative_project
    representative_project = (
        _project_reference(project, request)
        if project is not None and (include_unpublished or _project_is_public(project))
        else None
    )
    return ResearchAreaPublic(
        id=item.id,
        slug=item.slug,
        title=item.title,
        description=item.description,
        problem_statement=item.problem_statement,
        application_scenarios=item.application_scenarios,
        representative_project=representative_project,
        sort_order=item.sort_order,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def research_area_admin(item: ResearchArea, request: Request) -> ResearchAreaAdmin:
    return ResearchAreaAdmin(
        **research_area_public(item, request, include_unpublished=True).model_dump(),
        representative_project_id=item.representative_project_id,
        is_visible=item.is_visible,
    )


def award_public(item: Award, request: Request) -> AwardPublic:
    return AwardPublic(
        id=item.id,
        title=item.title,
        category=item.category,
        level=item.level,
        issuer=item.issuer,
        competition_name=item.competition_name,
        description=item.description,
        award_date=item.award_date,
        year=item.year,
        certificate_media_id=item.certificate_media_id,
        cover_media_id=item.cover_media_id,
        certificate=media_public(item.certificate_media, request),
        cover=media_public(item.cover_media, request),
        sort_order=item.sort_order,
        is_featured=item.is_featured,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def award_admin(item: Award, request: Request) -> AwardAdmin:
    return AwardAdmin(
        **award_public(item, request).model_dump(),
        is_visible=item.is_visible,
    )


def site_settings_public(item: SiteSettings, request: Request) -> SiteSettingsPublic:
    return SiteSettingsPublic(
        key=item.key,
        site_title=item.site_title,
        lab_name=item.lab_name,
        tagline=item.tagline,
        description=item.description,
        contact_email=item.contact_email,
        contact_phone=item.contact_phone,
        address=item.address,
        hero_title=item.hero_title,
        hero_subtitle=item.hero_subtitle,
        lab_positioning=item.lab_positioning,
        founded_year=item.founded_year,
        founding_background=item.founding_background,
        core_platforms=item.core_platforms,
        paper_count=item.paper_count,
        patent_count=item.patent_count,
        active_project_count=item.active_project_count,
        trained_student_count=item.trained_student_count,
        papers_url=item.papers_url,
        join_url=item.join_url,
        cooperation_url=item.cooperation_url,
        logo=media_public(item.logo_media, request),
        contact_qr_primary=media_public(item.contact_qr_primary_media, request),
        contact_qr_secondary=media_public(item.contact_qr_secondary_media, request),
        social_github=item.social_github,
        social_bilibili=item.social_bilibili,
        social_email=item.social_email,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def site_settings_admin(item: SiteSettings, request: Request) -> SiteSettingsAdmin:
    return SiteSettingsAdmin(
        **site_settings_public(item, request).model_dump(),
        logo_media_id=item.logo_media_id,
        contact_qr_primary_media_id=item.contact_qr_primary_media_id,
        contact_qr_secondary_media_id=item.contact_qr_secondary_media_id,
    )


def admin_public(item: object) -> AdminPublic:
    return AdminPublic.model_validate(item, from_attributes=True)
