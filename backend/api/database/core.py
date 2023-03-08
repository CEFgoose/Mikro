#!/usr/bin/env python3
from __future__ import annotations
from sqlalchemy import (
    BigInteger,
    Column,
    ForeignKey,
    String,
    DateTime,
    func,
    Integer

)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.ext.mutable import MutableList
from .common import ModelWithSoftDeleteAndCRUD, SurrogatePK, CRUDMixin, db



class User(ModelWithSoftDeleteAndCRUD, SurrogatePK):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True, autoincrement=False)
    email = Column(String, unique=True,  nullable=True)
    payment_email = Column(String, unique=True,  nullable=True)
    city = Column(String,  nullable=True)
    country = Column(String,  nullable=True)
    osm_username = Column(String, unique=True,  nullable=True)
    org_id = Column(BigInteger,  nullable=True)
    first_name = Column(String)
    last_name = Column(String)
    create_time = Column(DateTime, default=func.now())
    role = Column(String, default="user")
    assigned_projects = Column(MutableList.as_mutable(ARRAY(Integer)))

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
    requesting_payment = db.Column(
        db.Boolean,
        nullable=False,
        server_default="False",
    )



class Project(ModelWithSoftDeleteAndCRUD, SurrogatePK):
    __tablename__ = "projects"
    id = db.Column(db.Integer, primary_key=True, autoincrement=False)
    name= db.Column(db.String, nullable=True)
    org_id = db.Column(db.Integer, nullable=True, default=0)
    max_payment = db.Column(db.Float, nullable=True, default=0)
    payment_due = db.Column(db.Float, nullable=True, default=0)
    total_payout = db.Column(db.Float, nullable=True, default=0)
    rate_per_task = db.Column(db.Float, nullable=True, default=100)
    max_editors = db.Column(db.Integer, nullable=False, default=5)
    total_editors = db.Column(db.BigInteger, default=0)
    total_tasks = db.Column(db.BigInteger, default=0)
    difficulty = db.Column(db.String, nullable=True,default="Intermediate")
    tasks_mapped = db.Column(db.BigInteger, default=0)
    tasks_validated = db.Column(db.BigInteger, default=0)
    tasks_invalidated = db.Column(db.BigInteger, default=0)
    url = db.Column(db.String, nullable=False)
    source = db.Column(db.String, nullable=True)
    visibility = db.Column(db.Boolean,nullable=True,server_default="False")
    status = db.Column(db.Boolean,nullable=True,server_default="False")
    completed = db.Column(db.Boolean,nullable=True,server_default="False")



class ProjectUser(CRUDMixin, SurrogatePK, db.Model):
    __tablename__ = "project_users"
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id = db.Column(
        db.BigInteger,
        db.ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
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
    project_id = db.Column(db.BigInteger,nullable=False,)
    rate = db.Column(db.Float, nullable=True)
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
    payment_email = db.Column(db.String(65), nullable=True)
    task_ids = Column(MutableList.as_mutable(ARRAY(Integer)))
    date_requested= Column(DateTime, default=func.now())
    notes = db.Column(db.String(100), nullable=True)


class Payments(CRUDMixin, SurrogatePK, db.Model):
    __tablename__ = "payments"
    id = db.Column(db.BigInteger, primary_key=True, nullable=False)
    org_id = db.Column(db.Integer, nullable=True, default=0)
    payoneer_id = db.Column(db.String(65),nullable=True)
    amount_paid = db.Column(db.Float, nullable=True)
    user_name = db.Column(db.String(65), nullable=True)
    user_id = db.Column(db.Integer, nullable=True)
    payment_email = db.Column(db.String(65), nullable=True)
    task_ids = Column(MutableList.as_mutable(ARRAY(Integer)))
    date_paid = Column(DateTime, default=func.now())
    notes = db.Column(db.String(100), nullable=True)