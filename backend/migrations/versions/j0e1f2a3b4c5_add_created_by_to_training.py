"""Add created_by column to training.

Revision ID: j0e1f2a3b4c5
Revises: i9d0e1f2a3b4
"""
from alembic import op
import sqlalchemy as sa

revision = "j0e1f2a3b4c5"
down_revision = "i9d0e1f2a3b4"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "training",
        sa.Column("created_by", sa.String(200), nullable=True),
    )


def downgrade():
    op.drop_column("training", "created_by")
