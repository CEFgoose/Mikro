"""Add user_notes column to time_entries for optional user-supplied context.

Revision ID: a7b8c9d0e1f2
Revises: z6e7f8a9b0c1
Create Date: 2026-04-28

The existing `notes` column on time_entries is overloaded with system
markers ([ADJUSTMENT REQUESTED], [ADJUSTED], [ADMIN CREATED], [DEV TEST
ENTRY]). This new column gives users a clean place to add optional
contextual notes (≤500 chars) to their time records without colliding
with those markers. Admins can read user_notes but cannot edit them.
"""
from alembic import op
import sqlalchemy as sa

revision = "a7b8c9d0e1f2"
down_revision = "z6e7f8a9b0c1"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "time_entries",
        sa.Column("user_notes", sa.Text(), nullable=True),
    )


def downgrade():
    op.drop_column("time_entries", "user_notes")
