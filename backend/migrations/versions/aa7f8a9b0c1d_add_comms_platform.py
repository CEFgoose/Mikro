"""Comms platform: notifications, email campaigns, messenger + user prefs.

Revision ID: aa7f8a9b0c1d
Revises: z6e7f8a9b0c1
Create Date: 2026-04-24

Ships the foundation for F7, F8, F9, F14, F21 and the new messenger
feature. See `.claude/comms-platform-plan.md` for the full design.

What this migration creates:

  notifications      — one row per bell notification
  email_campaigns    — admin-composed mass email history
  messages           — messenger messages (user/team/region/org scopes)
  message_reads      — per-user per-conversation read watermark

And adds 8 notify_* boolean columns to users (all default TRUE —
existing users start opted in to email notifications for every type).

No data backfill required.
"""
from alembic import op
import sqlalchemy as sa


revision = "aa7f8a9b0c1d"
down_revision = "z6e7f8a9b0c1"
branch_labels = None
depends_on = None


NOTIFY_COLUMNS = [
    "notify_entry_adjusted",
    "notify_entry_force_closed",
    "notify_adjustment_requested",
    "notify_assigned_to_project",
    "notify_payment_sent",
    "notify_bank_info_changed",
    "notify_announcement",
    "notify_message_received",
]


def upgrade():
    # ─── notifications ─────────────────────────────────────────
    op.create_table(
        "notifications",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            sa.String(255),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("org_id", sa.String(255), nullable=False, index=True),
        sa.Column("actor_id", sa.String(255), nullable=True),
        sa.Column("type", sa.String(50), nullable=False, index=True),
        sa.Column("message", sa.String(500), nullable=False),
        sa.Column("link", sa.String(255), nullable=True),
        sa.Column("entity_type", sa.String(50), nullable=True),
        sa.Column("entity_id", sa.Integer, nullable=True),
        sa.Column(
            "is_read",
            sa.Boolean,
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column(
            "created_at",
            sa.DateTime,
            nullable=False,
            server_default=sa.func.now(),
            index=True,
        ),
    )
    op.create_index(
        "ix_notifications_user_unread",
        "notifications",
        ["user_id", "is_read"],
    )
    op.create_index(
        "ix_notifications_user_created",
        "notifications",
        ["user_id", "created_at"],
    )

    # ─── email_campaigns ───────────────────────────────────────
    op.create_table(
        "email_campaigns",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("org_id", sa.String(255), nullable=False, index=True),
        sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("body_html", sa.Text, nullable=False),
        sa.Column(
            "sent_by",
            sa.String(255),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("audience", sa.String(50), nullable=False),
        sa.Column(
            "is_forced",
            sa.Boolean,
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column("sent_at", sa.DateTime, nullable=True),
        sa.Column("recipient_count", sa.Integer, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime,
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    # ─── messages ──────────────────────────────────────────────
    op.create_table(
        "messages",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("org_id", sa.String(255), nullable=False, index=True),
        sa.Column(
            "sender_id",
            sa.String(255),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("target_type", sa.String(10), nullable=False),
        sa.Column(
            "target_user_id",
            sa.String(255),
            sa.ForeignKey("users.id"),
            nullable=True,
            index=True,
        ),
        sa.Column(
            "target_team_id",
            sa.Integer,
            sa.ForeignKey("teams.id"),
            nullable=True,
            index=True,
        ),
        sa.Column(
            "target_region_id",
            sa.Integer,
            sa.ForeignKey("regions.id"),
            nullable=True,
            index=True,
        ),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime,
            nullable=False,
            server_default=sa.func.now(),
            index=True,
        ),
    )
    op.create_index(
        "ix_messages_dm_pair",
        "messages",
        ["target_type", "target_user_id", "sender_id", "created_at"],
    )
    op.create_index(
        "ix_messages_team_time",
        "messages",
        ["target_type", "target_team_id", "created_at"],
    )
    op.create_index(
        "ix_messages_region_time",
        "messages",
        ["target_type", "target_region_id", "created_at"],
    )
    op.create_index(
        "ix_messages_org_time",
        "messages",
        ["target_type", "org_id", "created_at"],
    )

    # ─── message_reads ─────────────────────────────────────────
    op.create_table(
        "message_reads",
        sa.Column(
            "user_id",
            sa.String(255),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("scope_type", sa.String(10), primary_key=True),
        sa.Column("scope_key", sa.String(255), primary_key=True),
        sa.Column(
            "last_read_at",
            sa.DateTime,
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    # ─── users.notify_* columns ────────────────────────────────
    for col in NOTIFY_COLUMNS:
        op.add_column(
            "users",
            sa.Column(
                col,
                sa.Boolean,
                nullable=False,
                server_default=sa.true(),
            ),
        )


def downgrade():
    for col in NOTIFY_COLUMNS:
        op.drop_column("users", col)

    op.drop_table("message_reads")

    op.drop_index("ix_messages_org_time", table_name="messages")
    op.drop_index("ix_messages_region_time", table_name="messages")
    op.drop_index("ix_messages_team_time", table_name="messages")
    op.drop_index("ix_messages_dm_pair", table_name="messages")
    op.drop_table("messages")

    op.drop_table("email_campaigns")

    op.drop_index("ix_notifications_user_created", table_name="notifications")
    op.drop_index("ix_notifications_user_unread", table_name="notifications")
    op.drop_table("notifications")
