"""Add teams and team_users tables.

Revision ID: b2c3d4e5f607
Revises: a1b2c3d4e5f6
Create Date: 2026-02-11

Adds Team model (with soft delete) and TeamUser join table
for grouping users into teams.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b2c3d4e5f607"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "teams",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("org_id", sa.String(length=255), nullable=True),
        sa.Column("lead_id", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("deleted_date", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_teams_deleted_date"), "teams", ["deleted_date"])

    op.create_table(
        "team_users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("team_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["team_id"], ["teams.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_team_users_user_id"), "team_users", ["user_id"]
    )
    op.create_index(
        op.f("ix_team_users_team_id"), "team_users", ["team_id"]
    )


def downgrade():
    op.drop_index(op.f("ix_team_users_team_id"), table_name="team_users")
    op.drop_index(op.f("ix_team_users_user_id"), table_name="team_users")
    op.drop_table("team_users")
    op.drop_index(op.f("ix_teams_deleted_date"), table_name="teams")
    op.drop_table("teams")
