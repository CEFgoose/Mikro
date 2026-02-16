#!/usr/bin/env python3
"""
Task API endpoints for Mikro.

Handles task synchronization with TM4 (Tasking Manager 4).
TM3 support has been removed.
"""

import requests

from sqlalchemy import func
from flask.views import MethodView
from flask import g, request, current_app

from ..utils import requires_admin
from ..database import (
    Project,
    Task,
    ProjectUser,
    UserTasks,
    User,
    ValidatorTaskAction,
    db,
)


class TaskAPI(MethodView):
    """Task management API endpoints for TM4 integration."""

    def _is_split_task(self, task):
        """Check if a task is a split task segment."""
        return task.parent_task_id is not None

    def _get_split_siblings(self, task):
        """
        Get all sibling tasks for a split task.

        Returns list of sibling tasks (including the task itself),
        or empty list if not a split task.
        """
        if not self._is_split_task(task):
            return []
        return Task.query.filter_by(
            project_id=task.project_id,
            parent_task_id=task.parent_task_id
        ).all()

    def _all_siblings_validated(self, task):
        """
        Check if ALL siblings of a split task are validated.

        For non-split tasks, always returns True.
        For split tasks, returns True only when ALL siblings are validated.
        """
        if not self._is_split_task(task):
            return True

        siblings = self._get_split_siblings(task)
        expected_count = task.sibling_count or 4  # Default to 4 for TM4

        # Need all siblings present and all validated
        if len(siblings) != expected_count:
            return False

        return all(s.validated for s in siblings)

    def _all_siblings_invalidated(self, task):
        """
        Check if ALL siblings of a split task are invalidated.

        For non-split tasks, always returns True.
        For split tasks, returns True only when ALL siblings are invalidated.
        """
        if not self._is_split_task(task):
            return True

        siblings = self._get_split_siblings(task)
        expected_count = task.sibling_count or 4  # Default to 4 for TM4

        # Need all siblings present and all invalidated
        if len(siblings) != expected_count:
            return False

        return all(s.invalidated for s in siblings)

    def _should_count_validation(self, task):
        """
        Determine if this validation should be counted toward stats.

        For normal tasks: always count
        For split tasks: only count when this is the LAST sibling to be validated
        (i.e., when all siblings including this one are now validated)
        """
        if not self._is_split_task(task):
            return True

        # For split tasks, only count when ALL siblings are validated
        # Since we just validated this task, we check if all siblings are now validated
        return self._all_siblings_validated(task)

    def _should_count_invalidation(self, task):
        """
        Determine if this invalidation should be counted toward stats.

        For normal tasks: always count
        For split tasks: only count when this is the LAST sibling to be invalidated
        """
        if not self._is_split_task(task):
            return True

        return self._all_siblings_invalidated(task)

    def post(self, path: str):
        """Route POST requests to appropriate handler."""
        if path == "update_user_tasks":
            return self.update_user_tasks()
        elif path == "admin_update_all_user_tasks":
            return self.admin_update_all_user_tasks()
        elif path == "fetch_external_validations":
            return self.admin_fetch_external_validations()
        elif path == "update_task":
            return self.update_task()
        elif path == "purge_all_task_stats":
            return self.purge_all_task_stats()
        return {
            "message": "Invalid path",
            "status": 405,
        }, 405

    def _get_tm4_headers(self):
        """Get headers for TM4 API requests."""
        token = current_app.config.get("TM4_API_TOKEN")
        if not token:
            current_app.logger.warning("TM4_API_TOKEN not configured")
        return {
            "Authorization": f"Bearer {token}" if token else "",
            "Accept-Language": "en-US",
        }

    def _get_tm4_base_url(self):
        """Get TM4 API base URL from config."""
        return current_app.config.get("TM4_API_URL", "https://tasks.kaart.com/api/v2")

    def get_validated_TM4_tasks(self, data, project_id):
        """
        Process validated tasks from TM4 contributions data.

        Updates task status and user payment totals for validated tasks.
        """
        users = User.query.all()
        usernames = [x.osm_username for x in users]
        contributions = data.get("userContributions", [])
        target_project = Project.query.filter_by(id=project_id).first()

        if not target_project:
            current_app.logger.error(f"Project {project_id} not found")
            return {"response": "project not found"}

        # Build reverse lookup: task_id -> mapper username from contributions
        task_to_mapper = {}
        for contrib in contributions:
            for t in contrib.get("mappedTasks", []):
                task_to_mapper[t] = contrib["username"]

        for c in contributions:
            validator_exists = User.query.filter_by(
                osm_username=c["username"]
            ).first()

            if validator_exists is not None:
                validated_tasks = c.get("validatedTasks", [])
                current_app.logger.info(
                    f"Processing {len(validated_tasks)} validations by "
                    f"Mikro user {c['username']} on project {project_id}"
                )
                tasks_created = 0
                tasks_validated = 0
                tasks_skipped = 0

                for task in validated_tasks:
                  try:
                    task_exists = Task.query.filter_by(
                        task_id=task, project_id=project_id
                    ).first()

                    # Task doesn't exist yet — create it ONLY because a Mikro
                    # validator validated it. Mapper stats are NOT updated.
                    if task_exists is None:
                        original_mapper = task_to_mapper.get(task, "unknown")
                        task_exists = Task.create(
                            task_id=task,
                            org_id=g.user.org_id if hasattr(g, "user") and g.user else None,
                            project_id=project_id,
                            mapping_rate=target_project.mapping_rate_per_task,
                            validation_rate=target_project.validation_rate_per_task,
                            paid_out=False,
                            mapped=True,
                            mapped_by=original_mapper,
                            validated_by="",
                            validated=False,
                            date_mapped=func.now(),
                        )
                        tasks_created += 1

                    if not task_exists.validated:
                        # Look up mapper — may be None if mapper is not in Mikro
                        mapper = User.query.filter_by(
                            osm_username=task_exists.mapped_by
                        ).first()

                        # Handle previously invalidated tasks
                        if task_exists.invalidated is True:
                            if mapper:
                                mapper.update(
                                    total_tasks_validated=mapper.total_tasks_validated - 1,
                                )
                            validator_exists.update(
                                validator_tasks_invalidated=validator_exists.validator_tasks_invalidated - 1
                            )
                            target_project.update(
                                tasks_invalidated=target_project.tasks_invalidated - 1
                            )

                        # Detect self-validation (mapper validated their own work)
                        is_self_validated = task_exists.mapped_by == c["username"]

                        # Update task status
                        task_exists.update(
                            validated_by=c["username"],
                            unknown_validator=False,
                            validated=True,
                            invalidated=False,
                            self_validated=is_self_validated,
                            date_validated=func.now(),
                        )

                        # Create UserTasks entry for validator (for validator dashboard)
                        validator_task_link = UserTasks.query.filter_by(
                            user_id=validator_exists.id, task_id=task_exists.id
                        ).first()
                        if not validator_task_link:
                            UserTasks.create(user_id=validator_exists.id, task_id=task_exists.id)

                        # Skip payment updates for self-validated tasks
                        if is_self_validated:
                            current_app.logger.warning(
                                f"Self-validation detected: {c['username']} validated their own task {task}"
                            )
                            # For split tasks, only count when all siblings are validated
                            if self._should_count_validation(task_exists):
                                target_project.update(
                                    tasks_validated=target_project.tasks_validated + 1
                                )
                            continue

                        # For split tasks, only update stats/payments when ALL siblings are validated
                        # This prevents counting each segment separately
                        if not self._should_count_validation(task_exists):
                            current_app.logger.info(
                                f"Split task {task} validated but not all siblings complete yet - deferring stats update"
                            )
                            continue

                        # Update mapper payment totals only if mapper is a Mikro user
                        if mapper:
                            old_validated_total = int(mapper.total_tasks_validated)
                            new_tasks_validated = old_validated_total + 1

                            # For split tasks, calculate total mapping rate for all siblings
                            if self._is_split_task(task_exists):
                                siblings = self._get_split_siblings(task_exists)
                                new_awaiting_payment = sum(s.mapping_rate or 0 for s in siblings)
                            else:
                                new_awaiting_payment = task_exists.mapping_rate or 0

                            old_awaiting_payment = mapper.mapping_payable_total or 0
                            current_awaiting_payment = old_awaiting_payment + new_awaiting_payment

                            mapper.update(
                                mapping_payable_total=current_awaiting_payment,
                                total_tasks_validated=new_tasks_validated,
                            )

                        # Update validator payment totals (always — regardless of mapper)
                        old_validations_payment = float(
                            validator_exists.validation_payable_total or 0
                        )

                        # For split tasks, calculate total validation rate for all siblings
                        if self._is_split_task(task_exists):
                            siblings = self._get_split_siblings(task_exists)
                            new_validations_payment = sum(s.validation_rate or 0 for s in siblings)
                        else:
                            new_validations_payment = task_exists.validation_rate or 0

                        current_validations_payment = (
                            old_validations_payment + new_validations_payment
                        )

                        validator_exists.update(
                            validator_tasks_validated=validator_exists.validator_tasks_validated + 1,
                            validation_payable_total=current_validations_payment,
                        )

                        target_project.update(
                            tasks_validated=target_project.tasks_validated + 1
                        )
                        tasks_validated += 1
                    else:
                        tasks_skipped += 1
                  except Exception as e:
                    current_app.logger.error(
                        f"Error processing validation of task {task} by "
                        f"{c['username']} on project {project_id}: {e}"
                    )
                    db.session.rollback()

                current_app.logger.info(
                    f"Validator {c['username']} on project {project_id}: "
                    f"created={tasks_created}, validated={tasks_validated}, "
                    f"skipped={tasks_skipped}"
                )
            else:
                # Handle external validators (not in our system)
                for task in c.get("validatedTasks", []):
                    task_exists = Task.query.filter_by(
                        task_id=task, project_id=project_id
                    ).first()

                    if task_exists is not None:
                        if (
                            not task_exists.validated
                            and not task_exists.validated_by
                        ):
                            task_exists.update(
                                validated_by=c["username"],
                                validated=False,
                                unknown_validator=True,
                            )

        return {"response": "complete"}

    def get_invalidated_TM4_tasks(self, project_id, user):
        """
        Check for invalidated tasks for a user's mapped tasks.

        Queries TM4 API for individual task status.
        """
        user_tasks = UserTasks.query.filter_by(user_id=user.id).all()
        # UserTasks.task_id is a FK to Task.id (internal DB ID)
        internal_task_ids = [relation.task_id for relation in user_tasks]
        headers = self._get_tm4_headers()
        base_url = self._get_tm4_base_url()
        target_project = Project.query.filter_by(id=project_id).first()

        current_app.logger.info(
            f"get_invalidated_TM4_tasks: user={user.id}, project={project_id}, "
            f"user_tasks_count={len(user_tasks)}, internal_task_ids={internal_task_ids}"
        )

        if not target_project:
            return {"response": "project not found"}

        tasks_checked = 0
        tasks_in_project = 0
        for internal_task_id in internal_task_ids:
            target_user = User.query.filter_by(id=user.id).first()
            # Query by internal Task.id, not Task.task_id (TM4 ID)
            target_task = Task.query.filter_by(id=internal_task_id).first()

            if not target_task:
                current_app.logger.warning(f"Task with internal id {internal_task_id} not found in DB")
                continue

            if target_task.project_id != project_id:
                continue  # Skip tasks from other projects

            tasks_in_project += 1
            current_app.logger.info(
                f"Checking task: internal_id={internal_task_id}, tm4_id={target_task.task_id}, "
                f"project={target_task.project_id}, validated={target_task.validated}, "
                f"invalidated={target_task.invalidated}"
            )

            if not target_task.invalidated:
                tasks_checked += 1
                # Use Task.task_id (TM4 ID) for API call
                tm4_task_id = target_task.task_id
                invalid_tasks_url = f"{base_url}/projects/{project_id}/tasks/{tm4_task_id}/"

                try:
                    tasks_invalidated_call = requests.get(
                        invalid_tasks_url, headers=headers, timeout=30
                    )

                    if tasks_invalidated_call.ok:
                        task_data = tasks_invalidated_call.json()
                        task_status = task_data.get("taskStatus")
                        task_history = task_data.get("taskHistory", [])

                        # Track parent_task_id for split tasks
                        parent_task_id = task_data.get("parentTaskId")
                        if parent_task_id and target_task.parent_task_id != parent_task_id:
                            # TM4 always splits into exactly 4 children
                            target_task.update(parent_task_id=parent_task_id, sibling_count=4)

                        # Find invalidation actions in history for validator info
                        invalidation_actions = [
                            h for h in task_history
                            if h.get("action") == "STATE_CHANGE" and h.get("actionText") == "INVALIDATED"
                        ]

                        # Log task status for debugging
                        current_app.logger.info(
                            f"TM4 task {tm4_task_id}: status={task_status}, "
                            f"history_count={len(task_history)}, "
                            f"invalidation_actions={len(invalidation_actions)}"
                        )

                        # Only mark as invalidated if CURRENT status is INVALIDATED
                        # Do NOT use historical invalidations — a task that was
                        # invalidated then re-mapped and re-validated is currently valid
                        if task_status == "INVALIDATED":
                            # Get validator info from the invalidation action
                            validator_username = None
                            if invalidation_actions:
                                # Use the most recent invalidation action
                                validator_username = invalidation_actions[0].get("actionBy")
                            elif task_history:
                                # Fallback to first history entry
                                validator_username = task_history[0].get("actionBy")

                            if validator_username:
                                target_task.update(validated_by=validator_username)

                            # Update task status (always mark as invalidated)
                            target_task.update(
                                invalidated=True,
                                validated=False,
                                date_validated=func.now(),
                            )

                            # For split tasks, only update stats when ALL siblings are invalidated
                            if not self._should_count_invalidation(target_task):
                                current_app.logger.info(
                                    f"Split task {tm4_task_id} invalidated but not all siblings invalidated yet - deferring stats update"
                                )
                                continue

                            # Update validator stats (only when all split siblings are invalidated)
                            if validator_username:
                                validator_exists = User.query.filter_by(
                                    osm_username=validator_username
                                ).first()

                                if validator_exists:
                                    # For split tasks, calculate total validation rate for all siblings
                                    if self._is_split_task(target_task):
                                        siblings = self._get_split_siblings(target_task)
                                        validation_payment = sum(s.validation_rate or 0 for s in siblings)
                                    else:
                                        validation_payment = target_task.validation_rate or 0

                                    validator_exists.update(
                                        validator_tasks_invalidated=validator_exists.validator_tasks_invalidated + 1,
                                        validation_payable_total=validator_exists.validation_payable_total
                                        + validation_payment,
                                    )

                            # Update user and project stats
                            invalidated_count = target_user.total_tasks_invalidated + 1
                            target_user.update(total_tasks_invalidated=invalidated_count)
                            target_project.update(
                                tasks_invalidated=target_project.tasks_invalidated + 1
                            )
                            current_app.logger.info(
                                f"Marked task {tm4_task_id} as INVALIDATED. "
                                f"User {target_user.id} total_tasks_invalidated now: {invalidated_count}"
                            )
                    else:
                        current_app.logger.warning(
                            f"TM4 task status call failed for task {tm4_task_id}: {tasks_invalidated_call.status_code}"
                        )
                except requests.RequestException as e:
                    current_app.logger.error(f"TM4 API error for task {tm4_task_id}: {e}")

        current_app.logger.info(
            f"get_invalidated_TM4_tasks complete: project={project_id}, "
            f"tasks_in_project={tasks_in_project}, tasks_checked={tasks_checked}"
        )
        return {"response": "complete"}

    def get_mapped_TM4_tasks(self, data, project_id):
        """
        Process mapped tasks from TM4 contributions data.

        Creates new task records for tasks not yet in the system.
        """
        users = User.query.all()
        usernames = [x.osm_username for x in users]
        target_project = Project.query.filter_by(id=project_id).first()

        if not target_project:
            current_app.logger.error(f"Project {project_id} not found")
            return {"message": "project not found"}

        contributions = data.get("userContributions", [])
        current_app.logger.info(
            f"get_mapped_TM4_tasks: project={project_id}, "
            f"contributors={len(contributions)}, mikro_users={len(usernames)}"
        )

        tasks_created = 0
        tasks_skipped = 0

        for contributor in contributions:
            contrib_username = contributor.get("username", "")
            mapped_tasks = contributor.get("mappedTasks", [])

            if contrib_username in usernames:
                mapper = User.query.filter_by(
                    osm_username=contrib_username
                ).first()

                if not mapper:
                    current_app.logger.warning(
                        f"User {contrib_username} in usernames but not found in DB"
                    )
                    continue

                current_app.logger.info(
                    f"Processing {len(mapped_tasks)} mapped tasks for user {contrib_username} (id={mapper.id})"
                )

                for task in mapped_tasks:
                    task_exists = Task.query.filter_by(
                        task_id=task,
                        project_id=project_id,
                        mapped_by=mapper.osm_username,
                    ).first()

                    if task_exists is None:
                        new_task = Task.create(
                            task_id=task,
                            org_id=g.user.org_id if g.user else None,
                            project_id=project_id,
                            mapping_rate=target_project.mapping_rate_per_task,
                            validation_rate=target_project.validation_rate_per_task,
                            paid_out=False,
                            mapped=True,
                            mapped_by=contrib_username,
                            validated_by="",
                            validated=False,
                            date_mapped=func.now(),
                        )
                        UserTasks.create(user_id=mapper.id, task_id=new_task.id)
                        mapper.update(total_tasks_mapped=mapper.total_tasks_mapped + 1)
                        target_project.update(
                            tasks_mapped=target_project.tasks_mapped + 1
                        )
                        tasks_created += 1
                        current_app.logger.info(
                            f"Created task {task} for mapper {contrib_username}, "
                            f"internal_id={new_task.id}"
                        )
                        target_task = new_task
                    else:
                        tasks_skipped += 1
                        # Ensure UserTasks link exists (may have been missing)
                        user_task_link = UserTasks.query.filter_by(
                            user_id=mapper.id, task_id=task_exists.id
                        ).first()
                        if not user_task_link:
                            UserTasks.create(user_id=mapper.id, task_id=task_exists.id)
                            current_app.logger.info(
                                f"Created missing UserTasks link for existing task {task}"
                            )
                        target_task = task_exists

                    # Fetch individual task details from TM4 to get parent_task_id (for split tasks)
                    if target_task and not target_task.parent_task_id:
                        try:
                            tm4_base_url = self._get_tm4_base_url()
                            headers = self._get_tm4_headers()
                            task_detail_url = f"{tm4_base_url}/projects/{project_id}/tasks/{task}/"
                            task_detail_call = requests.get(task_detail_url, headers=headers, timeout=10)
                            if task_detail_call.ok:
                                task_data = task_detail_call.json()
                                parent_task_id = task_data.get("parentTaskId")
                                if parent_task_id:
                                    # TM4 always splits into exactly 4 children
                                    target_task.update(
                                        parent_task_id=parent_task_id,
                                        sibling_count=4
                                    )
                                    current_app.logger.info(
                                        f"Task {task} is a split child of parent task {parent_task_id} (sibling_count=4)"
                                    )
                            else:
                                current_app.logger.warning(
                                    f"TM4 task detail call failed for task {task}: "
                                    f"status={task_detail_call.status_code}"
                                )
                        except requests.RequestException as e:
                            current_app.logger.warning(f"Could not fetch task details for {task}: {e}")

        current_app.logger.info(
            f"get_mapped_TM4_tasks complete: project={project_id}, "
            f"created={tasks_created}, skipped={tasks_skipped}"
        )
        return {"message": "complete"}

    def get_invalidated_TM4_tasks_from_contributions(self, data, project_id):
        """
        Process invalidated tasks from TM4 contributions data.

        TM4 now includes invalidatedTasks in the contributions response.
        This creates task records for invalidated tasks and updates stats.
        """
        users = User.query.all()
        usernames = [x.osm_username for x in users]
        target_project = Project.query.filter_by(id=project_id).first()

        if not target_project:
            current_app.logger.error(f"Project {project_id} not found")
            return {"message": "project not found"}

        for contributor in data.get("userContributions", []):
            if contributor["username"] not in usernames:
                continue

            mapper = User.query.filter_by(
                osm_username=contributor["username"]
            ).first()

            if not mapper:
                continue

            invalidated_tasks = contributor.get("invalidatedTasks", [])
            if not invalidated_tasks:
                continue

            current_app.logger.info(
                f"Processing {len(invalidated_tasks)} invalidated tasks for user {mapper.osm_username}"
            )

            for task_id in invalidated_tasks:
                # Check if task already exists in our system
                task_exists = Task.query.filter_by(
                    task_id=task_id,
                    project_id=project_id,
                ).first()

                if task_exists:
                    # Task exists - check if we need to mark it as invalidated
                    if not task_exists.invalidated:
                        current_app.logger.info(
                            f"Marking existing task {task_id} as invalidated for user {mapper.osm_username}"
                        )
                        task_exists.update(
                            invalidated=True,
                            validated=False,
                            date_validated=func.now(),
                        )
                        # For split tasks, only count when ALL siblings are invalidated
                        if self._should_count_invalidation(task_exists):
                            mapper.update(
                                total_tasks_invalidated=mapper.total_tasks_invalidated + 1
                            )
                            target_project.update(
                                tasks_invalidated=target_project.tasks_invalidated + 1
                            )
                else:
                    # Task doesn't exist - create it as an invalidated task
                    current_app.logger.info(
                        f"Creating new invalidated task {task_id} for user {mapper.osm_username}"
                    )
                    new_task = Task.create(
                        task_id=task_id,
                        org_id=mapper.org_id,
                        project_id=project_id,
                        mapping_rate=target_project.mapping_rate_per_task,
                        validation_rate=target_project.validation_rate_per_task,
                        paid_out=False,
                        mapped=True,
                        mapped_by=mapper.osm_username,
                        validated_by="",
                        validated=False,
                        invalidated=True,
                        date_mapped=func.now(),
                        date_validated=func.now(),
                    )
                    UserTasks.create(user_id=mapper.id, task_id=new_task.id)
                    # For new tasks, always count mapped (it's a new task)
                    # For invalidated, only count if all siblings would be invalidated
                    # Note: For newly created tasks, we don't have sibling info yet,
                    # so we count it and will reconcile later when siblings are synced
                    mapper.update(
                        total_tasks_mapped=mapper.total_tasks_mapped + 1,
                        total_tasks_invalidated=mapper.total_tasks_invalidated + 1,
                    )
                    target_project.update(
                        tasks_mapped=target_project.tasks_mapped + 1,
                        tasks_invalidated=target_project.tasks_invalidated + 1,
                    )

        return {"message": "complete"}

    def fetch_invalidated_tasks_from_tm4(self, project_id, user):
        """
        Fetch invalidated tasks from TM4's dedicated invalidation endpoint.

        When TM4 invalidates a task, it clears mapped_by, so the task
        disappears from the contributions endpoint. This method calls
        the dedicated invalidation endpoint to get tasks that were invalidated.

        Endpoint: /api/v2/projects/{project_id}/tasks/queries/own/invalidated/
        """
        headers = self._get_tm4_headers()
        base_url = self._get_tm4_base_url()
        target_project = Project.query.filter_by(id=project_id).first()

        if not target_project:
            current_app.logger.error(f"Project {project_id} not found")
            return {"response": "project not found"}

        # TM4 requires the user's OSM username for this endpoint
        # The endpoint returns tasks where user was the original mapper that got invalidated
        invalidated_url = f"{base_url}/projects/{project_id}/tasks/queries/own/invalidated/"

        current_app.logger.info(
            f"fetch_invalidated_tasks_from_tm4: user={user.osm_username}, project={project_id}, url={invalidated_url}"
        )

        try:
            response = requests.get(invalidated_url, headers=headers, timeout=30)

            if response.ok:
                data = response.json()
                invalidated_tasks = data.get("invalidatedTasks", [])

                current_app.logger.info(
                    f"TM4 invalidation endpoint returned {len(invalidated_tasks)} tasks for user {user.osm_username}"
                )

                for task_info in invalidated_tasks:
                    task_id = task_info.get("taskId")
                    if not task_id:
                        continue

                    # Check if task already exists
                    existing_task = Task.query.filter_by(
                        task_id=task_id,
                        project_id=project_id,
                    ).first()

                    if existing_task:
                        # Task exists - update invalidation status if needed
                        if not existing_task.invalidated:
                            current_app.logger.info(
                                f"Updating existing task {task_id} to invalidated"
                            )
                            existing_task.update(
                                invalidated=True,
                                validated=False,
                            )
                            # For split tasks, only count when ALL siblings are invalidated
                            if self._should_count_invalidation(existing_task):
                                user.update(
                                    total_tasks_invalidated=user.total_tasks_invalidated + 1
                                )
                                target_project.update(
                                    tasks_invalidated=target_project.tasks_invalidated + 1
                                )
                    else:
                        # Task doesn't exist - create it as invalidated
                        current_app.logger.info(
                            f"Creating new invalidated task {task_id} for user {user.osm_username}"
                        )
                        new_task = Task.create(
                            task_id=task_id,
                            org_id=user.org_id,
                            project_id=project_id,
                            mapping_rate=target_project.mapping_rate_per_task,
                            validation_rate=target_project.validation_rate_per_task,
                            paid_out=False,
                            mapped=True,
                            mapped_by=user.osm_username,
                            validated_by=task_info.get("invalidatedBy", ""),
                            validated=False,
                            invalidated=True,
                            date_mapped=func.now(),
                            date_validated=func.now(),
                        )
                        UserTasks.create(user_id=user.id, task_id=new_task.id)
                        # For new tasks, always count mapped (it's a new task)
                        # For invalidated, count it since we can't know sibling state yet
                        user.update(
                            total_tasks_mapped=user.total_tasks_mapped + 1,
                            total_tasks_invalidated=user.total_tasks_invalidated + 1,
                        )
                        target_project.update(
                            tasks_mapped=target_project.tasks_mapped + 1,
                            tasks_invalidated=target_project.tasks_invalidated + 1,
                        )

                return {"response": "complete", "count": len(invalidated_tasks)}
            else:
                current_app.logger.warning(
                    f"TM4 invalidation endpoint failed: {response.status_code} - {response.text}"
                )
                return {"response": "failed", "status": response.status_code}
        except requests.RequestException as e:
            current_app.logger.error(f"TM4 invalidation API error: {e}")
            return {"response": "error", "error": str(e)}

    def TM4_payment_call(self, project_id, user):
        """
        Fetch contributions from TM4 and update local task records.

        Args:
            project_id: The TM4 project ID
            user: The user to update tasks for
        """
        headers = self._get_tm4_headers()
        base_url = self._get_tm4_base_url()
        tm4_url = f"{base_url}/projects/{project_id}/contributions/"

        try:
            response = requests.get(tm4_url, headers=headers, timeout=60)

            if response.ok:
                data = response.json()
                self.get_mapped_TM4_tasks(data, project_id)
                self.get_validated_TM4_tasks(data, project_id)
                # Process invalidated tasks from contributions response
                # TM4 now includes invalidatedTasks in the contributions endpoint
                self.get_invalidated_TM4_tasks_from_contributions(data, project_id)
                # Also check existing tasks for invalidation via status/history
                # This handles tasks created before the TM4 enhancement
                self.get_invalidated_TM4_tasks(project_id, user)
                return {"message": "updated!"}
            else:
                current_app.logger.error(
                    f"TM4 contributions call failed: {response.status_code}"
                )
                return {"message": "TM4 API call failed", "status": response.status_code}
        except requests.RequestException as e:
            current_app.logger.error(f"TM4 API error: {e}")
            return {"message": f"TM4 API error: {str(e)}"}

    def update_user_tasks(self):
        """
        Update tasks for the current user from TM4.

        Syncs mapped, validated, and invalidated tasks.
        Includes both assigned projects AND public (visible) projects.
        """
        if not g.user:
            return {"message": "User not found", "status": 304}

        # Get user's explicitly assigned projects
        assigned_project_ids = [
            relation.project_id
            for relation in ProjectUser.query.filter_by(user_id=g.user.id).all()
        ]

        # Get all active projects in org (assigned + public/visible)
        user_projects = Project.query.filter(
            Project.org_id == g.user.org_id,
            Project.status == True,
        ).filter(
            # Include if assigned OR if visible to users
            (Project.id.in_(assigned_project_ids)) | (Project.visibility == True)
        ).all()

        # Process all projects (TM4 only - TM3 support removed)
        for project in user_projects:
            self.TM4_payment_call(project.id, g.user)

        return {"message": "updated", "status": 200}

    @requires_admin
    def admin_update_all_user_tasks(self):
        """
        Update tasks for all users in the organization from TM4.

        Admin-only endpoint to sync all user tasks.
        Includes both assigned projects AND public (visible) projects.
        """
        if not g.user:
            return {"message": "User not found", "status": 304}

        org_users = User.query.filter_by(org_id=g.user.org_id).all()

        # Get all active projects in org (for public/visible check)
        all_visible_projects = Project.query.filter(
            Project.org_id == g.user.org_id,
            Project.status == True,
            Project.visibility == True,
        ).all()
        visible_project_ids = [p.id for p in all_visible_projects]

        for user in org_users:
            # Get user's explicitly assigned projects
            assigned_project_ids = [
                relation.project_id
                for relation in ProjectUser.query.filter_by(user_id=user.id).all()
            ]

            # Combine assigned + visible projects
            all_project_ids = list(set(assigned_project_ids + visible_project_ids))

            user_projects = Project.query.filter(
                Project.org_id == user.org_id,
                Project.status == True,
                Project.id.in_(all_project_ids)
            ).all()

            # Process all projects (TM4 only - TM3 support removed)
            for project in user_projects:
                self.TM4_payment_call(project.id, user)

        return {"message": "updated", "status": 200}

    @requires_admin
    def admin_fetch_external_validations(self):
        """
        Fetch tasks validated by users outside the organization.

        Returns tasks with unknown_validator=True.
        """
        if not g.user:
            return {"message": "User not found", "status": 304}

        unknown_validator_tasks = Task.query.filter_by(
            org_id=g.user.org_id, unknown_validator=True
        ).all()

        external_validations = []
        for task in unknown_validator_tasks:
            task_project = Project.query.filter_by(id=task.project_id).first()
            task_obj = {
                "id": task.id,
                "task_id": task.task_id,
                "project_id": task.project_id,
                "project_name": task_project.name if task_project else None,
                "project_url": task_project.url if task_project else None,
                "validation_rate": task.validation_rate,
                "mapping_rate": task.mapping_rate,
                "paid_out": task.paid_out,
                "mapped": task.mapped,
                "validated": task.validated,
                "invalidated": task.invalidated,
                "mapped_by": task.mapped_by,
                "validated_by": task.validated_by,
                "unknown_validator": task.unknown_validator,
            }
            external_validations.append(task_obj)

        return {
            "external_validations": external_validations,
            "status": 200,
        }

    @requires_admin
    def update_task(self):
        """
        Manually update a task's validation status.

        Admin-only endpoint for handling external validations.
        """
        if not g.user:
            return {"message": "User not found", "status": 304}

        task_id = request.json.get("task_id")
        task_action = request.json.get("task_action")

        if not task_id:
            return {"message": "task_id required", "status": 400}
        if not task_action:
            return {"message": "task_action required", "status": 400}

        target_task = Task.query.filter_by(task_id=task_id).first()
        if not target_task:
            return {"message": "Task not found", "status": 404}

        target_project = Project.query.filter_by(id=target_task.project_id).first()
        target_mapper = User.query.filter_by(osm_username=target_task.mapped_by).first()

        if not target_mapper:
            return {"message": "Mapper not found", "status": 404}

        if task_action == "Validate":
            # Update task status first (always happens)
            target_task.update(
                validated=True,
                invalidated=False,
                validated_by=g.user.osm_username,
                unknown_validator=False,
            )

            # For split tasks, only update stats when ALL siblings are validated
            if self._should_count_validation(target_task):
                # Calculate payment: for split tasks, sum all siblings' rates
                if self._is_split_task(target_task):
                    siblings = self._get_split_siblings(target_task)
                    mapping_payment = sum(s.mapping_rate or 0 for s in siblings)
                else:
                    mapping_payment = target_task.mapping_rate or 0

                target_mapper.update(
                    total_tasks_validated=target_mapper.total_tasks_validated + 1,
                    mapping_payable_total=target_mapper.mapping_payable_total + mapping_payment,
                )
                if target_project:
                    target_project.update(
                        tasks_validated=target_project.tasks_validated + 1
                    )
            else:
                current_app.logger.info(
                    f"Split task {task_id} validated but not all siblings validated yet - deferring stats update"
                )

        elif task_action == "Invalidate":
            # Update task status first (always happens)
            target_task.update(
                validated=False,
                invalidated=True,
                validated_by=g.user.osm_username,
                unknown_validator=False,
            )

            # For split tasks, only update stats when ALL siblings are invalidated
            if self._should_count_invalidation(target_task):
                target_mapper.update(
                    total_tasks_invalidated=target_mapper.total_tasks_invalidated + 1
                )
                if target_project:
                    target_project.update(
                        tasks_invalidated=target_project.tasks_invalidated + 1
                    )
            else:
                current_app.logger.info(
                    f"Split task {task_id} invalidated but not all siblings invalidated yet - deferring stats update"
                )
        else:
            return {"message": f"Invalid task_action: {task_action}", "status": 400}

        return {"message": "Task updated", "status": 200}

    @requires_admin
    def purge_all_task_stats(self):
        """
        DEV ONLY: Purge all task-related data from the database.

        This removes:
        - All task records
        - All user_tasks records
        - All validator_task_actions records
        - Resets all user task stats to 0
        - Resets all project task stats to 0

        Admin-only endpoint for development/testing.
        """
        if not g.user:
            return {"message": "User not found", "status": 401}, 401

        try:
            org_id = g.user.org_id

            # Delete all validator task actions for org
            ValidatorTaskAction.query.filter(
                ValidatorTaskAction.project_id.in_(
                    db.session.query(Project.id).filter(Project.org_id == org_id)
                )
            ).delete(synchronize_session=False)

            # Delete all user_tasks for org users
            org_user_ids = [u.id for u in User.query.filter_by(org_id=org_id).all()]
            UserTasks.query.filter(UserTasks.user_id.in_(org_user_ids)).delete(
                synchronize_session=False
            )

            # Delete all tasks for org
            Task.query.filter_by(org_id=org_id).delete(synchronize_session=False)

            # Reset user task stats
            users = User.query.filter_by(org_id=org_id).all()
            for user in users:
                user.update(
                    total_tasks_mapped=0,
                    total_tasks_validated=0,
                    total_tasks_invalidated=0,
                    validator_tasks_invalidated=0,
                    validator_tasks_validated=0,
                    mapping_payable_total=0,
                    validation_payable_total=0,
                    payable_total=0,
                )

            # Reset project task stats
            projects = Project.query.filter_by(org_id=org_id).all()
            for project in projects:
                project.update(
                    tasks_mapped=0,
                    tasks_validated=0,
                    tasks_invalidated=0,
                )

            db.session.commit()

            current_app.logger.warning(
                f"PURGE: All task stats purged by admin {g.user.email} for org {org_id}"
            )

            return {
                "message": "All task stats purged successfully",
                "users_reset": len(users),
                "projects_reset": len(projects),
                "status": 200,
            }

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Purge task stats failed: {e}")
            return {"message": f"Purge failed: {str(e)}", "status": 500}, 500
