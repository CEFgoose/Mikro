#!/usr/bin/env python3
"""
Database models for Mikro API.

This module defines all SQLAlchemy models for the Mikro application.
Updated for Auth0 authentication (string-based user IDs).
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Column,
    String,
    DateTime,
    func,
    Integer,
    Boolean,
    Float,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.ext.mutable import MutableList

from .common import ModelWithSoftDeleteAndCRUD, SurrogatePK, CRUDMixin, db


class User(ModelWithSoftDeleteAndCRUD, SurrogatePK):
    """
    User model for Mikro.

    Users are identified by their Auth0 'sub' claim (string).
    """

    __tablename__ = "users"

    # Primary key is Auth0 sub (string format: "auth0|abc123" or "google-oauth2|123")
    id = db.Column(db.String(255), primary_key=True, nullable=False)
    auth0_sub = db.Column(db.String(255), unique=True, nullable=False, index=True)

    # User info
    email = Column(String(255), unique=True, nullable=True, index=True)
    payment_email = Column(String(255), nullable=True)
    first_name = Column(String(100))
    last_name = Column(String(100))
    osm_username = Column(String(100), unique=True, nullable=True, index=True)

    # OSM Account Linking
    osm_id = Column(BigInteger, nullable=True, unique=True, index=True)
    osm_verified = Column(Boolean, default=False, server_default="False")
    osm_verified_at = Column(DateTime, nullable=True)

    # Location
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)

    # Role and organization
    role = Column(String(50), default="user")  # user, validator, admin
    org_id = Column(String(255), nullable=True)  # Auth0 org ID (string)

    # Timestamps
    create_time = Column(DateTime, default=func.now())

    # Assignments
    assigned_projects = Column(MutableList.as_mutable(ARRAY(Integer)))
    assigned_checklists = Column(MutableList.as_mutable(ARRAY(Integer)))

    # Mapper stats
    mapper_level = db.Column(db.Integer, default=0, nullable=True)
    mapper_points = db.Column(db.Integer, default=0, nullable=True)
    validator_points = db.Column(db.Integer, default=0, nullable=True)
    special_project_points = db.Column(db.Integer, default=0, nullable=True)

    # Payment tracking
    validation_payable_total = db.Column(
        db.Float, nullable=True, default=0, server_default="0"
    )
    mapping_payable_total = db.Column(
        db.Float, nullable=True, default=0, server_default="0"
    )
    checklist_payable_total = db.Column(
        db.Float, nullable=True, default=0, server_default="0"
    )
    payable_total = db.Column(db.Float, nullable=True, default=0, server_default="0")
    requested_total = db.Column(db.Float, nullable=True, default=0, server_default="0")
    paid_total = db.Column(db.Float, nullable=True, default=0, server_default="0")

    # Task stats
    total_tasks_mapped = db.Column(
        db.BigInteger, nullable=True, default=0, server_default="0"
    )
    total_tasks_validated = db.Column(
        db.BigInteger, nullable=True, default=0, server_default="0"
    )
    total_tasks_invalidated = db.Column(
        db.Integer, nullable=False, default=0, server_default="0"
    )

    # Checklist stats
    total_checklists_completed = db.Column(
        db.Integer, nullable=False, default=0, server_default="0"
    )
    validator_total_checklists_confirmed = db.Column(
        db.Integer, nullable=False, default=0, server_default="0"
    )

    # Validator stats
    validator_tasks_invalidated = db.Column(
        db.Integer, nullable=True, default=0, server_default="0"
    )
    validator_tasks_validated = db.Column(
        db.Integer, nullable=True, default=0, server_default="0"
    )

    # Payment request status
    requesting_payment = db.Column(
        db.Boolean,
        nullable=False,
        default=False,
        server_default="False",
    )

    def __repr__(self):
        return f"<User {self.email}>"

    @property
    def full_name(self):
        """Return the user's full name."""
        return f"{self.first_name or ''} {self.last_name or ''}".strip()


class Project(ModelWithSoftDeleteAndCRUD, SurrogatePK):
    """TM4 Project model."""

    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True, autoincrement=False)
    name = db.Column(db.String(255), nullable=True)
    org_id = db.Column(db.String(255), nullable=True)  # Changed to String for Auth0
    url = db.Column(db.String(500), nullable=False)

    # Payment settings
    max_payment = db.Column(db.Float, nullable=True, default=0)
    payment_due = db.Column(db.Float, nullable=True, default=0)
    total_payout = db.Column(db.Float, nullable=True, default=0)
    validation_rate_per_task = db.Column(db.Float, nullable=True, default=100)
    mapping_rate_per_task = db.Column(db.Float, nullable=True, default=100)

    # Capacity
    max_editors = db.Column(db.Integer, nullable=True, default=5)
    max_validators = db.Column(db.Integer, nullable=True, default=5)
    total_editors = db.Column(db.BigInteger, default=0)
    total_validators = db.Column(db.BigInteger, default=0)

    # Task stats
    total_tasks = db.Column(db.BigInteger, default=0)
    tasks_mapped = db.Column(db.BigInteger, default=0)
    tasks_validated = db.Column(db.BigInteger, default=0)
    tasks_invalidated = db.Column(db.BigInteger, default=0)

    # Metadata
    difficulty = db.Column(db.String(50), nullable=True, default="Intermediate")
    visibility = db.Column(db.Boolean, nullable=True, server_default="False")
    status = db.Column(db.Boolean, nullable=True, server_default="False")
    completed = db.Column(db.Boolean, nullable=True, server_default="False")

    def __repr__(self):
        return f"<Project {self.id}: {self.name}>"


