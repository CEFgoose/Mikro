"""Add weekly_reports table

Revision ID: p6b7c8d9e0f1
Revises: o5a6b7c8d9e0
Create Date: 2026-03-25
"""
from alembic import op
import sqlalchemy as sa

revision = "p6b7c8d9e0f1"
down_revision = "o5a6b7c8d9e0"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "weekly_reports",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("org_id", sa.String(255), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("report_date", sa.Date(), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("sections", sa.Text(), nullable=False),
        sa.Column("status", sa.String(20), server_default="draft", nullable=True),
        sa.Column("created_by", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_weekly_reports_org_id", "weekly_reports", ["org_id"])

def downgrade():
    op.drop_index("ix_weekly_reports_org_id", table_name="weekly_reports")
    op.drop_table("weekly_reports")
