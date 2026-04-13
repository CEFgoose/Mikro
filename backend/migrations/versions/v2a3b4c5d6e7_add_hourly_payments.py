"""Add hourly_rate to users and hourly_payments table

Revision ID: v2a3b4c5d6e7
Revises: u1a2b3c4d5e6
Create Date: 2026-04-13
"""
from alembic import op
import sqlalchemy as sa

revision = "v2a3b4c5d6e7"
down_revision = "u1a2b3c4d5e6"
branch_labels = None
depends_on = None

def upgrade():
    # Add hourly_rate column to users table
    op.add_column("users", sa.Column("hourly_rate", sa.Float(), nullable=True))

    # Create hourly_payments table
    op.create_table(
        "hourly_payments",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("org_id", sa.String(length=255), nullable=True),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("total_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("hourly_rate", sa.Float(), nullable=False),
        sa.Column("amount_due", sa.Float(), nullable=False, server_default="0"),
        sa.Column("paid", sa.Boolean(), nullable=False, server_default="False"),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        sa.Column("paid_by", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "year", "month", name="uq_hourly_payment_user_month"),
    )
    op.create_index("ix_hourly_payments_user_id", "hourly_payments", ["user_id"])
    op.create_index("ix_hourly_payments_org_id", "hourly_payments", ["org_id"])
    op.create_index("ix_hourly_payments_year_month", "hourly_payments", ["year", "month"])

def downgrade():
    op.drop_table("hourly_payments")
    op.drop_column("users", "hourly_rate")
