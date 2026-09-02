from fastapi import Request

from app.models import Award, Media, News, Project, ResearchArea, SiteSettings
from app.schemas import (
    AdminPublic,
    AwardAdmin,
    AwardPublic,
    MediaAdmin,
    MediaPublic,
    NewsAdmin,
    NewsPublic,
    ProjectAdmin,
    ProjectPublic,
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


def research_area_public(item: ResearchArea) -> ResearchAreaPublic:
    return ResearchAreaPublic.model_validate(item, from_attributes=True)


def research_area_admin(item: ResearchArea) -> ResearchAreaAdmin:
    return ResearchAreaAdmin.model_validate(item, from_attributes=True)


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
        logo=media_public(item.logo_media, request),
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
    )


def admin_public(item: object) -> AdminPublic:
    return AdminPublic.model_validate(item, from_attributes=True)
