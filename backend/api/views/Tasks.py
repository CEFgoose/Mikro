#!/usr/bin/env python3
"""
Task API endpoints for Mikro.

Handles task synchronization with TM4 (Tasking Manager 4).
TM3 support has been removed.
"""

import requests

from flask.views import MethodView
from flask import g, request, current_app

from ..utils import requires_admin
from ..database import (
    Project,
    Task,
    ProjectUser,
    UserTasks,
    User,
)


class TaskAPI(MethodView):
    """Task management API endpoints for TM4 integration."""

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

        for c in contributions:
            validator_exists = User.query.filter_by(
                osm_username=c["username"]
            ).first()

            if validator_exists is not None:
                for task in c.get("validatedTasks", []):
                    task_exists = Task.query.filter_by(
                        task_id=task, project_id=project_id
                    ).first()

                    if task_exists is not None:
                        if (
                            task_exists.mapped_by in usernames
                            and not task_exists.validated
                        ):
                            mapper = User.query.filter_by(
                                osm_username=task_exists.mapped_by
                            ).first()

                            if not mapper:
                                continue

                            # Handle previously invalidated tasks
                            if task_exists.invalidated is True:
                                mapper.update(
                                    total_tasks_validated=mapper.total_tasks_validated - 1,
                                )
                                validator_exists.update(
                                    validator_tasks_invalidated=validator_exists.validator_tasks_invalidated - 1
                                )
                                target_project.update(
                                    tasks_invalidated=target_project.tasks_invalidated - 1
                                )

                            # Update task status
                            task_exists.update(
                                validated_by=c["username"],
                                unknown_validator=False,
                                validated=True,
                                invalidated=False,
                            )

                            # Update mapper payment totals
                            old_validated_total = int(mapper.total_tasks_validated)
                            new_tasks_validated = old_validated_total + 1
                            old_awaiting_payment = mapper.mapping_payable_total or 0
                            new_awaiting_payment = task_exists.mapping_rate or 0

                            current_awaiting_payment = old_awaiting_payment + new_awaiting_payment

                            mapper.update(
                                mapping_payable_total=current_awaiting_payment,
                                total_tasks_validated=new_tasks_validated,
                            )

                            # Update validator payment totals
                            old_validations_payment = float(
                                validator_exists.validation_payable_total or 0
                            )
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
            else:
                # Handle external validators (not in our system)
                for task in c.get("validatedTasks", []):
                    task_exists = Task.query.filter_by(
                        task_id=task, project_id=project_id
                    ).first()

                    if task_exists is not None:
                        if (
                            task_exists.mapped_by in usernames
                            and not task_exists.validated
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
        user_task_ids = [relation.task_id for relation in user_tasks]
        headers = self._get_tm4_headers()
        base_url = self._get_tm4_base_url()
        target_project = Project.query.filter_by(id=project_id).first()

        if not target_project:
            return {"response": "project not found"}

        for task_id in user_task_ids:
            target_user = User.query.filter_by(id=user.id).first()
            target_task = Task.query.filter_by(task_id=task_id).first()

            if target_task and not target_task.invalidated:
                invalid_tasks_url = f"{base_url}/projects/{project_id}/tasks/{task_id}/"

                try:
                    tasks_invalidated_call = requests.get(
                        invalid_tasks_url, headers=headers, timeout=30
                    )

                    if tasks_invalidated_call.ok:
                        task_data = tasks_invalidated_call.json()

                        if task_data.get("taskStatus") == "INVALIDATED":
                            # Get validator info
                            task_history = task_data.get("taskHistory", [])
                            if task_history:
                                validator_username = task_history[0].get("actionBy")
                                validator_exists = User.query.filter_by(
                                    osm_username=validator_username
                                ).first()

                                if validator_exists:
                                    validator_exists.update(
                                        validator_tasks_invalidated=validator_exists.validator_tasks_invalidated + 1,
                                        validation_payable_total=validator_exists.validation_payable_total
                                        + (target_task.validation_rate or 0),
                                    )
                                    target_task.update(validated_by=validator_exists.osm_username)
                                else:
                                    target_task.update(validated_by=validator_username)

                            # Update task and user stats
                            target_task.update(
                                invalidated=True,
                                validated=False,
                            )

                            invalidated_count = target_user.total_tasks_invalidated + 1
                            target_user.update(total_tasks_invalidated=invalidated_count)
                            target_project.update(
                                tasks_invalidated=target_project.tasks_invalidated + 1
                            )
                    else:
                        current_app.logger.warning(
                            f"TM4 task status call failed for task {task_id}: {tasks_invalidated_call.status_code}"
                        )
                except requests.RequestException as e:
                    current_app.logger.error(f"TM4 API error for task {task_id}: {e}")

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

        for contributor in data.get("userContributions", []):
            if contributor["username"] in usernames:
                mapper = User.query.filter_by(
                    osm_username=contributor["username"]
                ).first()

                if not mapper:
                    continue

                for task in contributor.get("mappedTasks", []):
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
                            mapped_by=contributor["username"],
                            validated_by="",
                            validated=False,
                        )
                        UserTasks.create(user_id=mapper.id, task_id=new_task.id)
                        mapper.update(total_tasks_mapped=mapper.total_tasks_mapped + 1)
                        target_project.update(
                            tasks_mapped=target_project.tasks_mapped + 1
                        )

        return {"message": "complete"}

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
            target_task.update(
                validated=True,
                invalidated=False,
                validated_by=g.user.osm_username,
                unknown_validator=False,
            )
            target_mapper.update(
                total_tasks_validated=target_mapper.total_tasks_validated + 1,
                mapping_payable_total=target_mapper.mapping_payable_total
                + (target_task.mapping_rate or 0),
            )
            if target_project:
                target_project.update(
                    tasks_validated=target_project.tasks_validated + 1
                )

        elif task_action == "Invalidate":
            target_task.update(
                validated=False,
                invalidated=True,
                validated_by=g.user.osm_username,
                unknown_validator=False,
            )
            target_mapper.update(
                total_tasks_invalidated=target_mapper.total_tasks_invalidated + 1
            )
            if target_project:
                target_project.update(
                    tasks_invalidated=target_project.tasks_invalidated + 1
                )
        else:
            return {"message": f"Invalid task_action: {task_action}", "status": 400}

        return {"message": "Task updated", "status": 200}
