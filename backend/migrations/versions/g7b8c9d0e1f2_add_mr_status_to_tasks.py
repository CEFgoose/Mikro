"""Add mr_status column to tasks for tracking MapRoulette task statuses.

Revision ID: g7b8c9d0e1f2
Revises: b8c9d0e1f2a3
"""
from alembic import op
import sqlalchemy as sa

revision = "g7b8c9d0e1f2"
down_revision = "b8c9d0e1f2a3"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "tasks",
        sa.Column("mr_status", sa.Integer(), nullable=True),
    )


def downgrade():
    op.drop_column("tasks", "mr_status")
