from datetime import date, datetime
from enum import Enum
from typing import Annotated
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    HttpUrl,
    SecretStr,
    field_validator,
)

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


def validate_string_list(
    value: object, *, field_name: str, max_items: int, max_item_length: int
) -> list[str]:
    if not isinstance(value, list):
        raise ValueError(f"{field_name} must be a list")
    if len(value) > max_items:
        raise ValueError(f"{field_name} must contain at most {max_items} items")

    normalized: list[str] = []
    for item in value:
        if not isinstance(item, str):
            raise ValueError(f"{field_name} items must be strings")
        item = item.strip()
        if not item:
            raise ValueError(f"{field_name} items must not be blank")
        if len(item) > max_item_length:
            raise ValueError(
                f"{field_name} items must be at most {max_item_length} characters"
            )
        normalized.append(item)
    return normalized


PlatformName = Annotated[str, Field(min_length=1, max_length=120)]
ApplicationScenario = Annotated[str, Field(min_length=1, max_length=160)]
HttpUrlValue = Annotated[
    HttpUrl,
    Field(
        max_length=500,
        json_schema_extra={"pattern": r"^https?://"},
    ),
]


class GalleryItemCreate(BaseModel):
    """Create an independent visual-archive record for an existing media file."""

    model_config = ConfigDict(extra="forbid")

    media_id: UUID
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=10_000)
    sort_order: int = Field(default=0, ge=0)
    is_visible: bool = False

    _title = field_validator("title")(validate_text)


class GalleryItemUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Omitted means keep the current media; null is rejected by the route so a
    # gallery record can never lose its required image reference.
    media_id: UUID | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=10_000)
    sort_order: int | None = Field(default=None, ge=0)
    is_visible: bool | None = None

    _title = field_validator("title")(validate_text)


class GalleryItemPublic(BaseModel):
    id: UUID
    title: str
    description: str | None
    media: MediaPublic
    sort_order: int
    created_at: datetime
    updated_at: datetime


class GalleryItemAdmin(GalleryItemPublic):
    media_id: UUID
    is_visible: bool


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
    demo_url: HttpUrlValue | None = None
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
    demo_url: HttpUrlValue | None = None
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
    demo_url: HttpUrlValue | None
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
    problem_statement: str | None = None
    application_scenarios: list[ApplicationScenario] = Field(
        default_factory=list, max_length=6
    )
    representative_project_id: UUID | None = None
    sort_order: int = Field(default=0, ge=0)
    is_visible: bool = False

    _slug = field_validator("slug")(validate_slug)
    _title = field_validator("title")(validate_text)
    _description = field_validator("description")(validate_text)

    @field_validator("application_scenarios", mode="before")
    @classmethod
    def _application_scenarios(cls, value: object) -> list[str]:
        return validate_string_list(
            value,
            field_name="application_scenarios",
            max_items=6,
            max_item_length=160,
        )


class ResearchAreaUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str | None = Field(default=None, min_length=1, max_length=160)
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    problem_statement: str | None = None
    application_scenarios: list[ApplicationScenario] = Field(default=None, max_length=6)
    representative_project_id: UUID | None = None
    sort_order: int | None = Field(default=None, ge=0)
    is_visible: bool | None = None

    _slug = field_validator("slug")(validate_slug)
    _title = field_validator("title")(validate_text)
    _description = field_validator("description")(validate_text)

    @field_validator("application_scenarios", mode="before")
    @classmethod
    def _application_scenarios(cls, value: object) -> list[str]:
        return validate_string_list(
            value,
            field_name="application_scenarios",
            max_items=6,
            max_item_length=160,
        )


class ProjectReferencePublic(BaseModel):
    id: UUID
    slug: str
    title: str
    summary: str | None
    cover: MediaPublic | None
    demo_url: HttpUrlValue | None


class ResearchAreaPublic(BaseModel):
    id: UUID
    slug: str
    title: str
    description: str
    problem_statement: str | None
    application_scenarios: list[ApplicationScenario] = Field(max_length=6)
    representative_project: ProjectReferencePublic | None
    sort_order: int
    created_at: datetime
    updated_at: datetime


class ResearchAreaAdmin(ResearchAreaPublic):
    representative_project_id: UUID | None
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
    lab_positioning: str | None = None
    founded_year: int | None = Field(default=None, ge=1800, le=2200)
    founding_background: str | None = None
    core_platforms: list[PlatformName] = Field(default=None, max_length=8)
    paper_count: int = Field(default=None, ge=0)
    patent_count: int = Field(default=None, ge=0)
    active_project_count: int = Field(default=None, ge=0)
    trained_student_count: int = Field(default=None, ge=0)
    papers_url: HttpUrlValue | None = None
    join_url: HttpUrlValue | None = None
    cooperation_url: HttpUrlValue | None = None
    logo_media_id: UUID | None = None
    social_github: str | None = Field(default=None, max_length=500)
    social_bilibili: str | None = Field(default=None, max_length=500)
    social_email: EmailStr | None = None

    @field_validator("core_platforms", mode="before")
    @classmethod
    def _core_platforms(cls, value: object) -> list[str]:
        return validate_string_list(
            value,
            field_name="core_platforms",
            max_items=8,
            max_item_length=120,
        )


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
    lab_positioning: str | None
    founded_year: int | None
    founding_background: str | None
    core_platforms: list[PlatformName] = Field(max_length=8)
    paper_count: int = Field(ge=0)
    patent_count: int = Field(ge=0)
    active_project_count: int = Field(ge=0)
    trained_student_count: int = Field(ge=0)
    papers_url: HttpUrlValue | None
    join_url: HttpUrlValue | None
    cooperation_url: HttpUrlValue | None
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
