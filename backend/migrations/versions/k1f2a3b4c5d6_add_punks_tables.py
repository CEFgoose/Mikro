"""Add punks and punk_changesets tables.

Revision ID: k1f2a3b4c5d6
Revises: j0e1f2a3b4c5
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "k1f2a3b4c5d6"
down_revision = "j0e1f2a3b4c5"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "punks",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("osm_username", sa.String(255), nullable=False),
        sa.Column("osm_uid", sa.BigInteger(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("tags", postgresql.ARRAY(sa.String(50)), nullable=True),
        sa.Column("added_by", sa.String(255), nullable=False),
        sa.Column("added_by_name", sa.String(200), nullable=True),
        sa.Column("org_id", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("cached_total_changesets", sa.Integer(), nullable=True),
        sa.Column("cached_last_active", sa.DateTime(), nullable=True),
        sa.Column("cached_account_created", sa.DateTime(), nullable=True),
        sa.Column("cache_updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_date", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("osm_username"),
    )
    op.create_index("ix_punks_osm_username", "punks", ["osm_username"])

    op.create_table(
        "punk_changesets",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("punk_id", sa.Integer(), nullable=False),
        sa.Column("changeset_id", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("closed_at", sa.DateTime(), nullable=True),
        sa.Column("changes_count", sa.Integer(), default=0),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("editor", sa.String(255), nullable=True),
        sa.Column("source", sa.String(255), nullable=True),
        sa.Column("centroid_lat", sa.Float(), nullable=True),
        sa.Column("centroid_lon", sa.Float(), nullable=True),
        sa.Column("hashtags", postgresql.ARRAY(sa.String(255)), nullable=True),
        sa.ForeignKeyConstraint(
            ["punk_id"], ["punks.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("changeset_id"),
    )
    op.create_index("ix_punk_changesets_punk_id", "punk_changesets", ["punk_id"])


def downgrade():
    op.drop_table("punk_changesets")
    op.drop_table("punks")
