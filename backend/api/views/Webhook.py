#!/usr/bin/env python3
"""
Webhook receiver for TM4 task events.

Handles real-time task status updates pushed from TM4 via webhooks,
instead of relying on periodic polling/sync.
"""

import hmac
import hashlib
import logging

from sqlalchemy import func
from flask.views import MethodView
from flask import request, current_app

from ..database import (
    Project,
    Task,
    UserTasks,
    User,
    ValidatorTaskAction,
    db,
)
from .split_task_helpers import (
    is_split_task,
    get_split_siblings,
    should_count_validation,
    should_count_invalidation,
)

logger = logging.getLogger(__name__)


class WebhookAPI(MethodView):
    """Webhook receiver for external task event notifications."""

    def post(self, path):
        """Route POST requests to appropriate handler."""
        if path == "tm4-task-event":
            return self.handle_tm4_event()
        return {"error": "Unknown webhook path"}, 404

    # ------------------------------------------------------------------ #
    #  TM4 event handler
    # ------------------------------------------------------------------ #

    def handle_tm4_event(self):
        """
        Receive and process TM4 task-status webhook events.

        Expects payload: {"events": [<event>, ...]}
        Each event has at minimum: project_id, task_id, username, new_status.
        """

        # --- HMAC verification -------------------------------------------
        raw_body = request.get_data()
        signature_header = request.headers.get("X-Webhook-Signature", "")

        secret = current_app.config.get("MIKRO_WEBHOOK_SECRET")
        if not secret:
            logger.error("MIKRO_WEBHOOK_SECRET not configured")
            return {"error": "Webhook secret not configured"}, 500

        if not signature_header.startswith("sha256="):
            return {"error": "Invalid signature format"}, 401

        expected_sig = hmac.new(
            secret.encode("utf-8"), raw_body, hashlib.sha256
        ).hexdigest()
        provided_sig = signature_header[len("sha256="):]

        if not hmac.compare_digest(expected_sig, provided_sig):
            return {"error": "Invalid signature"}, 401

        # --- Parse payload -----------------------------------------------
        payload = request.get_json()
        if not payload or "events" not in payload:
            return {"error": "Missing events in payload"}, 400

        events = payload["events"]
        processed = 0

        for event in events:
            try:
                project = Project.query.filter_by(
                    id=event["project_id"]
                ).first()
                if not project:
                    logger.info(
                        "Webhook: project %s not tracked, skipping",
                        event.get("project_id"),
                    )
                    continue

                status = event.get("new_status", "").upper()

                if status == "MAPPED" or status == "BADIMAGERY":
                    self._process_mapped_event(project, event)
                elif status == "VALIDATED":
                    self._process_validated_event(project, event)
                elif status == "INVALIDATED":
                    self._process_invalidated_event(project, event)
                elif status == "SPLIT":
                    self._process_split_event(project, event)
                elif status == "READY":
                    pass  # No action needed
                else:
                    logger.warning(
                        "Webhook: unknown status '%s' for task %s in project %s",
                        status,
                        event.get("task_id"),
                        event.get("project_id"),
                    )

                processed += 1

            except Exception:
                logger.exception(
                    "Webhook: error processing event for task %s in project %s",
                    event.get("task_id"),
                    event.get("project_id"),
                )

        db.session.commit()
        return {"status": "ok", "processed": processed}, 200

    # ------------------------------------------------------------------ #
    #  Event processors
    # ------------------------------------------------------------------ #

    def _process_mapped_event(self, project, event):
        """Handle a MAPPED (or BADIMAGERY) task event."""

        task_id = event["task_id"]
        username = event.get("username", "")

        # Idempotent: skip if task already recorded
        existing = Task.query.filter_by(
            task_id=task_id, project_id=project.id
        ).first()
        if existing:
            return

        mapper = User.query.filter_by(osm_username=username).first()

        # Create the task record
        task = Task(
            task_id=task_id,
            project_id=project.id,
            org_id=project.org_id,
            mapping_rate=project.mapping_rate_per_task,
            validation_rate=project.validation_rate_per_task,
            mapped=True,
            mapped_by=username,
            date_mapped=func.now(),
        )

        # Split task tracking
        parent_task_id = event.get("parent_task_id")
        if parent_task_id is not None:
            task.parent_task_id = parent_task_id
            task.sibling_count = 4

        db.session.add(task)
        db.session.flush()  # Get task.id for UserTasks FK

        if mapper:
            existing_link = UserTasks.query.filter_by(
                user_id=mapper.id, task_id=task.id
            ).first()
            if not existing_link:
                db.session.add(UserTasks(user_id=mapper.id, task_id=task.id))
            mapper.total_tasks_mapped = (mapper.total_tasks_mapped or 0) + 1

        project.tasks_mapped = (project.tasks_mapped or 0) + 1

    def _process_validated_event(self, project, event):
        """Handle a VALIDATED task event."""

        task_id = event["task_id"]
        username = event.get("username", "")

        task = Task.query.filter_by(
            task_id=task_id, project_id=project.id
        ).first()

        # If the task doesn't exist yet, create it (mapper may be external)
        if not task:
            task = Task(
                task_id=task_id,
                project_id=project.id,
                org_id=project.org_id,
                mapping_rate=project.mapping_rate_per_task,
                validation_rate=project.validation_rate_per_task,
                mapped=True,
                mapped_by=event.get("mapped_by_username", "unknown"),
                date_mapped=func.now(),
            )
            parent_task_id = event.get("parent_task_id")
            if parent_task_id is not None:
                task.parent_task_id = parent_task_id
                task.sibling_count = 4
            db.session.add(task)
            db.session.flush()

        # Idempotent: skip if already validated
        if task.validated:
            return

        validator = User.query.filter_by(osm_username=username).first()

        # Check for self-validation
        is_self_validated = task.mapped_by == username

        # Handle previously invalidated tasks — reverse invalidation counters
        if task.invalidated:
            if self._should_count_invalidation(task):
                mapper = User.query.filter_by(
                    osm_username=task.mapped_by
                ).first()
                if mapper:
                    mapper.total_tasks_invalidated = max(
                        0, (mapper.total_tasks_invalidated or 0) - 1
                    )
                project.tasks_invalidated = max(
                    0, (project.tasks_invalidated or 0) - 1
                )

        # Update task status
        task.validated = True
        task.invalidated = False
        task.validated_by = username
        task.date_validated = func.now()
        task.self_validated = is_self_validated

        # Create UserTasks link for validator (avoid duplicates)
        if validator:
            existing_link = UserTasks.query.filter_by(
                user_id=validator.id, task_id=task.id
            ).first()
            if not existing_link:
                db.session.add(UserTasks(user_id=validator.id, task_id=task.id))

        # For self-validated tasks, skip payment updates but still count project stats
        if is_self_validated:
            if self._should_count_validation(task):
                project.tasks_validated = (project.tasks_validated or 0) + 1
            return

        # Only update stats/payments when counting is appropriate (split-aware)
        if self._should_count_validation(task):
            # Update mapper stats
            mapper = User.query.filter_by(
                osm_username=task.mapped_by
            ).first()
            if mapper:
                mapper.total_tasks_validated = (
                    mapper.total_tasks_validated or 0
                ) + 1
                if project.payments_enabled:
                    if self._is_split_task(task):
                        siblings = self._get_split_siblings(task)
                        mapping_sum = sum(
                            s.mapping_rate or 0 for s in siblings
                        )
                        mapper.mapping_payable_total = (
                            mapper.mapping_payable_total or 0
                        ) + mapping_sum
                    else:
                        mapper.mapping_payable_total = (
                            mapper.mapping_payable_total or 0
                        ) + (task.mapping_rate or 0)

            # Update validator stats
            if validator:
                validator.validator_tasks_validated = (
                    validator.validator_tasks_validated or 0
                ) + 1
                if project.payments_enabled:
                    if self._is_split_task(task):
                        siblings = self._get_split_siblings(task)
                        validation_sum = sum(
                            s.validation_rate or 0 for s in siblings
                        )
                        validator.validation_payable_total = (
                            validator.validation_payable_total or 0
                        ) + validation_sum
                    else:
                        validator.validation_payable_total = (
                            validator.validation_payable_total or 0
                        ) + (task.validation_rate or 0)

            # Update project stats
            project.tasks_validated = (project.tasks_validated or 0) + 1

    def _process_invalidated_event(self, project, event):
        """Handle an INVALIDATED task event."""

        task_id = event["task_id"]
        username = event.get("username", "")

        task = Task.query.filter_by(
            task_id=task_id, project_id=project.id
        ).first()

        # Skip if task not found or already invalidated (idempotent)
        if not task or task.invalidated:
            return

        # Update task status
        task.invalidated = True
        task.validated = False
        task.date_validated = func.now()

        # Record the validator action
        validator = User.query.filter_by(osm_username=username).first()
        if validator:
            action = ValidatorTaskAction(
                validator_id=validator.id,
                task_id=task.id,
                project_id=project.id,
                action_type="invalidate",
                action_date=func.now(),
            )
            db.session.add(action)

        # Only update stats when counting is appropriate (split-aware)
        if self._should_count_invalidation(task):
            # Update mapper stats
            mapper = User.query.filter_by(
                osm_username=task.mapped_by
            ).first()
            if mapper:
                mapper.total_tasks_invalidated = (
                    mapper.total_tasks_invalidated or 0
                ) + 1

            # Update validator stats
            if validator:
                validator.validator_tasks_invalidated = (
                    validator.validator_tasks_invalidated or 0
                ) + 1

            # Update project stats
            project.tasks_invalidated = (project.tasks_invalidated or 0) + 1

    def _process_split_event(self, project, event):
        """Handle a SPLIT task event — record parent linkage."""

        task_id = event["task_id"]

        task = Task.query.filter_by(
            task_id=task_id, project_id=project.id
        ).first()

        if task:
            task.parent_task_id = event.get("parent_task_id")
            task.sibling_count = 4

    # ------------------------------------------------------------------ #
    #  Split-task helpers — delegated to shared module (SSOT)
    # ------------------------------------------------------------------ #

    def _is_split_task(self, task):
        return is_split_task(task)

    def _get_split_siblings(self, task):
        return get_split_siblings(task)

    def _should_count_validation(self, task):
        return should_count_validation(task)

    def _should_count_invalidation(self, task):
        return should_count_invalidation(task)
