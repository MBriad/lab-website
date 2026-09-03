"""Extend CMS content for homepage authority and storytelling.

Revision ID: 0002_homepage_content
Revises: 0001_initial
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002_homepage_content"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_REPRESENTATIVE_PROJECT_FK = "fk_research_areas_representative_project_id_projects"


def upgrade() -> None:
    with op.batch_alter_table("site_settings", recreate="always") as batch_op:
        batch_op.add_column(sa.Column("lab_positioning", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("founded_year", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("founding_background", sa.Text(), nullable=True))
        batch_op.add_column(
            sa.Column(
                "core_platforms",
                sa.JSON(),
                nullable=True,
            )
        )
        batch_op.add_column(sa.Column("paper_count", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("patent_count", sa.Integer(), nullable=True))
        batch_op.add_column(
            sa.Column(
                "active_project_count",
                sa.Integer(),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "trained_student_count",
                sa.Integer(),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column("papers_url", sa.String(length=500), nullable=True)
        )
        batch_op.add_column(sa.Column("join_url", sa.String(length=500), nullable=True))
        batch_op.add_column(
            sa.Column("cooperation_url", sa.String(length=500), nullable=True)
        )

    site_settings = sa.table(
        "site_settings",
        sa.column("core_platforms", sa.JSON()),
        sa.column("paper_count", sa.Integer()),
        sa.column("patent_count", sa.Integer()),
        sa.column("active_project_count", sa.Integer()),
        sa.column("trained_student_count", sa.Integer()),
    )
    op.execute(
        site_settings.update().values(
            core_platforms=[],
            paper_count=0,
            patent_count=0,
            active_project_count=0,
            trained_student_count=0,
        )
    )
    with op.batch_alter_table("site_settings", recreate="always") as batch_op:
        batch_op.alter_column("core_platforms", nullable=False)
        batch_op.alter_column("paper_count", nullable=False)
        batch_op.alter_column("patent_count", nullable=False)
        batch_op.alter_column("active_project_count", nullable=False)
        batch_op.alter_column("trained_student_count", nullable=False)

    op.add_column(
        "projects", sa.Column("demo_url", sa.String(length=500), nullable=True)
    )

    with op.batch_alter_table("research_areas", recreate="always") as batch_op:
        batch_op.add_column(sa.Column("problem_statement", sa.Text(), nullable=True))
        batch_op.add_column(
            sa.Column(
                "application_scenarios",
                sa.JSON(),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "representative_project_id",
                sa.Uuid(),
                nullable=True,
            )
        )
        batch_op.create_foreign_key(
            _REPRESENTATIVE_PROJECT_FK,
            "projects",
            ["representative_project_id"],
            ["id"],
            ondelete="SET NULL",
        )

    research_areas = sa.table(
        "research_areas", sa.column("application_scenarios", sa.JSON())
    )
    op.execute(research_areas.update().values(application_scenarios=[]))
    with op.batch_alter_table("research_areas", recreate="always") as batch_op:
        batch_op.alter_column("application_scenarios", nullable=False)


def downgrade() -> None:
    with op.batch_alter_table("research_areas", recreate="always") as batch_op:
        batch_op.drop_constraint(_REPRESENTATIVE_PROJECT_FK, type_="foreignkey")
        batch_op.drop_column("representative_project_id")
        batch_op.drop_column("application_scenarios")
        batch_op.drop_column("problem_statement")

    op.drop_column("projects", "demo_url")

    with op.batch_alter_table("site_settings", recreate="always") as batch_op:
        batch_op.drop_column("cooperation_url")
        batch_op.drop_column("join_url")
        batch_op.drop_column("papers_url")
        batch_op.drop_column("trained_student_count")
        batch_op.drop_column("active_project_count")
        batch_op.drop_column("patent_count")
        batch_op.drop_column("paper_count")
        batch_op.drop_column("core_platforms")
        batch_op.drop_column("founding_background")
        batch_op.drop_column("founded_year")
        batch_op.drop_column("lab_positioning")
