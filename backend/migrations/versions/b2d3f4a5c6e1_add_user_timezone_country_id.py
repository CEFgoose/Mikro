"""Add timezone and country_id columns to users table.

Revision ID: b2d3f4a5c6e1
Revises: a1c2e3f4b5d6
Create Date: 2026-02-19

Adds normalized country foreign key and timezone to the users table
for region-based filtering support.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b2d3f4a5c6e1"
down_revision = "a1c2e3f4b5d6"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column("country_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("timezone", sa.String(length=50), nullable=True),
    )
    op.create_foreign_key(
        "fk_users_country_id",
        "users",
        "countries",
        ["country_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        op.f("ix_users_country_id"), "users", ["country_id"]
    )


def downgrade():
    op.drop_index(op.f("ix_users_country_id"), table_name="users")
    op.drop_constraint("fk_users_country_id", "users", type_="foreignkey")
    op.drop_column("users", "timezone")
    op.drop_column("users", "country_id")
