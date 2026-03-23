"""Add payments_visible column to users.

Existing users are backfilled to True (they had payment access before this feature).
New users default to False.

Revision ID: i9d0e1f2a3b4
Revises: h8c9d0e1f2a3
"""
from alembic import op
import sqlalchemy as sa

revision = "i9d0e1f2a3b4"
down_revision = "h8c9d0e1f2a3"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column(
            "payments_visible",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )
    # Backfill existing users to True — they were pay-enabled before this feature
    op.execute("UPDATE users SET payments_visible = true")


def downgrade():
    op.drop_column("users", "payments_visible")
