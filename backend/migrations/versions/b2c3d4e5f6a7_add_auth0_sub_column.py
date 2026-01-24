"""Add auth0_sub column to users table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-01-24 01:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade():
    # Add auth0_sub column to users table
    # Making it nullable initially to allow existing users to be updated
    op.add_column(
        "users",
        sa.Column("auth0_sub", sa.String(255), nullable=True),
    )

    # Create unique index on auth0_sub
    op.create_index(
        op.f("ix_users_auth0_sub"),
        "users",
        ["auth0_sub"],
        unique=True,
    )


def downgrade():
    # Remove index first
    op.drop_index(op.f("ix_users_auth0_sub"), table_name="users")

    # Remove column
    op.drop_column("users", "auth0_sub")
