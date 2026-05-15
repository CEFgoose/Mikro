"""clear element_analysis_cache for pagination backfill

Revision ID: 8cffcdbdaa37
Revises: 6ee2c8a78ff8
Create Date: 2026-05-15 12:27:40.130950

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '8cffcdbdaa37'
down_revision = '6ee2c8a78ff8'
branch_labels = None
depends_on = None


def upgrade():
    # Existing entries were fetched without pagination and may be incomplete.
    # Clearing them forces a full paginated backfill on the next job run.
    op.execute("DELETE FROM element_analysis_cache")


def downgrade():
    pass
