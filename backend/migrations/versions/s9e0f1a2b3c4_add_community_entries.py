"""Add community_entries table

Revision ID: s9e0f1a2b3c4
Revises: r8d9e0f1a2b3
Create Date: 2026-03-30
"""
from alembic import op
import sqlalchemy as sa

revision = "s9e0f1a2b3c4"
down_revision = "r8d9e0f1a2b3"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "community_entries",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("org_id", sa.String(255), nullable=True),
        sa.Column("sheet_row_index", sa.Integer(), nullable=True),
        sa.Column("entry_type", sa.String(50), server_default="outreach", nullable=False),
        sa.Column("submitted_at", sa.DateTime(), nullable=True),
        sa.Column("original_data", sa.Text(), nullable=True),
        sa.Column("edited_data", sa.Text(), nullable=True),
        sa.Column("is_edited", sa.Boolean(), server_default="False"),
        sa.Column("submitted_by", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_community_entries_org_id", "community_entries", ["org_id"])

def downgrade():
    op.drop_index("ix_community_entries_org_id", table_name="community_entries")
    op.drop_table("community_entries")
