"""add unique constraint to element_analysis_cache

Revision ID: 6ee2c8a78ff8
Revises: d88d8b5753e4
Create Date: 2026-05-15 11:21:08.773190

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6ee2c8a78ff8'
down_revision = 'd88d8b5753e4'
branch_labels = None
depends_on = None


def upgrade():
    # Clear existing entries — they were fetched without pagination and may be
    # incomplete. The next job run will repopulate with full paginated data.
    op.execute("DELETE FROM element_analysis_cache")

    with op.batch_alter_table('element_analysis_cache', schema=None) as batch_op:
        batch_op.alter_column('day',
               existing_type=sa.DATE(),
               nullable=False)
        batch_op.create_unique_constraint(
            'uq_element_analysis_cache_org_day_cat',
            ['org_id', 'day', 'category'],
        )


def downgrade():
    with op.batch_alter_table('element_analysis_cache', schema=None) as batch_op:
        batch_op.drop_constraint(
            'uq_element_analysis_cache_org_day_cat',
            type_='unique',
        )
        batch_op.alter_column('day',
               existing_type=sa.DATE(),
               nullable=True)
