#!/usr/bin/env python3
from __future__ import annotations
from sqlalchemy import (
    BigInteger,
    Column,
    String,
    DateTime,
    func,
    Integer,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.ext.mutable import MutableList
from .common import ModelWithSoftDeleteAndCRUD, SurrogatePK, CRUDMixin, db


class User(ModelWithSoftDeleteAndCRUD, SurrogatePK):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True, autoincrement=False)
    email = Column(String, unique=True, nullable=True)
    payment_email = Column(String, unique=True, nullable=True)
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)
    osm_username = Column(String, unique=True, nullable=True)
    org_id = Column(BigInteger, nullable=True)
    first_name = Column(String)
    last_name = Column(String)
    create_time = Column(DateTime, default=func.now())
    role = Column(String, default="user")
    assigned_projects = Column(MutableList.as_mutable(ARRAY(Integer)))
    mapper_level = db.Column(db.Integer, default=0, nullable=True)
    mapper_points = db.Column(db.Integer, default=0, nullable=True)
    validator_points = db.Column(db.Integer, default=0, nullable=True)
    special_project_points = db.Column(db.Integer, default=0, nullable=True)
    validation_payable_total = db.Column(
        db.Float, nullable=True, default=0, server_default="0"
    )
    mapping_payable_total = db.Column(
        db.Float, nullable=True, default=0, server_default="0"
    )
    payable_total = db.Column(
        db.Float, nullable=True, default=0, server_default="0"
    )
    requested_total = db.Column(
        db.Float, nullable=True, default=0, server_default="0"
    )
    paid_total = db.Column(
        db.Float, nullable=True, default=0, server_default="0"
    )
    total_tasks_mapped = db.Column(
        db.BigInteger, nullable=True, default=0, server_default="0"
    )
    total_tasks_validated = db.Column(
        db.BigInteger, nullable=True, default=0, server_default="0"
    )
    total_tasks_invalidated = db.Column(
        db.Integer, nullable=False, default=0, server_default="0"
    )
    validator_tasks_invalidated = db.Column(
        db.Integer, nullable=True, default=0, server_default="0"
    )
    validator_tasks_validated = db.Column(
        db.Integer, nullable=True, default=0, server_default="0"
    )
    requesting_payment = db.Column(
        db.Boolean,
        nullable=False,
        server_default="False",
    )


class Project(ModelWithSoftDeleteAndCRUD, SurrogatePK):
    __tablename__ = "projects"
    id = db.Column(db.Integer, primary_key=True, autoincrement=False)
    name = db.Column(db.String, nullable=True)
    org_id = db.Column(db.Integer, nullable=True, default=0)
    max_payment = db.Column(db.Float, nullable=True, default=0)
    payment_due = db.Column(db.Float, nullable=True, default=0)
    total_payout = db.Column(db.Float, nullable=True, default=0)
    validation_rate_per_task = db.Column(db.Float, nullable=True, default=100)
    mapping_rate_per_task = db.Column(db.Float, nullable=True, default=100)
    max_editors = db.Column(db.Integer, nullable=True, default=5)
    max_validators = db.Column(db.Integer, nullable=True, default=5)
    total_editors = db.Column(db.BigInteger, default=0)
    total_validators = db.Column(db.BigInteger, default=0)
    total_tasks = db.Column(db.BigInteger, default=0)
    difficulty = db.Column(db.String, nullable=True, default="Intermediate")
    tasks_mapped = db.Column(db.BigInteger, default=0)
    tasks_validated = db.Column(db.BigInteger, default=0)
    tasks_invalidated = db.Column(db.BigInteger, default=0)
    url = db.Column(db.String, nullable=False)
    source = db.Column(db.String, nullable=True)
    visibility = db.Column(db.Boolean, nullable=True, server_default="False")
    status = db.Column(db.Boolean, nullable=True, server_default="False")
    completed = db.Column(db.Boolean, nullable=True, server_default="False")





