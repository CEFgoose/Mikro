"""Add user_name_audits table for debugging name-change regressions.

Revision ID: z6e7f8a9b0c1
Revises: y5d6e7f8a9b0
Create Date: 2026-04-21

This table is a temporary diagnostic for investigating reports that
admin-set user names revert to email addresses. Every write to
users.first_name / users.last_name records a row here tagged with the
code path that produced it. Once the root cause is identified the
table can be dropped in a follow-up migration.
"""
from alembic import op
import sqlalchemy as sa

revision = "z6e7f8a9b0c1"
down_revision = "y5d6e7f8a9b0"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "user_name_audits",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            sa.String(255),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "changed_at",
            sa.DateTime,
            nullable=False,
            server_default=sa.func.now(),
            index=True,
        ),
        sa.Column("old_first_name", sa.String(100), nullable=True),
        sa.Column("old_last_name", sa.String(100), nullable=True),
        sa.Column("new_first_name", sa.String(100), nullable=True),
        sa.Column("new_last_name", sa.String(100), nullable=True),
        sa.Column("source", sa.String(50), nullable=False, index=True),
        sa.Column("changed_by", sa.String(255), nullable=True),
        sa.Column("details", sa.Text, nullable=True),
    )


def downgrade():
    op.drop_table("user_name_audits")
