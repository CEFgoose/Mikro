"""Make punks.org_id nullable.

Revision ID: m3b4c5d6e7f8
Revises: l2a3b4c5d6e7
"""
from alembic import op
import sqlalchemy as sa

revision = "m3b4c5d6e7f8"
down_revision = "l2a3b4c5d6e7"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column("punks", "org_id", existing_type=sa.String(255), nullable=True)


def downgrade():
    op.alter_column("punks", "org_id", existing_type=sa.String(255), nullable=False)
