"""Add regions, countries, user_countries tables.

Revision ID: a1c2e3f4b5d6
Revises: f6a7182930b2
Create Date: 2026-02-19

Region-based filtering Phase 1: geographic region grouping,
country lookup, and user-country associations.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a1c2e3f4b5d6"
down_revision = "f6a7182930b2"
branch_labels = None
depends_on = None


def upgrade():
    # -- regions --
    op.create_table(
        "regions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("org_id", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=True
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    # -- countries --
    op.create_table(
        "countries",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("iso_code", sa.String(length=3), nullable=True),
        sa.Column("region_id", sa.Integer(), nullable=True),
        sa.Column("default_timezone", sa.String(length=50), nullable=True),
        sa.Column("org_id", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=True
        ),
        sa.ForeignKeyConstraint(
            ["region_id"], ["regions.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("iso_code"),
    )
    op.create_index(
        op.f("ix_countries_region_id"), "countries", ["region_id"]
    )

    # -- user_countries --
    op.create_table(
        "user_countries",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("country_id", sa.Integer(), nullable=False),
        sa.Column(
            "is_primary",
            sa.Boolean(),
            nullable=True,
            server_default="True",
        ),
        sa.ForeignKeyConstraint(
            ["country_id"], ["countries.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_user_countries_user_id"), "user_countries", ["user_id"]
    )
    op.create_index(
        op.f("ix_user_countries_country_id"), "user_countries", ["country_id"]
    )


def downgrade():
    op.drop_index(
        op.f("ix_user_countries_country_id"), table_name="user_countries"
    )
    op.drop_index(
        op.f("ix_user_countries_user_id"), table_name="user_countries"
    )
    op.drop_table("user_countries")

    op.drop_index(op.f("ix_countries_region_id"), table_name="countries")
    op.drop_table("countries")

    op.drop_table("regions")
