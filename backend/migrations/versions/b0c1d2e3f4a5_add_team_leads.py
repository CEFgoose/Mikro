"""Add team_leads association table for multi-lead-per-team support.

Revision ID: b0c1d2e3f4a5
Revises: ac9d0e1f2b3c
Create Date: 2026-05-11

Adds a `team_leads (team_id, user_id)` association table so a single team
can have multiple leads. Backfills from the existing `teams.lead_id`
pointer. The `lead_id` column on `teams` stays in place as a denormalized
"primary lead" for display/backward-compat — `managed_team_ids_for()`
queries this new table.

Additive only — no destructive change to the `teams` table.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b0c1d2e3f4a5"
down_revision = "ac9d0e1f2b3c"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "team_leads",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column(
            "team_id",
            sa.Integer(),
            sa.ForeignKey("teams.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "team_id", "user_id", name="uq_team_leads_team_user"
        ),
    )
    op.create_index("ix_team_leads_team_id", "team_leads", ["team_id"])
    op.create_index("ix_team_leads_user_id", "team_leads", ["user_id"])

    # Backfill: every team that has a lead_id today gets one row in the
    # new association table. Idempotent given the unique constraint —
    # safe to re-run on partially-populated databases.
    op.execute(
        """
        INSERT INTO team_leads (team_id, user_id, created_at)
        SELECT id, lead_id, NOW() FROM teams
        WHERE lead_id IS NOT NULL
        ON CONFLICT (team_id, user_id) DO NOTHING
        """
    )


def downgrade():
    op.drop_index("ix_team_leads_user_id", table_name="team_leads")
    op.drop_index("ix_team_leads_team_id", table_name="team_leads")
    op.drop_table("team_leads")
