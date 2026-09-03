"""Add independent gallery metadata to media resources.

Gallery records deliberately reuse the existing ``media`` table.  This keeps
the CMS schema small while allowing an image to be managed independently from
news, projects, and awards.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003_independent_gallery"
down_revision: Union[str, None] = "0002_homepage_content"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # SQLite needs Alembic's recreate strategy for the final NOT NULL change;
    # PostgreSQL can use ordinary ALTER TABLE statements. The default
    # ``recreate=auto`` selects the correct path for each dialect and avoids
    # dropping a media table that is referenced by the content tables.
    with op.batch_alter_table("media") as batch_op:
        batch_op.add_column(sa.Column("is_gallery", sa.Boolean(), nullable=True))
        batch_op.add_column(
            sa.Column("gallery_title", sa.String(length=255), nullable=True)
        )
        batch_op.add_column(sa.Column("gallery_description", sa.Text(), nullable=True))
        batch_op.add_column(
            sa.Column("gallery_sort_order", sa.Integer(), nullable=True)
        )
        batch_op.add_column(
            sa.Column("gallery_is_visible", sa.Boolean(), nullable=True)
        )

    media = sa.table(
        "media",
        sa.column("is_gallery", sa.Boolean()),
        sa.column("gallery_sort_order", sa.Integer()),
        sa.column("gallery_is_visible", sa.Boolean()),
    )
    op.execute(
        media.update().values(
            is_gallery=False,
            gallery_sort_order=0,
            gallery_is_visible=False,
        )
    )

    with op.batch_alter_table("media") as batch_op:
        batch_op.alter_column("is_gallery", nullable=False)
        batch_op.alter_column("gallery_sort_order", nullable=False)
        batch_op.alter_column("gallery_is_visible", nullable=False)

    # Preserve the previous homepage gallery on upgrade.  Only already public
    # cover references are promoted; certificates and hidden/draft content stay
    # out of the independent visual archive until an administrator opts in.
    connection = op.get_bind()
    published_cutoff = (
        "datetime(CURRENT_TIMESTAMP, '+1 second')"
        if connection.dialect.name == "sqlite"
        else "(CURRENT_TIMESTAMP + INTERVAL '1 second')"
    )
    connection.execute(
        sa.text(
            f"""
            UPDATE media
            SET is_gallery = TRUE,
                gallery_title = (
                    SELECT title FROM awards
                    WHERE awards.cover_media_id = media.id
                      AND awards.is_visible = TRUE
                    ORDER BY awards.award_date DESC, awards.id ASC
                    LIMIT 1
                ),
                gallery_sort_order = COALESCE((
                    SELECT sort_order FROM awards
                    WHERE awards.cover_media_id = media.id
                      AND awards.is_visible = TRUE
                    ORDER BY awards.award_date DESC, awards.id ASC
                    LIMIT 1
                ), 0),
                gallery_is_visible = TRUE
            WHERE is_gallery = FALSE
              AND id IN (
                SELECT cover_media_id FROM awards
                WHERE cover_media_id IS NOT NULL AND is_visible = TRUE
              )
            """
        )
    )
    connection.execute(
        sa.text(
            f"""
            UPDATE media
            SET is_gallery = TRUE,
                gallery_title = (
                    SELECT title FROM projects
                    WHERE projects.cover_media_id = media.id
                      AND projects.is_visible = TRUE
                      AND (projects.published_at IS NULL OR projects.published_at <= {published_cutoff})
                    ORDER BY projects.sort_order ASC, projects.id ASC
                    LIMIT 1
                ),
                gallery_sort_order = COALESCE((
                    SELECT sort_order FROM projects
                    WHERE projects.cover_media_id = media.id
                      AND projects.is_visible = TRUE
                      AND (projects.published_at IS NULL OR projects.published_at <= {published_cutoff})
                    ORDER BY projects.sort_order ASC, projects.id ASC
                    LIMIT 1
                ), 0),
                gallery_is_visible = TRUE
            WHERE is_gallery = FALSE
              AND id IN (
                SELECT cover_media_id FROM projects
                WHERE cover_media_id IS NOT NULL
                  AND is_visible = TRUE
                  AND (published_at IS NULL OR published_at <= {published_cutoff})
              )
            """
        )
    )
    connection.execute(
        sa.text(
            f"""
            UPDATE media
            SET is_gallery = TRUE,
                gallery_title = (
                    SELECT title FROM news
                    WHERE news.cover_media_id = media.id
                      AND news.is_visible = TRUE
                      AND (news.published_at IS NULL OR news.published_at <= {published_cutoff})
                    ORDER BY news.published_at DESC, news.sort_order ASC, news.id ASC
                    LIMIT 1
                ),
                gallery_sort_order = COALESCE((
                    SELECT sort_order FROM news
                    WHERE news.cover_media_id = media.id
                      AND news.is_visible = TRUE
                      AND (news.published_at IS NULL OR news.published_at <= {published_cutoff})
                    ORDER BY news.published_at DESC, news.sort_order ASC, news.id ASC
                    LIMIT 1
                ), 0),
                gallery_is_visible = TRUE
            WHERE is_gallery = FALSE
              AND id IN (
                SELECT cover_media_id FROM news
                WHERE cover_media_id IS NOT NULL
                  AND is_visible = TRUE
                  AND (published_at IS NULL OR published_at <= {published_cutoff})
              )
            """
        )
    )


def downgrade() -> None:
    with op.batch_alter_table("media") as batch_op:
        batch_op.drop_column("gallery_is_visible")
        batch_op.drop_column("gallery_sort_order")
        batch_op.drop_column("gallery_description")
        batch_op.drop_column("gallery_title")
        batch_op.drop_column("is_gallery")
