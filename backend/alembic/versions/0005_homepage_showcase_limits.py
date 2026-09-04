"""Add configurable homepage showcase limits to site settings.

The values cap public homepage rails only. They do not alter award featured
state, gallery visibility, or editorial ordering.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0005_homepage_showcase_limits"
down_revision: Union[str, None] = "0004_contact_qr_codes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("site_settings", recreate="always") as batch_op:
        batch_op.add_column(
            sa.Column(
                "homepage_featured_awards_limit",
                sa.Integer(),
                nullable=False,
                server_default="8",
            )
        )
        batch_op.add_column(
            sa.Column(
                "homepage_gallery_limit",
                sa.Integer(),
                nullable=False,
                server_default="8",
            )
        )


def downgrade() -> None:
    with op.batch_alter_table("site_settings", recreate="always") as batch_op:
        batch_op.drop_column("homepage_gallery_limit")
        batch_op.drop_column("homepage_featured_awards_limit")
