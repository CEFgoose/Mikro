"""Add monitored_channels and channel_posts tables

Revision ID: t0f1a2b3c4d5
Revises: s9e0f1a2b3c4
Create Date: 2026-03-30
"""
from alembic import op
import sqlalchemy as sa

revision = "t0f1a2b3c4d5"
down_revision = "s9e0f1a2b3c4"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "monitored_channels",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("org_id", sa.String(255), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("url", sa.String(512), nullable=False),
        sa.Column("channel_type", sa.String(50), server_default="rss"),
        sa.Column("active", sa.Boolean(), server_default="True"),
        sa.Column("last_fetched_at", sa.DateTime(), nullable=True),
        sa.Column("last_summary", sa.Text(), nullable=True),
        sa.Column("last_summary_at", sa.DateTime(), nullable=True),
        sa.Column("post_count", sa.Integer(), server_default="0"),
        sa.Column("created_by", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_monitored_channels_org_id", "monitored_channels", ["org_id"])

    op.create_table(
        "channel_posts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("channel_id", sa.Integer(), nullable=False),
        sa.Column("external_id", sa.String(512), nullable=True),
        sa.Column("title", sa.String(512), nullable=True),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("author", sa.String(255), nullable=True),
        sa.Column("published_at", sa.DateTime(), nullable=True),
        sa.Column("fetched_at", sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["channel_id"], ["monitored_channels.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_channel_posts_channel_id", "channel_posts", ["channel_id"])

def downgrade():
    op.drop_index("ix_channel_posts_channel_id", table_name="channel_posts")
    op.drop_table("channel_posts")
    op.drop_index("ix_monitored_channels_org_id", table_name="monitored_channels")
    op.drop_table("monitored_channels")