class Task(ModelWithSoftDeleteAndCRUD, SurrogatePK):
    """Task model for tracking individual TM4 tasks."""

    __tablename__ = "tasks"

    id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    task_id = db.Column(db.BigInteger, nullable=True, index=True)
    org_id = db.Column(db.String(255), nullable=True)  # Changed to String for Auth0
    project_id = db.Column(db.BigInteger, nullable=False, index=True)

    # Rates
    validation_rate = db.Column(db.Float, nullable=True, default=100)
    mapping_rate = db.Column(db.Float, nullable=True, default=100)

    # Status
    paid_out = db.Column(db.Boolean, nullable=False, default=False)
    mapped = db.Column(db.Boolean, nullable=True, default=False)
    validated = db.Column(db.Boolean, nullable=True, default=False)
    invalidated = db.Column(db.Boolean, nullable=True, default=False)

    # Attribution
    mapped_by = db.Column(db.String(100), nullable=False)
    validated_by = db.Column(db.String(100), nullable=True)
    unknown_validator = db.Column(db.Boolean, nullable=True, default=False)

    def __repr__(self):
        return f"<Task {self.task_id} in Project {self.project_id}>"


class Checklist(ModelWithSoftDeleteAndCRUD, SurrogatePK, db.Model):
    """Checklist template model."""

    __tablename__ = "checklists"

    id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    name = db.Column(db.String(255), nullable=True)
    author = db.Column(db.String(200), nullable=True)
    description = db.Column(db.Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    org_id = db.Column(db.String(255), nullable=True)

    # Rates
    total_payout = db.Column(db.Float, nullable=True, default=0)
    validation_rate = db.Column(db.Float, nullable=True, default=100)
    completion_rate = db.Column(db.Float, nullable=True, default=100)

    # Metadata
    difficulty = db.Column(db.String(50), nullable=True, default="Intermediate")
    visibility = db.Column(db.Boolean, nullable=True, server_default="False")
    active_status = db.Column(db.Boolean, nullable=True, server_default="False")
    completed = db.Column(db.Boolean, nullable=True, server_default="False")
    confirmed = db.Column(db.Boolean, nullable=True, server_default="False")


class ChecklistItem(ModelWithSoftDeleteAndCRUD, SurrogatePK, db.Model):
    """Individual item within a checklist."""

    __tablename__ = "checklist_item"

    id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    checklist_id = db.Column(db.BigInteger, index=True)
    item_number = db.Column(db.Integer)
    item_action = db.Column(db.Text)
    item_link = db.Column(db.String(500))


class ChecklistComment(ModelWithSoftDeleteAndCRUD, SurrogatePK, db.Model):
    """Comment on a checklist."""

    __tablename__ = "checklist_comment"

    id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    checklist_id = db.Column(db.BigInteger, index=True)
    comment = db.Column(db.Text)
    author = db.Column(db.String(200))
    role = db.Column(db.String(50))
    date = Column(DateTime, default=func.now())


class UserChecklist(ModelWithSoftDeleteAndCRUD, SurrogatePK, db.Model):
    """User's instance of a checklist."""

    __tablename__ = "user_checklists"

    id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    user_id = db.Column(db.String(255), index=True)  # Changed to String for Auth0
    checklist_id = db.Column(db.BigInteger, index=True)
    date_created = Column(DateTime, default=func.now())

    # Copied from template
    name = db.Column(db.String(255), nullable=True)
    author = db.Column(db.String(200), nullable=True)
    description = db.Column(db.Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    org_id = db.Column(db.String(255), nullable=True)

    # Rates
    total_payout = db.Column(db.Float, nullable=True, default=0)
    validation_rate = db.Column(db.Float, nullable=True, default=100)
    completion_rate = db.Column(db.Float, nullable=True, default=100)

    # Metadata
    difficulty = db.Column(db.String(50), nullable=True, default="Intermediate")
    visibility = db.Column(db.Boolean, nullable=True, server_default="False")
    active_status = db.Column(db.Boolean, nullable=True, server_default="False")
    completed = db.Column(db.Boolean, nullable=True, server_default="False")
    confirmed = db.Column(db.Boolean, nullable=True, server_default="False")

    # Timestamps
    last_completion_date = Column(DateTime, nullable=True)
    last_confirmation_date = Column(DateTime, nullable=True)
    final_completion_date = Column(DateTime, nullable=True)
    final_confirmation_date = Column(DateTime, nullable=True)


class UserChecklistItem(ModelWithSoftDeleteAndCRUD, SurrogatePK, db.Model):
    """User's instance of a checklist item."""

    __tablename__ = "user_checklist_item"

    id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    user_id = db.Column(db.String(255), index=True)  # Changed to String for Auth0
    checklist_id = db.Column(db.BigInteger, index=True)
    item_number = db.Column(db.Integer)
    item_action = db.Column(db.Text)
    item_link = db.Column(db.String(500))
    completed = db.Column(db.Boolean, default=False)
    confirmed = db.Column(db.Boolean, default=False)
    completion_date = Column(DateTime, nullable=True)
    confirmation_date = Column(DateTime, nullable=True)


class Training(ModelWithSoftDeleteAndCRUD, SurrogatePK, db.Model):
    """Training module model."""

    __tablename__ = "training"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=True)
    org_id = db.Column(db.String(255), nullable=True)
    training_type = db.Column(db.String(100), nullable=True)
    point_value = db.Column(db.Integer, nullable=True)
    training_url = db.Column(db.String(500), nullable=True)
    difficulty = db.Column(db.String(50), nullable=True)


class TrainingQuestion(ModelWithSoftDeleteAndCRUD, SurrogatePK, db.Model):
    """Question within a training module."""

    __tablename__ = "training_question"

    id = Column(Integer, primary_key=True, autoincrement=True)
    training_id = db.Column(
        db.BigInteger,
        db.ForeignKey("training.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    question = db.Column(db.Text, nullable=True)


class TrainingQuestionAnswer(ModelWithSoftDeleteAndCRUD, SurrogatePK, db.Model):
    """Answer option for a training question."""

    __tablename__ = "training_question_answer"

    id = Column(Integer, primary_key=True, autoincrement=True)
    training_id = db.Column(
        db.BigInteger,
        db.ForeignKey("training.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    training_question_id = db.Column(
        db.BigInteger,
        db.ForeignKey("training_question.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    value = db.Column(db.Boolean)
    answer = db.Column(db.Text, nullable=True)


class ProjectTraining(CRUDMixin, SurrogatePK, db.Model):
    """Association between projects and required training."""

    __tablename__ = "project_training"

    training_id = db.Column(
        db.Integer,
        db.ForeignKey("training.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    project_id = db.Column(
        db.BigInteger,
        db.ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )


class TrainingCompleted(CRUDMixin, SurrogatePK, db.Model):
    """Record of user completing a training."""

    __tablename__ = "training_completed"

    user_id = db.Column(
        db.String(255),  # Changed to String for Auth0
        nullable=True,
        index=True,
    )
    training_id = db.Column(
        db.BigInteger,
        db.ForeignKey("training.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )


class ProjectUser(CRUDMixin, SurrogatePK, db.Model):
    """Association between users and projects."""

    __tablename__ = "project_users"

    user_id = db.Column(
        db.String(255),  # Changed to String for Auth0
        nullable=True,
        index=True,
    )
    project_id = db.Column(
        db.BigInteger,
        db.ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )


class UserTasks(CRUDMixin, SurrogatePK, db.Model):
    """Association between users and tasks."""

    __tablename__ = "user_tasks"

    user_id = db.Column(
        db.String(255),  # Changed to String for Auth0
        nullable=False,
        index=True,
    )
    task_id = db.Column(
        db.BigInteger,
        db.ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    timestamp = db.Column(db.TIMESTAMP, nullable=False, default=func.now())


class PayRequests(CRUDMixin, SurrogatePK, db.Model):
    """Payment request from a user."""

    __tablename__ = "requests"

    id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    org_id = db.Column(db.String(255), nullable=True)
    amount_requested = db.Column(db.Float, nullable=True)
    user_id = db.Column(db.String(255), nullable=True, index=True)  # Changed to String
    user_name = db.Column(db.String(200), nullable=True)
    osm_username = db.Column(db.String(100), nullable=True)
    payment_email = db.Column(db.String(255), nullable=True)
    task_ids = Column(MutableList.as_mutable(ARRAY(Integer)))
    date_requested = Column(DateTime, default=func.now())
    notes = db.Column(db.Text, nullable=True)


class Payments(CRUDMixin, SurrogatePK, db.Model):
    """Completed payment record."""

    __tablename__ = "payments"

    id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    org_id = db.Column(db.String(255), nullable=True)
    payoneer_id = db.Column(db.String(100), nullable=True)
    amount_paid = db.Column(db.Float, nullable=True)
    user_name = db.Column(db.String(200), nullable=True)
    osm_username = db.Column(db.String(100), nullable=True)
    user_id = db.Column(db.String(255), nullable=True, index=True)  # Changed to String
    payment_email = db.Column(db.String(255), nullable=True)
    task_ids = Column(MutableList.as_mutable(ARRAY(Integer)))
    date_paid = Column(DateTime, default=func.now())
    notes = db.Column(db.Text, nullable=True)
