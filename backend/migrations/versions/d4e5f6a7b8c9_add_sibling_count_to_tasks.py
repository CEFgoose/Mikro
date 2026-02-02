"""Add sibling_count column to tasks for split task tracking

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-02-02 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d4e5f6a7b8c9"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade():
    # Add parent_task_id column for split task tracking
    op.add_column(
        "tasks",
        sa.Column("parent_task_id", sa.Integer(), nullable=True),
    )

    # Add sibling_count column to tasks table
    # For TM4 split tasks, this will be 4 (always splits into 4 children)
    # NULL for non-split tasks
    op.add_column(
        "tasks",
        sa.Column("sibling_count", sa.Integer(), nullable=True),
    )


def downgrade():
    op.drop_column("tasks", "sibling_count")
    op.drop_column("tasks", "parent_task_id")
