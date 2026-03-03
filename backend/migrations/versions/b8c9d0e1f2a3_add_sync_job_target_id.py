"""Add target_id to sync_jobs for project-scoped syncs.

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-03-03
"""

from alembic import op
import sqlalchemy as sa


revision = "b8c9d0e1f2a3"
down_revision = "a7b8c9d0e1f2"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "sync_jobs",
        sa.Column("target_id", sa.BigInteger(), nullable=True),
    )


def downgrade():
    op.drop_column("sync_jobs", "target_id")
