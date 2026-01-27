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
    # Tables with user_id columns that may have foreign keys referencing users.id:
    # - project_users.user_id
    # - user_tasks.user_id
    # - training_completed.user_id
    # - user_checklists.user_id
    # - user_checklist_item.user_id
    # - requests.user_id
    # - payments.user_id

    # Step 1: Drop all foreign key constraints that reference users.id (IF EXISTS)
    op.execute("ALTER TABLE project_users DROP CONSTRAINT IF EXISTS project_users_user_id_fkey")
    op.execute("ALTER TABLE user_tasks DROP CONSTRAINT IF EXISTS user_tasks_user_id_fkey")
    op.execute("ALTER TABLE training_completed DROP CONSTRAINT IF EXISTS training_completed_user_id_fkey")
    op.execute("ALTER TABLE user_checklists DROP CONSTRAINT IF EXISTS user_checklists_user_id_fkey")
    op.execute("ALTER TABLE user_checklist_item DROP CONSTRAINT IF EXISTS user_checklist_item_user_id_fkey")
    op.execute("ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_user_id_fkey")
    op.execute("ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey")

    # Step 2: Change users.id from INTEGER to VARCHAR(255)
    op.execute("""
        ALTER TABLE users
        ALTER COLUMN id TYPE VARCHAR(255)
        USING id::text
    """)

    # Step 3: Change all user_id columns in referencing tables to VARCHAR(255)
    op.execute("ALTER TABLE project_users ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text")
    op.execute("ALTER TABLE user_tasks ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text")
    op.execute("ALTER TABLE training_completed ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text")
    op.execute("ALTER TABLE user_checklists ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text")
    op.execute("ALTER TABLE user_checklist_item ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text")
    op.execute("ALTER TABLE requests ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text")
    op.execute("ALTER TABLE payments ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text")

    # Step 4: Recreate foreign key constraints (optional - model doesn't enforce them)
    # Skipping FK recreation since the SQLAlchemy models don't define ForeignKey to users.id


def downgrade():
    # This downgrade is destructive - string IDs cannot be converted back to integers
    # Only use if the tables are empty

    # Change user_id columns back to INTEGER
    op.execute("ALTER TABLE project_users ALTER COLUMN user_id TYPE INTEGER USING user_id::integer")
    op.execute("ALTER TABLE user_tasks ALTER COLUMN user_id TYPE INTEGER USING user_id::integer")
    op.execute("ALTER TABLE training_completed ALTER COLUMN user_id TYPE INTEGER USING user_id::integer")
    op.execute("ALTER TABLE user_checklists ALTER COLUMN user_id TYPE INTEGER USING user_id::integer")
    op.execute("ALTER TABLE user_checklist_item ALTER COLUMN user_id TYPE INTEGER USING user_id::integer")
    op.execute("ALTER TABLE requests ALTER COLUMN user_id TYPE INTEGER USING user_id::integer")
    op.execute("ALTER TABLE payments ALTER COLUMN user_id TYPE INTEGER USING user_id::integer")

    # Change users.id back to INTEGER
    op.execute("""
        ALTER TABLE users
        ALTER COLUMN id TYPE INTEGER
        USING id::integer
    """)
