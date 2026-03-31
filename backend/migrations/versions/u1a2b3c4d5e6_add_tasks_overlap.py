"""Add tasks_overlap column to projects table

Revision ID: u1a2b3c4d5e6
Revises: t0f1a2b3c4d5
Create Date: 2026-03-31
"""
from alembic import op
import sqlalchemy as sa

revision = "u1a2b3c4d5e6"
down_revision = "t0f1a2b3c4d5"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("projects", sa.Column("tasks_overlap", sa.Integer(), server_default="0"))

def downgrade():
    op.drop_column("projects", "tasks_overlap")
