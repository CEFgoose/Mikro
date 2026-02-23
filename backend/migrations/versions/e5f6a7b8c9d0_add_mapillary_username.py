"""Add mapillary_username to users table.

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
"""
from alembic import op
import sqlalchemy as sa

revision = "e5f6a7b8c9d0"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column("mapillary_username", sa.String(100), nullable=True),
    )
    op.create_index(
        "ix_users_mapillary_username", "users", ["mapillary_username"]
    )


def downgrade():
    op.drop_index("ix_users_mapillary_username", table_name="users")
    op.drop_column("users", "mapillary_username")
