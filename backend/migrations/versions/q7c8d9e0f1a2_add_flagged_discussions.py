"""Add flagged_discussions column to punks table

Revision ID: q7c8d9e0f1a2
Revises: p6b7c8d9e0f1
Create Date: 2026-03-30
"""
from alembic import op
import sqlalchemy as sa

revision = "q7c8d9e0f1a2"
down_revision = "p6b7c8d9e0f1"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("punks", sa.Column("flagged_discussions", sa.Text(), nullable=True))

def downgrade():
    op.drop_column("punks", "flagged_discussions")
