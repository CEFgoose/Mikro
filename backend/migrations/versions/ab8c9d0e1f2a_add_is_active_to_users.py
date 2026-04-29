"""Add is_active column to users for the Deactivate User feature.

Revision ID: ab8c9d0e1f2a
Revises: aa7f8a9b0c1d
Create Date: 2026-04-29

Distinct from the existing soft-delete (deleted_date). A deactivated
user is hidden from the default admin users list, blocked from
authenticating (enforced in requires_auth), but their historical
data is preserved and visible. Reactivation is admin-controlled.
Default TRUE so existing users remain active without backfill.
"""
from alembic import op
import sqlalchemy as sa

revision = "ab8c9d0e1f2a"
down_revision = "aa7f8a9b0c1d"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )


def downgrade():
    op.drop_column("users", "is_active")
