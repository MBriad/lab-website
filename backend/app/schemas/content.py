from datetime import date, datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, SecretStr, field_validator

from app.models import AwardCategory, AwardLevel
from app.schemas.common import MediaPublic


Slug = str


def validate_slug(value: str) -> str:
    normalized = value.strip().lower()
    if not normalized or any(
        char not in "abcdefghijklmnopqrstuvwxyz0123456789-" for char in normalized
    ):
        raise ValueError(
            "slug must contain only lowercase letters, numbers, and hyphens"
        )
    if normalized.startswith("-") or normalized.endswith("-") or "--" in normalized:
        raise ValueError(
            "slug must not start/end with a hyphen or contain consecutive hyphens"
        )
    return normalized


def validate_text(value: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise ValueError("value must not be blank")
    return normalized


class NewsCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str = Field(min_length=1, max_length=160)
    title: str = Field(min_length=1, max_length=255)
    excerpt: str | None = Field(default=None, max_length=10_000)
    content: str = Field(min_length=1)
    cover_media_id: UUID | None = None
    sort_order: int = Field(default=0, ge=0)
    is_visible: bool = False
    published_at: datetime | None = None

    _slug = field_validator("slug")(validate_slug)
    _title = field_validator("title")(validate_text)
    _content = field_validator("content")(validate_text)


class NewsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str | None = Field(default=None, min_length=1, max_length=160)
    title: str | None = Field(default=None, min_length=1, max_length=255)
    excerpt: str | None = Field(default=None, max_length=10_000)
    content: str | None = Field(default=None, min_length=1)
    cover_media_id: UUID | None = None
    sort_order: int | None = Field(default=None, ge=0)
    is_visible: bool | None = None
    published_at: datetime | None = None

    _slug = field_validator("slug")(validate_slug)
    _title = field_validator("title")(validate_text)
    _content = field_validator("content")(validate_text)


class NewsPublic(BaseModel):
    id: UUID
    slug: str
    title: str
    excerpt: str | None
    content: str
    cover: MediaPublic | None
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime


class NewsAdmin(NewsPublic):
    cover_media_id: UUID | None
    sort_order: int
    is_visible: bool


class ProjectCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str = Field(min_length=1, max_length=160)
    title: str = Field(min_length=1, max_length=255)
    summary: str | None = Field(default=None, max_length=10_000)
    description: str = Field(min_length=1)
    cover_media_id: UUID | None = None
    sort_order: int = Field(default=0, ge=0)
    is_visible: bool = False
    published_at: datetime | None = None

    _slug = field_validator("slug")(validate_slug)
    _title = field_validator("title")(validate_text)
    _description = field_validator("description")(validate_text)


class ProjectUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str | None = Field(default=None, min_length=1, max_length=160)
    title: str | None = Field(default=None, min_length=1, max_length=255)
    summary: str | None = Field(default=None, max_length=10_000)
    description: str | None = Field(default=None, min_length=1)
    cover_media_id: UUID | None = None
    sort_order: int | None = Field(default=None, ge=0)
    is_visible: bool | None = None
    published_at: datetime | None = None

    _slug = field_validator("slug")(validate_slug)
    _title = field_validator("title")(validate_text)
    _description = field_validator("description")(validate_text)


class ProjectPublic(BaseModel):
    id: UUID
    slug: str
    title: str
    summary: str | None
    description: str
    cover: MediaPublic | None
    sort_order: int
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime


class ProjectAdmin(ProjectPublic):
    cover_media_id: UUID | None
    is_visible: bool


class ResearchAreaCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str = Field(min_length=1, max_length=160)
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    sort_order: int = Field(default=0, ge=0)
    is_visible: bool = False

    _slug = field_validator("slug")(validate_slug)
    _title = field_validator("title")(validate_text)
    _description = field_validator("description")(validate_text)


class ResearchAreaUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str | None = Field(default=None, min_length=1, max_length=160)
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    sort_order: int | None = Field(default=None, ge=0)
    is_visible: bool | None = None

    _slug = field_validator("slug")(validate_slug)
    _title = field_validator("title")(validate_text)
    _description = field_validator("description")(validate_text)


class ResearchAreaPublic(BaseModel):
    id: UUID
    slug: str
    title: str
    description: str
    sort_order: int
    created_at: datetime
    updated_at: datetime


class ResearchAreaAdmin(ResearchAreaPublic):
    is_visible: bool


class AwardSort(str, Enum):
    DATE_DESC = "date_desc"
    SORT_ORDER = "sort_order"


class AwardCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=255)
    category: AwardCategory
    level: AwardLevel
    issuer: str = Field(min_length=1, max_length=255)
    competition_name: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    award_date: date
    year: int = Field(ge=1900, le=2200)
    certificate_media_id: UUID | None = None
    cover_media_id: UUID | None = None
    sort_order: int = Field(default=0, ge=0)
    is_featured: bool = False
    is_visible: bool = False

    _title = field_validator("title")(validate_text)
    _issuer = field_validator("issuer")(validate_text)
    _competition = field_validator("competition_name")(validate_text)
    _description = field_validator("description")(validate_text)


class AwardUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=255)
    category: AwardCategory | None = None
    level: AwardLevel | None = None
    issuer: str | None = Field(default=None, min_length=1, max_length=255)
    competition_name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    award_date: date | None = None
    year: int | None = Field(default=None, ge=1900, le=2200)
    certificate_media_id: UUID | None = None
    cover_media_id: UUID | None = None
    sort_order: int | None = Field(default=None, ge=0)
    is_featured: bool | None = None
    is_visible: bool | None = None

    _title = field_validator("title")(validate_text)
    _issuer = field_validator("issuer")(validate_text)
    _competition = field_validator("competition_name")(validate_text)
    _description = field_validator("description")(validate_text)


class AwardPublic(BaseModel):
    id: UUID
    title: str
    category: AwardCategory
    level: AwardLevel
    issuer: str
    competition_name: str
    description: str
    award_date: date
    year: int
    certificate_media_id: UUID | None
    cover_media_id: UUID | None
    certificate: MediaPublic | None
    cover: MediaPublic | None
    sort_order: int
    is_featured: bool
    created_at: datetime
    updated_at: datetime


class AwardAdmin(AwardPublic):
    is_visible: bool


class SiteSettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    site_title: str | None = Field(default=None, max_length=255)
    lab_name: str | None = Field(default=None, max_length=255)
    tagline: str | None = Field(default=None, max_length=255)
    description: str | None = None
    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(default=None, max_length=80)
    address: str | None = Field(default=None, max_length=500)
    hero_title: str | None = Field(default=None, max_length=255)
    hero_subtitle: str | None = None
    logo_media_id: UUID | None = None
    social_github: str | None = Field(default=None, max_length=500)
    social_bilibili: str | None = Field(default=None, max_length=500)
    social_email: EmailStr | None = None


class SiteSettingsPublic(BaseModel):
    key: str
    site_title: str
    lab_name: str
    tagline: str | None
    description: str | None
    contact_email: EmailStr | None
    contact_phone: str | None
    address: str | None
    hero_title: str | None
    hero_subtitle: str | None
    logo: MediaPublic | None
    social_github: str | None
    social_bilibili: str | None
    social_email: EmailStr | None
    created_at: datetime
    updated_at: datetime


class SiteSettingsAdmin(SiteSettingsPublic):
    logo_media_id: UUID | None


class AdminLoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str = Field(min_length=1, max_length=100)
    password: SecretStr = Field(min_length=1, max_length=256)


class AdminPublic(BaseModel):
    id: UUID
    username: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    admin: AdminPublic
