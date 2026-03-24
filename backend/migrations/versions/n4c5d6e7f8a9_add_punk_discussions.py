"""Add cached_discussions column to punks.

Revision ID: n4c5d6e7f8a9
Revises: m3b4c5d6e7f8
"""
from alembic import op
import sqlalchemy as sa

revision = "n4c5d6e7f8a9"
down_revision = "m3b4c5d6e7f8"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "punks",
        sa.Column("cached_discussions", sa.Text(), nullable=True),
    )


def downgrade():
    op.drop_column("punks", "cached_discussions")
