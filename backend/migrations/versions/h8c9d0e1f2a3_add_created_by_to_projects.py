"""Add created_by column to projects for tracking who created/imported each project.

Revision ID: h8c9d0e1f2a3
Revises: g7b8c9d0e1f2
"""
from alembic import op
import sqlalchemy as sa

revision = "h8c9d0e1f2a3"
down_revision = "g7b8c9d0e1f2"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "projects",
        sa.Column("created_by", sa.String(255), nullable=True),
    )


def downgrade():
    op.drop_column("projects", "created_by")
