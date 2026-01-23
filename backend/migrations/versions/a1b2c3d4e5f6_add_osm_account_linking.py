"""Add OSM account linking fields

Revision ID: a1b2c3d4e5f6
Revises: 852886268a9f
Create Date: 2026-01-23 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "852886268a9f"
branch_labels = None
depends_on = None


def upgrade():
    # Add OSM account linking fields to users table
    op.add_column(
        "users",
        sa.Column("osm_id", sa.BigInteger(), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "osm_verified",
            sa.Boolean(),
            nullable=True,
            server_default="False",
        ),
    )
    op.add_column(
        "users",
        sa.Column("osm_verified_at", sa.DateTime(), nullable=True),
    )

    # Add unique index on osm_id
    op.create_index(
        op.f("ix_users_osm_id"),
        "users",
        ["osm_id"],
        unique=True,
    )


def downgrade():
    # Remove index first
    op.drop_index(op.f("ix_users_osm_id"), table_name="users")

    # Remove columns
    op.drop_column("users", "osm_verified_at")
    op.drop_column("users", "osm_verified")
    op.drop_column("users", "osm_id")
