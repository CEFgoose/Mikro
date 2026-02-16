"""Add sync_jobs table.

Revision ID: f6a7182930b2
Revises: e5f6071829a1
Create Date: 2026-02-11

Background sync job tracking for task synchronization worker.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f6a7182930b2"
down_revision = "e5f6071829a1"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "sync_jobs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("org_id", sa.String(length=255), nullable=True),
        sa.Column(
            "status", sa.String(length=50), nullable=False, server_default="queued"
        ),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("progress", sa.String(length=500), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=True
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sync_jobs_org_id"), "sync_jobs", ["org_id"])


def downgrade():
    op.drop_index(op.f("ix_sync_jobs_org_id"), table_name="sync_jobs")
    op.drop_table("sync_jobs")
