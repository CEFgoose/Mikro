"""Add location assignment tables for projects, trainings, checklists

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-02-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a7b8c9d0e1f2"
down_revision = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "project_countries",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("project_id", sa.BigInteger(), nullable=False),
        sa.Column("country_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["project_id"], ["projects.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["country_id"], ["countries.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_project_countries_project_id",
        "project_countries",
        ["project_id"],
    )
    op.create_index(
        "ix_project_countries_country_id",
        "project_countries",
        ["country_id"],
    )

    op.create_table(
        "training_countries",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("training_id", sa.Integer(), nullable=False),
        sa.Column("country_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["training_id"], ["training.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["country_id"], ["countries.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_training_countries_training_id",
        "training_countries",
        ["training_id"],
    )
    op.create_index(
        "ix_training_countries_country_id",
        "training_countries",
        ["country_id"],
    )

    op.create_table(
        "checklist_countries",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("checklist_id", sa.BigInteger(), nullable=False),
        sa.Column("country_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["checklist_id"], ["checklists.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["country_id"], ["countries.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_checklist_countries_checklist_id",
        "checklist_countries",
        ["checklist_id"],
    )
    op.create_index(
        "ix_checklist_countries_country_id",
        "checklist_countries",
        ["country_id"],
    )


def downgrade():
    op.drop_table("checklist_countries")
    op.drop_table("training_countries")
    op.drop_table("project_countries")
