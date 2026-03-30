"""Add friends and friend_changesets tables

Revision ID: r8d9e0f1a2b3
Revises: q7c8d9e0f1a2
Create Date: 2026-03-30
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY

revision = "r8d9e0f1a2b3"
down_revision = "q7c8d9e0f1a2"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "friends",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("osm_username", sa.String(255), nullable=False),
        sa.Column("osm_uid", sa.BigInteger(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("tags", ARRAY(sa.String(50)), nullable=True),
        sa.Column("added_by", sa.String(255), nullable=False),
        sa.Column("added_by_name", sa.String(200), nullable=True),
        sa.Column("org_id", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("cached_total_changesets", sa.Integer(), nullable=True),
        sa.Column("cached_last_active", sa.DateTime(), nullable=True),
        sa.Column("cached_account_created", sa.DateTime(), nullable=True),
        sa.Column("cache_updated_at", sa.DateTime(), nullable=True),
        sa.Column("cached_discussions", sa.Text(), nullable=True),
        sa.Column("flagged_discussions", sa.Text(), nullable=True),
        sa.Column("deleted_date", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("osm_username"),
    )

    op.create_table(
        "friend_changesets",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("friend_id", sa.Integer(), nullable=False),
        sa.Column("changeset_id", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("closed_at", sa.DateTime(), nullable=True),
        sa.Column("changes_count", sa.Integer(), server_default="0"),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("editor", sa.String(255), nullable=True),
        sa.Column("source", sa.String(255), nullable=True),
        sa.Column("centroid_lat", sa.Float(), nullable=True),
        sa.Column("centroid_lon", sa.Float(), nullable=True),
        sa.Column("hashtags", ARRAY(sa.String(255)), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["friend_id"], ["friends.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("changeset_id"),
    )
    op.create_index("ix_friend_changesets_friend_id", "friend_changesets", ["friend_id"])

def downgrade():
    op.drop_index("ix_friend_changesets_friend_id", table_name="friend_changesets")
    op.drop_table("friend_changesets")
    op.drop_table("friends")
