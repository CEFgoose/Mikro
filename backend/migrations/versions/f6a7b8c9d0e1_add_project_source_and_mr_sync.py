"""Add source column to projects and tasks, last_sync_cursor to projects.

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
"""
from alembic import op
import sqlalchemy as sa

revision = "f6a7b8c9d0e1"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade():
    # Add 'source' to projects — default 'tm4' so existing rows auto-tagged
    op.add_column(
        "projects",
        sa.Column("source", sa.String(20), nullable=False, server_default="tm4"),
    )
    op.create_index("ix_projects_source", "projects", ["source"])

    # Add 'last_sync_cursor' to projects — for incremental MR sync
    op.add_column(
        "projects",
        sa.Column("last_sync_cursor", sa.DateTime, nullable=True),
    )

    # Add 'source' to tasks — default 'tm4' so existing rows auto-tagged
    op.add_column(
        "tasks",
        sa.Column("source", sa.String(20), nullable=False, server_default="tm4"),
    )
    op.create_index("ix_tasks_source", "tasks", ["source"])


def downgrade():
    op.drop_index("ix_tasks_source", table_name="tasks")
    op.drop_column("tasks", "source")
    op.drop_column("projects", "last_sync_cursor")
    op.drop_index("ix_projects_source", table_name="projects")
    op.drop_column("projects", "source")