class Checklist(ModelWithSoftDeleteAndCRUD, SurrogatePK, db.Model):
    __tablename__ = "checklists"
    id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    name = db.Column(db.String, nullable=True)
    author = db.Column(db.String, nullable=True)
    description = db.Column(db.String, nullable=True)
    due_date = Column(DateTime, nullable = True)
    org_id = db.Column(db.Integer, nullable=True, default=0)
    total_payout = db.Column(db.Float, nullable=True, default=0)
    validation_rate = db.Column(db.Float, nullable=True, default=100)
    completion_rate = db.Column(db.Float, nullable=True, default=100)
    difficulty = db.Column(db.String, nullable=True, default="Intermediate")
    visibility = db.Column(db.Boolean, nullable=True, server_default="False")
    active_status= db.Column(db.Boolean, nullable=True, server_default="False")
    completed = db.Column(db.Boolean, nullable=True, server_default="False")
    confirmed = db.Column(db.Boolean, nullable=True, server_default="False")

class ChecklistItem(ModelWithSoftDeleteAndCRUD, SurrogatePK,db.Model):
    __tablename__ = 'checklist_item'
    id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    checklist_id = db.Column(db.Integer)
    item_number = db.Column(db.Integer)
    item_action = db.Column(db.String)
    item_link= db.Column(db.String)


class ChecklistComment(ModelWithSoftDeleteAndCRUD, SurrogatePK,db.Model):
    __tablename__ = 'checklist_comment'
    id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    checklist_id = db.Column(db.Integer)
    comment = db.Column(db.String)
    author = db.Column(db.String)
    role= db.Column(db.String)
    date = Column(DateTime)

class UserChecklist(ModelWithSoftDeleteAndCRUD, SurrogatePK, db.Model):
    __tablename__ = "user_checklists"
    id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    user_id= db.Column(db.BigInteger)
    checklist_id=db.Column(db.BigInteger)
    name = db.Column(db.String, nullable=True)
    author = db.Column(db.String, nullable=True)
    description = db.Column(db.String, nullable=True)
    due_date = Column(DateTime, nullable = True)
    org_id = db.Column(db.Integer, nullable=True, default=0)
    total_payout = db.Column(db.Float, nullable=True, default=0)
    validation_rate = db.Column(db.Float, nullable=True, default=100)
    completion_rate = db.Column(db.Float, nullable=True, default=100)
    difficulty = db.Column(db.String, nullable=True, default="Intermediate")
    visibility = db.Column(db.Boolean, nullable=True, server_default="False")
    active_status= db.Column(db.Boolean, nullable=True, server_default="False")
    completed = db.Column(db.Boolean, nullable=True, server_default="False")
    confirmed = db.Column(db.Boolean, nullable=True, server_default="False")

class UserChecklistItem(ModelWithSoftDeleteAndCRUD, SurrogatePK,db.Model):
    __tablename__ = 'user_checklist_item'
    id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    user_id= db.Column(db.BigInteger)
    checklist_id=db.Column(db.BigInteger)
    item_number = db.Column(db.Integer)
    item_action = db.Column(db.String)
    item_link= db.Column(db.String)
    completed = db.Column(db.Boolean, default=False)
    confirmed = db.Column(db.Boolean, default=False)


