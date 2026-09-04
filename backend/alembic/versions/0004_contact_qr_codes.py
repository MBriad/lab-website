"""Add two optional contact QR-code media references to site settings.

The references intentionally reuse the existing media table.  This keeps QR
code uploads in the same library as other images while allowing administrators
to manage the two contact images independently.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0004_contact_qr_codes"
down_revision: Union[str, None] = "0003_independent_gallery"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("site_settings", recreate="always") as batch_op:
        batch_op.add_column(
            sa.Column("contact_qr_primary_media_id", sa.Uuid(), nullable=True)
        )
        batch_op.add_column(
            sa.Column("contact_qr_secondary_media_id", sa.Uuid(), nullable=True)
        )
        batch_op.create_foreign_key(
            "fk_site_settings_contact_qr_primary_media_id_media",
            "media",
            ["contact_qr_primary_media_id"],
            ["id"],
            ondelete="RESTRICT",
        )
        batch_op.create_foreign_key(
            "fk_site_settings_contact_qr_secondary_media_id_media",
            "media",
            ["contact_qr_secondary_media_id"],
            ["id"],
            ondelete="RESTRICT",
        )


def downgrade() -> None:
    with op.batch_alter_table("site_settings", recreate="always") as batch_op:
        batch_op.drop_constraint(
            "fk_site_settings_contact_qr_secondary_media_id_media",
            type_="foreignkey",
        )
        batch_op.drop_constraint(
            "fk_site_settings_contact_qr_primary_media_id_media",
            type_="foreignkey",
        )
        batch_op.drop_column("contact_qr_secondary_media_id")
        batch_op.drop_column("contact_qr_primary_media_id")
