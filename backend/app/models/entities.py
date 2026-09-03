from datetime import date, datetime, timezone
from enum import Enum
import uuid

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum as SqlEnum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AwardCategory(str, Enum):
    COMPETITION = "competition"
    RESEARCH = "research"
    INNOVATION = "innovation"
    HONOR = "honor"
    OTHER = "other"


class AwardLevel(str, Enum):
    NATIONAL = "national"
    PROVINCIAL = "provincial"
    MUNICIPAL = "municipal"
    UNIVERSITY = "university"
    OTHER = "other"


def enum_values(enum_type: type[Enum]) -> list[str]:
    return [enum_item.value for enum_item in enum_type]


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )


class Media(TimestampMixin, Base):
    __tablename__ = "media"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    storage_key: Mapped[str] = mapped_column(String(512), unique=True, nullable=False)
    # Gallery presentation metadata intentionally lives on the existing media
    # resource instead of introducing a polymorphic media relationship table.
    # A media file becomes an independent gallery record when `is_gallery` is
    # enabled through the gallery admin API.
    is_gallery: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    gallery_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    gallery_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    gallery_sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    gallery_is_visible: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )


class Admin(TimestampMixin, Base):
    __tablename__ = "admins"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    username: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class News(TimestampMixin, Base):
    __tablename__ = "news"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(
        String(160), unique=True, index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    cover_media_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("media.id", ondelete="RESTRICT"), nullable=True
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cover_media: Mapped[Media | None] = relationship(
        "Media", foreign_keys=[cover_media_id]
    )


class Project(TimestampMixin, Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(
        String(160), unique=True, index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    demo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cover_media_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("media.id", ondelete="RESTRICT"), nullable=True
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cover_media: Mapped[Media | None] = relationship(
        "Media", foreign_keys=[cover_media_id]
    )
    research_areas: Mapped[list["ResearchArea"]] = relationship(
        "ResearchArea",
        foreign_keys="ResearchArea.representative_project_id",
        back_populates="representative_project",
    )


class ResearchArea(TimestampMixin, Base):
    __tablename__ = "research_areas"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(
        String(160), unique=True, index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    problem_statement: Mapped[str | None] = mapped_column(Text, nullable=True)
    application_scenarios: Mapped[list[str]] = mapped_column(
        JSON, default=list, nullable=False
    )
    representative_project_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    representative_project: Mapped[Project | None] = relationship(
        "Project",
        foreign_keys=[representative_project_id],
        back_populates="research_areas",
    )


class Award(TimestampMixin, Base):
    __tablename__ = "awards"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[AwardCategory] = mapped_column(
        SqlEnum(
            AwardCategory,
            name="award_category",
            values_callable=enum_values,
            native_enum=False,
            create_constraint=True,
        ),
        nullable=False,
    )
    level: Mapped[AwardLevel] = mapped_column(
        SqlEnum(
            AwardLevel,
            name="award_level",
            values_callable=enum_values,
            native_enum=False,
            create_constraint=True,
        ),
        nullable=False,
    )
    issuer: Mapped[str] = mapped_column(String(255), nullable=False)
    competition_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    award_date: Mapped[date] = mapped_column(Date, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    certificate_media_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("media.id", ondelete="RESTRICT"), nullable=True
    )
    cover_media_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("media.id", ondelete="RESTRICT"), nullable=True
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    certificate_media: Mapped[Media | None] = relationship(
        "Media", foreign_keys=[certificate_media_id]
    )
    cover_media: Mapped[Media | None] = relationship(
        "Media", foreign_keys=[cover_media_id]
    )


class SiteSettings(TimestampMixin, Base):
    __tablename__ = "site_settings"

    key: Mapped[str] = mapped_column(String(32), primary_key=True, default="default")
    site_title: Mapped[str] = mapped_column(
        String(255), default="Robotics Laboratory", nullable=False
    )
    lab_name: Mapped[str] = mapped_column(
        String(255), default="Robotics Laboratory", nullable=False
    )
    tagline: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(80), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    hero_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hero_subtitle: Mapped[str | None] = mapped_column(Text, nullable=True)
    lab_positioning: Mapped[str | None] = mapped_column(Text, nullable=True)
    founded_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    founding_background: Mapped[str | None] = mapped_column(Text, nullable=True)
    core_platforms: Mapped[list[str]] = mapped_column(
        JSON, default=list, nullable=False
    )
    paper_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    patent_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active_project_count: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    trained_student_count: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    papers_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    join_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cooperation_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    logo_media_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("media.id", ondelete="RESTRICT"), nullable=True
    )
    social_github: Mapped[str | None] = mapped_column(String(500), nullable=True)
    social_bilibili: Mapped[str | None] = mapped_column(String(500), nullable=True)
    social_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    logo_media: Mapped[Media | None] = relationship(
        "Media", foreign_keys=[logo_media_id]
    )
