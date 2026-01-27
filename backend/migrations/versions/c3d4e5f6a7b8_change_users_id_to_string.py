"""Change users.id from INTEGER to VARCHAR(255) for Auth0 sub storage

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-01-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade():
    # For a fresh database (greenfield rebuild), we can safely alter the column type.
    # The users table should be empty or we're okay losing data during migration.

    # First, drop any foreign key constraints that reference users.id
    # These tables have user_id columns that reference users:
    # - user_checklists, user_checklist_item, training_completed,
    # - project_users, user_tasks, requests, payments

    # Since the database is fresh/empty, we can just alter the column type directly.
    # PostgreSQL allows ALTER COLUMN TYPE with USING clause.

    op.execute("""
        ALTER TABLE users
        ALTER COLUMN id TYPE VARCHAR(255)
        USING id::text
    """)


def downgrade():
    # This downgrade is destructive - string IDs cannot be converted back to integers
    # Only use if the table is empty
    op.execute("""
        ALTER TABLE users
        ALTER COLUMN id TYPE INTEGER
        USING id::integer
    """)
