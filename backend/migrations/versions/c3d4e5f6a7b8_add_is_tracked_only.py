"""Add is_tracked_only column to users

Revision ID: c3d4e5f6a7b8
Revises: b2d3f4a5c6e1
Create Date: 2026-02-11
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c3d4e5f6a7b8"
down_revision = "b2d3f4a5c6e1"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column(
            "is_tracked_only",
            sa.Boolean(),
            nullable=False,
            server_default="False",
        ),
    )


def downgrade():
    op.drop_column("users", "is_tracked_only")
