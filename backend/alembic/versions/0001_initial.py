"""Create the first CMS schema.

Revision ID: 0001_initial
Revises:
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    uuid_type = sa.Uuid()
    timestamp = sa.DateTime(timezone=True)
    category = sa.Enum(
        "competition",
        "research",
        "innovation",
        "honor",
        "other",
        name="award_category",
        native_enum=False,
        create_constraint=True,
    )
    level = sa.Enum(
        "national",
        "provincial",
        "municipal",
        "university",
        "other",
        name="award_level",
        native_enum=False,
        create_constraint=True,
    )

    op.create_table(
        "media",
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("original_name", sa.String(length=255), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("width", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
        sa.Column("storage_key", sa.String(length=512), nullable=False),
        sa.Column("created_at", timestamp, nullable=False),
        sa.Column("updated_at", timestamp, nullable=False),
        sa.UniqueConstraint("storage_key", name="uq_media_storage_key"),
    )
    op.create_table(
        "admins",
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("username", sa.String(length=100), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", timestamp, nullable=False),
        sa.Column("updated_at", timestamp, nullable=False),
        sa.UniqueConstraint("username", name="uq_admins_username"),
    )
    op.create_index("ix_admins_username", "admins", ["username"], unique=False)

    op.create_table(
        "news",
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("excerpt", sa.Text(), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("cover_media_id", uuid_type, nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_visible", sa.Boolean(), nullable=False),
        sa.Column("published_at", timestamp, nullable=True),
        sa.Column("created_at", timestamp, nullable=False),
        sa.Column("updated_at", timestamp, nullable=False),
        sa.ForeignKeyConstraint(["cover_media_id"], ["media.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("slug", name="uq_news_slug"),
    )
    op.create_index("ix_news_slug", "news", ["slug"], unique=False)

    op.create_table(
        "projects",
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("cover_media_id", uuid_type, nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_visible", sa.Boolean(), nullable=False),
        sa.Column("published_at", timestamp, nullable=True),
        sa.Column("created_at", timestamp, nullable=False),
        sa.Column("updated_at", timestamp, nullable=False),
        sa.ForeignKeyConstraint(["cover_media_id"], ["media.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("slug", name="uq_projects_slug"),
    )
    op.create_index("ix_projects_slug", "projects", ["slug"], unique=False)

    op.create_table(
        "research_areas",
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_visible", sa.Boolean(), nullable=False),
        sa.Column("created_at", timestamp, nullable=False),
        sa.Column("updated_at", timestamp, nullable=False),
        sa.UniqueConstraint("slug", name="uq_research_areas_slug"),
    )
    op.create_index("ix_research_areas_slug", "research_areas", ["slug"], unique=False)

    op.create_table(
        "awards",
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("category", category, nullable=False),
        sa.Column("level", level, nullable=False),
        sa.Column("issuer", sa.String(length=255), nullable=False),
        sa.Column("competition_name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("award_date", sa.Date(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("certificate_media_id", uuid_type, nullable=True),
        sa.Column("cover_media_id", uuid_type, nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_featured", sa.Boolean(), nullable=False),
        sa.Column("is_visible", sa.Boolean(), nullable=False),
        sa.Column("created_at", timestamp, nullable=False),
        sa.Column("updated_at", timestamp, nullable=False),
        sa.ForeignKeyConstraint(
            ["certificate_media_id"], ["media.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(["cover_media_id"], ["media.id"], ondelete="RESTRICT"),
    )

    op.create_table(
        "site_settings",
        sa.Column("key", sa.String(length=32), primary_key=True, nullable=False),
        sa.Column("site_title", sa.String(length=255), nullable=False),
        sa.Column("lab_name", sa.String(length=255), nullable=False),
        sa.Column("tagline", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("contact_email", sa.String(length=255), nullable=True),
        sa.Column("contact_phone", sa.String(length=80), nullable=True),
        sa.Column("address", sa.String(length=500), nullable=True),
        sa.Column("hero_title", sa.String(length=255), nullable=True),
        sa.Column("hero_subtitle", sa.Text(), nullable=True),
        sa.Column("logo_media_id", uuid_type, nullable=True),
        sa.Column("social_github", sa.String(length=500), nullable=True),
        sa.Column("social_bilibili", sa.String(length=500), nullable=True),
        sa.Column("social_email", sa.String(length=255), nullable=True),
        sa.Column("created_at", timestamp, nullable=False),
        sa.Column("updated_at", timestamp, nullable=False),
        sa.ForeignKeyConstraint(["logo_media_id"], ["media.id"], ondelete="RESTRICT"),
    )


def downgrade() -> None:
    op.drop_table("site_settings")
    op.drop_table("awards")
    op.drop_index("ix_research_areas_slug", table_name="research_areas")
    op.drop_table("research_areas")
    op.drop_index("ix_projects_slug", table_name="projects")
    op.drop_table("projects")
    op.drop_index("ix_news_slug", table_name="news")
    op.drop_table("news")
    op.drop_index("ix_admins_username", table_name="admins")
    op.drop_table("admins")
    op.drop_table("media")
