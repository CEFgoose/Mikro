"""Add title + tags columns to transcription_jobs

Revision ID: y5d6e7f8a9b0
Revises: x4c5d6e7f8a9
Create Date: 2026-04-20
"""
from alembic import op
import sqlalchemy as sa

revision = "y5d6e7f8a9b0"
down_revision = "x4c5d6e7f8a9"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "transcription_jobs",
        sa.Column("title", sa.String(500), nullable=True),
    )
    op.add_column(
        "transcription_jobs",
        sa.Column("tags", sa.Text(), nullable=True),
    )


def downgrade():
    op.drop_column("transcription_jobs", "tags")
    op.drop_column("transcription_jobs", "title")
