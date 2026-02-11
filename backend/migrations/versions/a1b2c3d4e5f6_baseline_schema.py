"""Baseline schema - all tables from current models.

Revision ID: a1b2c3d4e5f6
Revises: None
Create Date: 2026-02-10

This is a squashed baseline migration that creates the full schema
from scratch. All previous migrations have been consolidated into
this single file.

For existing databases: stamp this revision without running it:
    flask db stamp a1b2c3d4e5f6

For fresh databases: run normally:
    flask db upgrade
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # === Independent tables (no foreign keys) ===

    op.create_table(
        "users",
        sa.Column("id", sa.String(255), primary_key=True, nullable=False),
        sa.Column("auth0_sub", sa.String(255), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("payment_email", sa.String(255), nullable=True),
        sa.Column("first_name", sa.String(100), nullable=True),
        sa.Column("last_name", sa.String(100), nullable=True),
        sa.Column("osm_username", sa.String(100), nullable=True),
        sa.Column("osm_id", sa.BigInteger, nullable=True),
        sa.Column("osm_verified", sa.Boolean, server_default="False", nullable=True),
        sa.Column("osm_verified_at", sa.DateTime, nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("country", sa.String(100), nullable=True),
        sa.Column("role", sa.String(50), nullable=True),
        sa.Column("org_id", sa.String(255), nullable=True),
        sa.Column("create_time", sa.DateTime, nullable=True),
        sa.Column(
            "assigned_projects",
            postgresql.ARRAY(sa.Integer()),
            nullable=True,
        ),
        sa.Column(
            "assigned_checklists",
            postgresql.ARRAY(sa.Integer()),
            nullable=True,
        ),
        sa.Column("mapper_level", sa.Integer, nullable=True),
        sa.Column("mapper_points", sa.Integer, nullable=True),
        sa.Column("validator_points", sa.Integer, nullable=True),
        sa.Column("special_project_points", sa.Integer, nullable=True),
        sa.Column(
            "validation_payable_total",
            sa.Float,
            nullable=True,
            server_default="0",
        ),
        sa.Column(
            "mapping_payable_total",
            sa.Float,
            nullable=True,
            server_default="0",
        ),
        sa.Column(
            "checklist_payable_total",
            sa.Float,
            nullable=True,
            server_default="0",
        ),
        sa.Column("payable_total", sa.Float, nullable=True, server_default="0"),
        sa.Column("requested_total", sa.Float, nullable=True, server_default="0"),
        sa.Column("paid_total", sa.Float, nullable=True, server_default="0"),
        sa.Column(
            "total_tasks_mapped",
            sa.BigInteger,
            nullable=True,
            server_default="0",
        ),
        sa.Column(
            "total_tasks_validated",
            sa.BigInteger,
            nullable=True,
            server_default="0",
        ),
        sa.Column(
            "total_tasks_invalidated",
            sa.Integer,
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "total_checklists_completed",
            sa.Integer,
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "validator_total_checklists_confirmed",
            sa.Integer,
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "validator_tasks_invalidated",
            sa.Integer,
            nullable=True,
            server_default="0",
        ),
        sa.Column(
            "validator_tasks_validated",
            sa.Integer,
            nullable=True,
            server_default="0",
        ),
        sa.Column(
            "requesting_payment",
            sa.Boolean,
            nullable=False,
            server_default="False",
        ),
        sa.Column(
            "time_tracking_required",
            sa.Boolean,
            nullable=False,
            server_default="False",
        ),
        sa.Column("deleted_date", sa.DateTime, nullable=True),
        sa.UniqueConstraint("auth0_sub"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("osm_username"),
        sa.UniqueConstraint("osm_id"),
    )
    op.create_index("ix_users_auth0_sub", "users", ["auth0_sub"])
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_osm_username", "users", ["osm_username"])
    op.create_index("ix_users_osm_id", "users", ["osm_id"])
    op.create_index("ix_users_deleted_date", "users", ["deleted_date"])

    op.create_table(
        "projects",
        sa.Column(
            "id", sa.Integer, primary_key=True, autoincrement=False, nullable=False
        ),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("org_id", sa.String(255), nullable=True),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("max_payment", sa.Float, nullable=True),
        sa.Column("payment_due", sa.Float, nullable=True),
        sa.Column("total_payout", sa.Float, nullable=True),
        sa.Column("validation_rate_per_task", sa.Float, nullable=True),
        sa.Column("mapping_rate_per_task", sa.Float, nullable=True),
        sa.Column("max_editors", sa.Integer, nullable=True),
        sa.Column("max_validators", sa.Integer, nullable=True),
        sa.Column("total_editors", sa.BigInteger, nullable=True),
        sa.Column("total_validators", sa.BigInteger, nullable=True),
        sa.Column("total_tasks", sa.BigInteger, nullable=True),
        sa.Column("tasks_mapped", sa.BigInteger, nullable=True),
        sa.Column("tasks_validated", sa.BigInteger, nullable=True),
        sa.Column("tasks_invalidated", sa.BigInteger, nullable=True),
        sa.Column("difficulty", sa.String(50), nullable=True),
        sa.Column("visibility", sa.Boolean, nullable=True, server_default="False"),
        sa.Column("status", sa.Boolean, nullable=True, server_default="False"),
        sa.Column("completed", sa.Boolean, nullable=True, server_default="False"),
        sa.Column("deleted_date", sa.DateTime, nullable=True),
    )
    op.create_index("ix_projects_deleted_date", "projects", ["deleted_date"])

    op.create_table(
        "tasks",
        sa.Column("id", sa.BigInteger, primary_key=True, nullable=False),
        sa.Column("task_id", sa.BigInteger, nullable=True),
        sa.Column("org_id", sa.String(255), nullable=True),
        sa.Column("project_id", sa.BigInteger, nullable=False),
        sa.Column("validation_rate", sa.Float, nullable=True),
        sa.Column("mapping_rate", sa.Float, nullable=True),
        sa.Column("paid_out", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("mapped", sa.Boolean, nullable=True, server_default="false"),
        sa.Column("validated", sa.Boolean, nullable=True, server_default="false"),
        sa.Column("invalidated", sa.Boolean, nullable=True, server_default="false"),
        sa.Column("self_validated", sa.Boolean, nullable=True, server_default="false"),
        sa.Column("parent_task_id", sa.Integer, nullable=True),
        sa.Column("sibling_count", sa.Integer, nullable=True),
        sa.Column("date_mapped", sa.DateTime, nullable=True),
        sa.Column("date_validated", sa.DateTime, nullable=True),
        sa.Column("mapped_by", sa.String(100), nullable=False),
        sa.Column("validated_by", sa.String(100), nullable=True),
        sa.Column(
            "unknown_validator", sa.Boolean, nullable=True, server_default="false"
        ),
        sa.Column("deleted_date", sa.DateTime, nullable=True),
    )
    op.create_index("ix_tasks_task_id", "tasks", ["task_id"])
    op.create_index("ix_tasks_project_id", "tasks", ["project_id"])
    op.create_index("ix_tasks_deleted_date", "tasks", ["deleted_date"])

    op.create_table(
        "checklists",
        sa.Column("id", sa.BigInteger, primary_key=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("author", sa.String(200), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("due_date", sa.DateTime, nullable=True),
        sa.Column("org_id", sa.String(255), nullable=True),
        sa.Column("total_payout", sa.Float, nullable=True),
        sa.Column("validation_rate", sa.Float, nullable=True),
        sa.Column("completion_rate", sa.Float, nullable=True),
        sa.Column("difficulty", sa.String(50), nullable=True),
        sa.Column("visibility", sa.Boolean, nullable=True, server_default="False"),
        sa.Column("active_status", sa.Boolean, nullable=True, server_default="False"),
        sa.Column("completed", sa.Boolean, nullable=True, server_default="False"),
        sa.Column("confirmed", sa.Boolean, nullable=True, server_default="False"),
        sa.Column("deleted_date", sa.DateTime, nullable=True),
    )
    op.create_index("ix_checklists_deleted_date", "checklists", ["deleted_date"])

    op.create_table(
        "checklist_item",
        sa.Column("id", sa.BigInteger, primary_key=True, nullable=False),
        sa.Column("checklist_id", sa.BigInteger, nullable=True),
        sa.Column("item_number", sa.Integer, nullable=True),
        sa.Column("item_action", sa.Text, nullable=True),
        sa.Column("item_link", sa.String(500), nullable=True),
        sa.Column("deleted_date", sa.DateTime, nullable=True),
    )
    op.create_index("ix_checklist_item_checklist_id", "checklist_item", ["checklist_id"])
    op.create_index(
        "ix_checklist_item_deleted_date", "checklist_item", ["deleted_date"]
    )

    op.create_table(
        "checklist_comment",
        sa.Column("id", sa.BigInteger, primary_key=True, nullable=False),
        sa.Column("checklist_id", sa.BigInteger, nullable=True),
        sa.Column("comment", sa.Text, nullable=True),
        sa.Column("author", sa.String(200), nullable=True),
        sa.Column("role", sa.String(50), nullable=True),
        sa.Column("date", sa.DateTime, nullable=True),
        sa.Column("deleted_date", sa.DateTime, nullable=True),
    )
    op.create_index(
        "ix_checklist_comment_checklist_id", "checklist_comment", ["checklist_id"]
    )
    op.create_index(
        "ix_checklist_comment_deleted_date", "checklist_comment", ["deleted_date"]
    )

    op.create_table(
        "user_checklists",
        sa.Column("id", sa.BigInteger, primary_key=True, nullable=False),
        sa.Column("user_id", sa.String(255), nullable=True),
        sa.Column("checklist_id", sa.BigInteger, nullable=True),
        sa.Column("date_created", sa.DateTime, nullable=True),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("author", sa.String(200), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("due_date", sa.DateTime, nullable=True),
        sa.Column("org_id", sa.String(255), nullable=True),
        sa.Column("total_payout", sa.Float, nullable=True),
        sa.Column("validation_rate", sa.Float, nullable=True),
        sa.Column("completion_rate", sa.Float, nullable=True),
        sa.Column("difficulty", sa.String(50), nullable=True),
        sa.Column("visibility", sa.Boolean, nullable=True, server_default="False"),
        sa.Column("active_status", sa.Boolean, nullable=True, server_default="False"),
        sa.Column("completed", sa.Boolean, nullable=True, server_default="False"),
        sa.Column("confirmed", sa.Boolean, nullable=True, server_default="False"),
        sa.Column("last_completion_date", sa.DateTime, nullable=True),
        sa.Column("last_confirmation_date", sa.DateTime, nullable=True),
        sa.Column("final_completion_date", sa.DateTime, nullable=True),
        sa.Column("final_confirmation_date", sa.DateTime, nullable=True),
        sa.Column("deleted_date", sa.DateTime, nullable=True),
    )
    op.create_index("ix_user_checklists_user_id", "user_checklists", ["user_id"])
    op.create_index(
        "ix_user_checklists_checklist_id", "user_checklists", ["checklist_id"]
    )
    op.create_index(
        "ix_user_checklists_deleted_date", "user_checklists", ["deleted_date"]
    )

    op.create_table(
        "user_checklist_item",
        sa.Column("id", sa.BigInteger, primary_key=True, nullable=False),
        sa.Column("user_id", sa.String(255), nullable=True),
        sa.Column("checklist_id", sa.BigInteger, nullable=True),
        sa.Column("item_number", sa.Integer, nullable=True),
        sa.Column("item_action", sa.Text, nullable=True),
        sa.Column("item_link", sa.String(500), nullable=True),
        sa.Column("completed", sa.Boolean, nullable=True, server_default="false"),
        sa.Column("confirmed", sa.Boolean, nullable=True, server_default="false"),
        sa.Column("completion_date", sa.DateTime, nullable=True),
        sa.Column("confirmation_date", sa.DateTime, nullable=True),
        sa.Column("deleted_date", sa.DateTime, nullable=True),
    )
    op.create_index(
        "ix_user_checklist_item_user_id", "user_checklist_item", ["user_id"]
    )
    op.create_index(
        "ix_user_checklist_item_checklist_id",
        "user_checklist_item",
        ["checklist_id"],
    )
    op.create_index(
        "ix_user_checklist_item_deleted_date",
        "user_checklist_item",
        ["deleted_date"],
    )

    op.create_table(
        "training",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("org_id", sa.String(255), nullable=True),
        sa.Column("training_type", sa.String(100), nullable=True),
        sa.Column("point_value", sa.Integer, nullable=True),
        sa.Column("training_url", sa.String(500), nullable=True),
        sa.Column("difficulty", sa.String(50), nullable=True),
        sa.Column("deleted_date", sa.DateTime, nullable=True),
    )
    op.create_index("ix_training_deleted_date", "training", ["deleted_date"])

    op.create_table(
        "requests",
        sa.Column("id", sa.BigInteger, primary_key=True, nullable=False),
        sa.Column("org_id", sa.String(255), nullable=True),
        sa.Column("amount_requested", sa.Float, nullable=True),
        sa.Column("user_id", sa.String(255), nullable=True),
        sa.Column("user_name", sa.String(200), nullable=True),
        sa.Column("osm_username", sa.String(100), nullable=True),
        sa.Column("payment_email", sa.String(255), nullable=True),
        sa.Column(
            "task_ids", postgresql.ARRAY(sa.Integer()), nullable=True
        ),
        sa.Column("date_requested", sa.DateTime, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
    )
    op.create_index("ix_requests_user_id", "requests", ["user_id"])

    op.create_table(
        "payments",
        sa.Column("id", sa.BigInteger, primary_key=True, nullable=False),
        sa.Column("org_id", sa.String(255), nullable=True),
        sa.Column("payoneer_id", sa.String(100), nullable=True),
        sa.Column("amount_paid", sa.Float, nullable=True),
        sa.Column("user_name", sa.String(200), nullable=True),
        sa.Column("osm_username", sa.String(100), nullable=True),
        sa.Column("user_id", sa.String(255), nullable=True),
        sa.Column("payment_email", sa.String(255), nullable=True),
        sa.Column(
            "task_ids", postgresql.ARRAY(sa.Integer()), nullable=True
        ),
        sa.Column("date_paid", sa.DateTime, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
    )
    op.create_index("ix_payments_user_id", "payments", ["user_id"])

    # === Tables with foreign keys ===

    op.create_table(
        "validator_task_actions",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("validator_id", sa.String(255), nullable=False),
        sa.Column("task_id", sa.BigInteger, nullable=False),
        sa.Column("project_id", sa.Integer, nullable=False),
        sa.Column("action_type", sa.String(20), nullable=False),
        sa.Column("action_date", sa.DateTime, nullable=False),
        sa.Column("paid", sa.Boolean, nullable=True, server_default="false"),
        sa.ForeignKeyConstraint(
            ["validator_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["task_id"], ["tasks.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["project_id"], ["projects.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        "ix_validator_task_actions_validator_id",
        "validator_task_actions",
        ["validator_id"],
    )
    op.create_index(
        "ix_validator_task_actions_task_id",
        "validator_task_actions",
        ["task_id"],
    )
    op.create_index(
        "ix_validator_task_actions_project_id",
        "validator_task_actions",
        ["project_id"],
    )

    op.create_table(
        "training_question",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("training_id", sa.BigInteger, nullable=True),
        sa.Column("question", sa.Text, nullable=True),
        sa.Column("deleted_date", sa.DateTime, nullable=True),
        sa.ForeignKeyConstraint(
            ["training_id"], ["training.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        "ix_training_question_training_id", "training_question", ["training_id"]
    )
    op.create_index(
        "ix_training_question_deleted_date", "training_question", ["deleted_date"]
    )

    op.create_table(
        "training_question_answer",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("training_id", sa.BigInteger, nullable=True),
        sa.Column("training_question_id", sa.BigInteger, nullable=True),
        sa.Column("value", sa.Boolean, nullable=True),
        sa.Column("answer", sa.Text, nullable=True),
        sa.Column("deleted_date", sa.DateTime, nullable=True),
        sa.ForeignKeyConstraint(
            ["training_id"], ["training.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["training_question_id"],
            ["training_question.id"],
            ondelete="CASCADE",
        ),
    )
    op.create_index(
        "ix_training_question_answer_training_id",
        "training_question_answer",
        ["training_id"],
    )
    op.create_index(
        "ix_training_question_answer_training_question_id",
        "training_question_answer",
        ["training_question_id"],
    )
    op.create_index(
        "ix_training_question_answer_deleted_date",
        "training_question_answer",
        ["deleted_date"],
    )

    op.create_table(
        "project_training",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("training_id", sa.Integer, nullable=True),
        sa.Column("project_id", sa.BigInteger, nullable=True),
        sa.ForeignKeyConstraint(
            ["training_id"], ["training.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["project_id"], ["projects.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        "ix_project_training_training_id", "project_training", ["training_id"]
    )
    op.create_index(
        "ix_project_training_project_id", "project_training", ["project_id"]
    )

    op.create_table(
        "training_completed",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(255), nullable=True),
        sa.Column("training_id", sa.BigInteger, nullable=True),
        sa.ForeignKeyConstraint(
            ["training_id"], ["training.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        "ix_training_completed_user_id", "training_completed", ["user_id"]
    )
    op.create_index(
        "ix_training_completed_training_id",
        "training_completed",
        ["training_id"],
    )

    op.create_table(
        "project_users",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(255), nullable=True),
        sa.Column("project_id", sa.BigInteger, nullable=True),
        sa.ForeignKeyConstraint(
            ["project_id"], ["projects.id"], ondelete="CASCADE"
        ),
    )
    op.create_index("ix_project_users_user_id", "project_users", ["user_id"])
    op.create_index(
        "ix_project_users_project_id", "project_users", ["project_id"]
    )

    op.create_table(
        "user_tasks",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(255), nullable=False),
        sa.Column("task_id", sa.BigInteger, nullable=False),
        sa.Column(
            "timestamp",
            sa.TIMESTAMP,
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["task_id"], ["tasks.id"], ondelete="CASCADE"
        ),
    )
    op.create_index("ix_user_tasks_user_id", "user_tasks", ["user_id"])
    op.create_index("ix_user_tasks_task_id", "user_tasks", ["task_id"])

    op.create_table(
        "time_entries",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(255), nullable=False),
        sa.Column("project_id", sa.Integer, nullable=True),
        sa.Column("org_id", sa.String(255), nullable=True),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("clock_in", sa.DateTime, nullable=False),
        sa.Column("clock_out", sa.DateTime, nullable=True),
        sa.Column("duration_seconds", sa.Integer, nullable=True),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="active",
        ),
        sa.Column("changeset_count", sa.Integer, nullable=True),
        sa.Column("changes_count", sa.Integer, nullable=True),
        sa.Column("voided_by", sa.String(255), nullable=True),
        sa.Column("voided_at", sa.DateTime, nullable=True),
        sa.Column("edited_by", sa.String(255), nullable=True),
        sa.Column("edited_at", sa.DateTime, nullable=True),
        sa.Column("force_clocked_out_by", sa.String(255), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["project_id"], ["projects.id"], ondelete="SET NULL"
        ),
    )
    op.create_index("ix_time_entries_user_id", "time_entries", ["user_id"])
    op.create_index("ix_time_entries_project_id", "time_entries", ["project_id"])
    op.create_index("ix_time_entries_org_id", "time_entries", ["org_id"])
    op.create_index(
        "ix_time_entries_user_status", "time_entries", ["user_id", "status"]
    )
    op.create_index(
        "ix_time_entries_org_status", "time_entries", ["org_id", "status"]
    )


def downgrade():
    # Drop in reverse order (dependent tables first)
    op.drop_table("time_entries")
    op.drop_table("user_tasks")
    op.drop_table("project_users")
    op.drop_table("training_completed")
    op.drop_table("project_training")
    op.drop_table("training_question_answer")
    op.drop_table("training_question")
    op.drop_table("validator_task_actions")
    op.drop_table("payments")
    op.drop_table("requests")
    op.drop_table("training")
    op.drop_table("user_checklist_item")
    op.drop_table("user_checklists")
    op.drop_table("checklist_comment")
    op.drop_table("checklist_item")
    op.drop_table("checklists")
    op.drop_table("tasks")
    op.drop_table("projects")
    op.drop_table("users")
