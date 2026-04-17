"""Add transcription_jobs table

Revision ID: x4c5d6e7f8a9
Revises: w3b4c5d6e7f8
Create Date: 2026-04-17
"""
from alembic import op
import sqlalchemy as sa

revision = "x4c5d6e7f8a9"
down_revision = "w3b4c5d6e7f8"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "transcription_jobs",
        sa.Column("id", sa.String(8), primary_key=True),
        sa.Column("user_id", sa.String(255), nullable=False, index=True),
        sa.Column("org_id", sa.String(255), nullable=True, index=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="queued"),
        sa.Column("file_name", sa.String(500), nullable=True),
        sa.Column("file_url", sa.String(1000), nullable=True),
        sa.Column("segments", sa.Text(), nullable=True),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("duration", sa.Float(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("progress", sa.Integer(), default=0),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_table("transcription_jobs")
