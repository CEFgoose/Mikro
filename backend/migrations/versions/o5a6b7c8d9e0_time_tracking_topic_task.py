"""Add topic/task fields to time_entries and custom_topics table

Revision ID: o5a6b7c8d9e0
Revises: n4c5d6e7f8a9
Create Date: 2026-03-24
"""
from alembic import op
import sqlalchemy as sa

revision = "o5a6b7c8d9e0"
down_revision = "n4c5d6e7f8a9"
branch_labels = None
depends_on = None

def upgrade():
    # Add task fields to time_entries
    op.add_column("time_entries", sa.Column("task_name", sa.String(255), nullable=True))
    op.add_column("time_entries", sa.Column("task_ref_type", sa.String(50), nullable=True))
    op.add_column("time_entries", sa.Column("task_ref_id", sa.Integer(), nullable=True))

    # Create custom_topics table
    op.create_table(
        "custom_topics",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("org_id", sa.String(255), nullable=True),
        sa.Column("created_by", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", "org_id", name="uq_custom_topics_name_org"),
    )

def downgrade():
    op.drop_table("custom_topics")
    op.drop_column("time_entries", "task_ref_id")
    op.drop_column("time_entries", "task_ref_type")
    op.drop_column("time_entries", "task_name")
