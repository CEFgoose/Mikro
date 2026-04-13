"""Rename payments_visible to micropayments_visible on users table

Revision ID: w3b4c5d6e7f8
Revises: v2a3b4c5d6e7
Create Date: 2026-04-13
"""
from alembic import op

revision = "w3b4c5d6e7f8"
down_revision = "v2a3b4c5d6e7"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        "users", "payments_visible", new_column_name="micropayments_visible"
    )


def downgrade():
    op.alter_column(
        "users", "micropayments_visible", new_column_name="payments_visible"
    )
