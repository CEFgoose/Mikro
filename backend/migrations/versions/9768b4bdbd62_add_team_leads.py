"""Add team_leads association table for multi-lead-per-team support.

Revision ID: 9768b4bdbd62
Revises: ac9d0e1f2b3c
Create Date: 2026-05-08

This file's revision matches the value already in prod's
``alembic_version`` (so ``flask db upgrade`` sees nothing to do on
prod). An earlier session of this work landed on prod but the
companion migration file never made it into the repo — recreating it
here under the same revision restores a valid chain without requiring
a manual stamp.

upgrade() is idempotent: if ``team_leads`` already exists (which it
does on prod), it skips the CREATE and the backfill. Fresh dev DBs
get the table created and backfilled from ``teams.lead_id`` as
expected.

Additive only — no destructive change to the ``teams`` table.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision = "9768b4bdbd62"
down_revision = "ac9d0e1f2b3c"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    if "team_leads" in inspector.get_table_names():
        # Prod already has this table from the earlier (uncommitted) run
        # of this migration. Nothing to do.
        return

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

    op.execute(
        """
        INSERT INTO team_leads (team_id, user_id, created_at)
        SELECT id, lead_id, NOW() FROM teams
        WHERE lead_id IS NOT NULL
        ON CONFLICT (team_id, user_id) DO NOTHING
        """
    )


def downgrade():
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    if "team_leads" not in inspector.get_table_names():
        return
    op.drop_index("ix_team_leads_user_id", table_name="team_leads")
    op.drop_index("ix_team_leads_team_id", table_name="team_leads")
    op.drop_table("team_leads")
