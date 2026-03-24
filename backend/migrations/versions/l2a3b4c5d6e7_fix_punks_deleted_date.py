"""Fix punks table: replace deleted boolean with deleted_date timestamp.

The original migration incorrectly created a 'deleted' boolean column.
ModelWithSoftDeleteAndCRUD expects 'deleted_date' (DateTime, nullable).

Revision ID: l2a3b4c5d6e7
Revises: k1f2a3b4c5d6
"""
from alembic import op
import sqlalchemy as sa

revision = "l2a3b4c5d6e7"
down_revision = "k1f2a3b4c5d6"
branch_labels = None
depends_on = None


def upgrade():
    # Drop the wrong column if it exists
    try:
        op.drop_column("punks", "deleted")
    except Exception:
        pass
    # Add the correct column
    op.add_column(
        "punks",
        sa.Column("deleted_date", sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_column("punks", "deleted_date")
