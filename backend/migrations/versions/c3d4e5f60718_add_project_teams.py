"""Add project_teams table.

Revision ID: c3d4e5f60718
Revises: b2c3d4e5f607
Create Date: 2026-02-11

Associates teams with projects for bulk user assignment
and team-level stat aggregation.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c3d4e5f60718"
down_revision = "b2c3d4e5f607"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "project_teams",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("team_id", sa.Integer(), nullable=False),
        sa.Column("project_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["team_id"], ["teams.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["project_id"], ["projects.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_project_teams_team_id"), "project_teams", ["team_id"]
    )
    op.create_index(
        op.f("ix_project_teams_project_id"), "project_teams", ["project_id"]
    )


def downgrade():
    op.drop_index(
        op.f("ix_project_teams_project_id"), table_name="project_teams"
    )
    op.drop_index(
        op.f("ix_project_teams_team_id"), table_name="project_teams"
    )
    op.drop_table("project_teams")
