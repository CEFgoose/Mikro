"""Add job_type to sync_jobs and element_analysis_cache table

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-02-11
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d4e5f6a7b8c9"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade():
    # Add job_type column to sync_jobs
    op.add_column(
        "sync_jobs",
        sa.Column(
            "job_type",
            sa.String(50),
            nullable=False,
            server_default="task_sync",
        ),
    )

    # Create element_analysis_cache table
    op.create_table(
        "element_analysis_cache",
        sa.Column("id", sa.BigInteger(), autoincrement=True, primary_key=True),
        sa.Column("org_id", sa.String(255), nullable=True, index=True),
        sa.Column("week", sa.Date(), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("added", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("modified", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("deleted", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_element_analysis_cache_org_week_cat",
        "element_analysis_cache",
        ["org_id", "week", "category"],
    )


def downgrade():
    op.drop_index("ix_element_analysis_cache_org_week_cat")
    op.drop_table("element_analysis_cache")
    op.drop_column("sync_jobs", "job_type")
