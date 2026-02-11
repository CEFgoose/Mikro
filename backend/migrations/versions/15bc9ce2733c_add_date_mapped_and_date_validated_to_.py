"""Add date_mapped and date_validated to Task

Revision ID: 15bc9ce2733c
Revises: d4e5f6a7b8c9
Create Date: 2026-02-10 17:02:15.461487

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '15bc9ce2733c'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('tasks', sa.Column('date_mapped', sa.DateTime(), nullable=True))
    op.add_column('tasks', sa.Column('date_validated', sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column('tasks', 'date_validated')
    op.drop_column('tasks', 'date_mapped')
