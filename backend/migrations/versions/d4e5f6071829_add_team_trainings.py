"""Add team_trainings table.

Revision ID: d4e5f6071829
Revises: c3d4e5f60718
Create Date: 2026-02-11

Associates teams with trainings for team-level training assignment.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d4e5f6071829"
down_revision = "c3d4e5f60718"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "team_trainings",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("team_id", sa.Integer(), nullable=False),
        sa.Column("training_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["team_id"], ["teams.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["training_id"], ["training.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_team_trainings_team_id"), "team_trainings", ["team_id"]
    )
    op.create_index(
        op.f("ix_team_trainings_training_id"), "team_trainings", ["training_id"]
    )


def downgrade():
    op.drop_index(
        op.f("ix_team_trainings_training_id"), table_name="team_trainings"
    )
    op.drop_index(
        op.f("ix_team_trainings_team_id"), table_name="team_trainings"
    )
    op.drop_table("team_trainings")
