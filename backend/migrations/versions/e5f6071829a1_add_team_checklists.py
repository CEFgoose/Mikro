"""Add team_checklists table.

Revision ID: e5f6071829a1
Revises: d4e5f6071829
Create Date: 2026-02-11

Associates teams with checklists for team-level checklist assignment.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "e5f6071829a1"
down_revision = "d4e5f6071829"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "team_checklists",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("team_id", sa.Integer(), nullable=False),
        sa.Column("checklist_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["team_id"], ["teams.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["checklist_id"], ["checklists.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_team_checklists_team_id"), "team_checklists", ["team_id"]
    )
    op.create_index(
        op.f("ix_team_checklists_checklist_id"), "team_checklists", ["checklist_id"]
    )


def downgrade():
    op.drop_index(
        op.f("ix_team_checklists_checklist_id"), table_name="team_checklists"
    )
    op.drop_index(
        op.f("ix_team_checklists_team_id"), table_name="team_checklists"
    )
    op.drop_table("team_checklists")