class Training(ModelWithSoftDeleteAndCRUD, SurrogatePK, db.Model):
    __tablename__ = "training"
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String, nullable=True)
    org_id = db.Column(db.Integer, nullable=True, default=0)
    training_type = db.Column(db.String, nullable=True)
    point_value = db.Column(db.Integer, nullable=True)
    training_url = db.Column(db.String, nullable=True)
    difficulty = db.Column(db.String, nullable=True)
    question_1 = db.Column(db.String, nullable=True)
    answer_1 = db.Column(db.String, nullable=True)
    incorrect1_1 = db.Column(db.String, nullable=True)
    incorrect1_2 = db.Column(db.String, nullable=True)
    incorrect1_3 = db.Column(db.String, nullable=True)
    question_2 = db.Column(db.String, nullable=True)
    answer_2 = db.Column(db.String, nullable=True)
    incorrect2_1 = db.Column(db.String, nullable=True)
    incorrect2_2 = db.Column(db.String, nullable=True)
    incorrect2_3 = db.Column(db.String, nullable=True)
    question_3 = db.Column(db.String, nullable=True)
    answer_3 = db.Column(db.String, nullable=True)
    incorrect3_1 = db.Column(db.String, nullable=True)
    incorrect3_2 = db.Column(db.String, nullable=True)
    incorrect3_3 = db.Column(db.String, nullable=True)
    question_4 = db.Column(db.String, nullable=True)
    answer_4 = db.Column(db.String, nullable=True)
    incorrect4_1 = db.Column(db.String, nullable=True)
    incorrect4_2 = db.Column(db.String, nullable=True)
    incorrect4_3 = db.Column(db.String, nullable=True)
    incorrect4_3 = db.Column(db.String, nullable=True)


class TrainingCompleted(CRUDMixin, SurrogatePK, db.Model):
    __tablename__ = "training_completed"
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
    )
    training_id = db.Column(
        db.BigInteger,
        db.ForeignKey("training.id", ondelete="CASCADE"),
        nullable=True,
    )


class ProjectUser(CRUDMixin, SurrogatePK, db.Model):
    __tablename__ = "project_users"
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
    )
    project_id = db.Column(
        db.BigInteger,
        db.ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=True,
    )


class UserTasks(CRUDMixin, SurrogatePK, db.Model):
    __tablename__ = "user_tasks"
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    task_id = db.Column(
        db.BigInteger,
        db.ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
    )


class Task(ModelWithSoftDeleteAndCRUD, SurrogatePK):
    __tablename__ = "tasks"
    id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    org_id = db.Column(db.Integer, nullable=True, default=0)
    project_id = db.Column(
        db.BigInteger,
        nullable=False,
    )
    validation_rate = db.Column(db.Float, nullable=True, default=100)
    mapping_rate = db.Column(db.Float, nullable=True, default=100)
    paid_out = db.Column(db.Boolean, nullable=False, default=False)
    mapped = db.Column(db.Boolean, nullable=True, default=False)
    validated = db.Column(db.Boolean, nullable=True, default=False)
    invalidated = db.Column(db.Boolean, nullable=True, default=False)
    mapped_by = db.Column(db.String(80), nullable=False)
    validated_by = db.Column(db.String(80), nullable=False)


class PayRequests(CRUDMixin, SurrogatePK, db.Model):
    __tablename__ = "requests"
    id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    org_id = db.Column(db.Integer, nullable=True, default=0)
    amount_requested = db.Column(db.Float, nullable=True)
    user_id = db.Column(db.Integer, nullable=True)
    user_name = db.Column(db.String(65), nullable=True)
    osm_username = db.Column(db.String(65), nullable=True)
    payment_email = db.Column(db.String(65), nullable=True)
    task_ids = Column(MutableList.as_mutable(ARRAY(Integer)))
    date_requested = Column(DateTime, default=func.now())
    notes = db.Column(db.String(100), nullable=True)


class Payments(CRUDMixin, SurrogatePK, db.Model):
    __tablename__ = "payments"
    id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    org_id = db.Column(db.Integer, nullable=True, default=0)
    payoneer_id = db.Column(db.String(65), nullable=True)
    amount_paid = db.Column(db.Float, nullable=True)
    user_name = db.Column(db.String(65), nullable=True)
    osm_username = db.Column(db.String(65), nullable=True)
    user_id = db.Column(db.Integer, nullable=True)
    payment_email = db.Column(db.String(65), nullable=True)
    task_ids = Column(MutableList.as_mutable(ARRAY(Integer)))
    date_paid = Column(DateTime, default=func.now())
    notes = db.Column(db.String(100), nullable=True)
