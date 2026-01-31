#!/usr/bin/env python3
"""
Project API endpoints for Mikro.

Handles project management operations.
TM3 support has been removed - all projects are now TM4.
"""

import re
from datetime import datetime, timedelta

import requests
from flask.views import MethodView
from flask import g, request, current_app
from sqlalchemy import func

from ..utils import requires_admin
from ..database import (
    Project,
    Task,
    PayRequests,
    Payments,
    ProjectUser,
    UserTasks,
    User,
)


class ProjectAPI(MethodView):
    """Project management API endpoints."""

    def _get_tm4_base_url(self):
        """Get TM4 API base URL from config."""
        return current_app.config.get("TM4_API_URL", "https://tasks.kaart.com/api/v2")

    def _calculate_task_payment(self, task, is_mapping=True):
        """
        Calculate payment for a task, handling split tasks.

        For split tasks (those with parent_task_id), payment is divided among siblings
        and only paid out when all siblings are validated.

        Args:
            task: Task object
            is_mapping: True for mapping rate, False for validation rate

        Returns:
            float: Payment amount for this task
        """
        project = Project.query.filter_by(id=task.project_id).first()
        if not project:
            return 0

        rate = project.mapping_rate_per_task if is_mapping else project.validation_rate_per_task

        # Check for split task
        if task.parent_task_id:
            # Count siblings with same parent
            siblings = Task.query.filter_by(
                project_id=task.project_id,
                parent_task_id=task.parent_task_id
            ).all()
            sibling_count = len(siblings)

            if sibling_count > 1:
                # Check if all siblings are validated
                if not all(s.validated for s in siblings):
                    return 0  # Not payable until all siblings done
                return rate / sibling_count

        return rate

    def post(self, path: str):
        if path == "create_project":
            return self.create_project()
        elif path == "delete_project":
            return self.delete_project()
        elif path == "calculate_budget":
            return self.calculate_budget()
        elif path == "fetch_org_projects":
            return self.fetch_org_projects()
        elif path == "fetch_user_projects":
            return self.fetch_user_projects()
        elif path == "fetch_validator_projects":
            return self.fetch_validator_projects()
        elif path == "update_project":
            return self.update_project()
        elif path == "fetch_admin_dash_stats":
            return self.fetch_admin_dash_stats()
        elif path == "fetch_user_dash_stats":
            return self.fetch_user_dash_stats()
        elif path == "fetch_validator_dash_stats":
            return self.fetch_validator_dash_stats()
        elif path == "user_join_project":
            return self.user_join_project()
        elif path == "user_leave_project":
            return self.user_leave_project()
        elif path == "assign_user_project":
            return self.assign_user_project()
        elif path == "unassign_user_project":
            return self.unassign_user_project()

        return {
            "message": "Only /project/{fetch_users,fetch_user_projects} is permitted with GET",  # noqa: E501
        }, 405

    @requires_admin
    def create_project(self):
        """Create a new TM4 project."""
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        # Check if required data is provided
        required_args = [
            "url",
            "rate_type",
            "mapping_rate",
            "validation_rate",
            "max_editors",
            "visibility",
            "max_validators",
        ]

        for arg in required_args:
            if not request.json.get(arg):
                return {"message": f"{arg} required", "status": 400}

        # Assign the data to variables
        url = request.json.get("url")
        rate_type = request.json.get("rate_type")
        mapping_rate = float(request.json.get("mapping_rate"))
        validation_rate = float(request.json.get("validation_rate"))
        max_editors = request.json.get("max_editors")
        max_validators = request.json.get("max_validators")
        visibility = request.json.get("visibility")

        # Extract project ID from URL
        m = re.match(r"^.*\/([0-9]+)$", url)
        if not m:
            return {
                "message": "Cannot get project ID from URL",
                "status": 400,
            }
        project_id = m.group(1)

        # Check if project already exists
        project_exists = Project.query.filter_by(id=project_id).first()
        if project_exists:
            return {"message": "Project already exists", "status": 400}

        # Fetch project data from TM4 API
        base_url = self._get_tm4_base_url()
        stats_api = f"{base_url}/projects/{project_id}/"

        try:
            current_app.logger.info(f"Fetching TM4 project data from: {stats_api}")
            tm_fetch = requests.get(stats_api, timeout=30)
            if not tm_fetch.ok:
                current_app.logger.error(f"TM4 API returned {tm_fetch.status_code}: {tm_fetch.text[:500]}")
                return {"message": f"TM4 API returned status {tm_fetch.status_code}", "status": 400}
        except requests.RequestException as e:
            current_app.logger.error(f"TM4 API request error: {e}")
            return {"message": "TM4 API error", "status": 500}

        try:
            project_data = tm_fetch.json()
        except requests.exceptions.JSONDecodeError:
            current_app.logger.error(f"TM4 API returned non-JSON response: {tm_fetch.text[:500]}")
            return {"message": "TM4 API returned invalid response - check project URL", "status": 400}

        project_info = project_data.get("projectInfo", {})
        project_name = project_info.get("name", f"Project {project_id}")
        # Use totalTasks from projectInfo if available (more accurate than counting features)
        total_tasks = project_info.get("totalTasks") or len(project_data.get("tasks", {}).get("features", []))

        # Calculate budget
        if rate_type is True:
            calculation = (mapping_rate + validation_rate) * total_tasks
        else:
            calculation = 0

        # Create new project
        if mapping_rate >= 0.01 and validation_rate >= 0.01:
            Project.create(
                id=project_id,
                org_id=g.user.org_id,
                name=project_name,
                total_tasks=total_tasks,
                max_payment=float(calculation),
                url=url,
                validation_rate_per_task=validation_rate,
                mapping_rate_per_task=mapping_rate,
                max_editors=max_editors,
                max_validators=max_validators,
                visibility=visibility,
                status=True,  # New projects are active by default
            )
            return {"message": "Project created", "status": 200}
        else:
            return {"message": "Rate per task insufficient", "status": 400}

    @requires_admin
    def update_project(self):
        response = {}
        # Check if user is authenticated
        if not hasattr(g, "user") or not g.user:
            return {"message": "Missing user info", "status": 304}
        # Check if required data is provided
        project_id = request.json.get("project_id")
        difficulty = request.json.get("difficulty")
        rate_type = request.json.get("rate_type")
        mapping_rate = float(request.json.get("mapping_rate"))
        validation_rate = float(request.json.get("validation_rate"))
        max_editors = request.json.get("max_editors")
        max_validators = request.json.get("max_validators")
        visibility = request.json.get("visibility")
        project_status = request.json.get("project_status")
        required_args = [
            "difficulty",
            "validation_rate",
            "mapping_rate",
            "max_editors",
            "max_validators",
            "project_id",
        ]
        for arg in required_args:
            if not request.json.get(arg):
                return {"message": f"{arg} required", "status": 400}
        if not project_status:
            project_status = False
        else:
            project_status = True
        target_project = Project.query.filter_by(
            org_id=g.user.org_id, id=project_id
        ).first()
        if not target_project:
            response["message"] = "Project %s not found" % (project_id)
            response["status"] = 400
            return response
        # Calculate payment rate and rate based on rate type
        if mapping_rate != 0 and validation_rate != 0:
            if rate_type is True:
                mapping_calculation = mapping_rate * target_project.total_tasks
            target_project.update(
                mapping_rate_per_task=mapping_rate,
                max_payment=float(mapping_calculation),
                validation_rate_per_task=validation_rate,
            )
        target_project.update(
            visibility=visibility, difficulty=difficulty, status=project_status
        )
        if max_editors and max_editors != 0:
            target_project.update(
                max_editors=max_editors,
            )
        if max_validators and max_validators != 0:
            target_project.update(
                max_validators=max_validators,
            )
        response["status"] = 200
        return response

    @requires_admin
    def delete_project(self):
        response = {}
        # Check if user is authenticated
        if not g.user:
            return {"message": "Missing user info", "status": 304}
        # Check if required data is provided
        project_id = request.json.get("project_id")
        if not project_id:
            return {"message": "project_id required", "status": 400}
        target_project = Project.query.filter_by(
            org_id=g.user.org_id, id=project_id
        ).first()
        if not target_project:
            response["message"] = "Project %s not found" % (project_id)
            response["status"] = 400
            return response
        else:
            # Put logic here to process remaining payouts or whatever else before deletion  # noqa: E501
            target_project.delete(soft=False)
            response["message"] = "Project %s deleted" % (project_id)
            response["status"] = 200
            return response

    @requires_admin
    def calculate_budget(self):
        """Calculate projected budget for a TM4 project."""
        if not hasattr(g, "user") or not g.user:
            return {"message": "Missing user info", "status": 304}

        url = request.json.get("url")
        rate_type = bool(request.json.get("rate_type"))
        mapping_rate = request.json.get("mapping_rate")
        validation_rate = request.json.get("validation_rate")
        project_id = request.json.get("project_id")

        required_args = ["mapping_rate", "validation_rate", "url"]
        for arg in required_args:
            if request.json.get(arg) is None:
                return {"message": f"{arg} required", "status": 400}

        # Get TM4 API URL
        base_url = self._get_tm4_base_url()

        if project_id is not None:
            project = Project.query.filter_by(id=project_id).first()
            if not project:
                return {"message": "Project not found", "status": 400}
        else:
            m = re.match(r"^.*\/([0-9]+)$", url)
            if not m:
                return {"message": "Cannot get project ID from URL", "status": 400}
            project_id = m.group(1)

        stats_api = f"{base_url}/projects/{project_id}/"

        # Fetch project data from TM4
        try:
            current_app.logger.info(f"Fetching TM4 project data from: {stats_api}")
            tm_fetch = requests.get(stats_api, timeout=30)
            if not tm_fetch.ok:
                current_app.logger.error(f"TM4 API returned {tm_fetch.status_code}: {tm_fetch.text[:500]}")
                return {"message": f"TM4 API returned status {tm_fetch.status_code}", "status": 500}
        except requests.RequestException as e:
            current_app.logger.error(f"TM4 API request error: {e}")
            return {"message": "TM4 API error", "status": 500}

        try:
            json_data = tm_fetch.json()
        except requests.exceptions.JSONDecodeError:
            current_app.logger.error(f"TM4 API returned non-JSON response: {tm_fetch.text[:500]}")
            return {"message": "TM4 API returned invalid response", "status": 500}

        # Debug logging for task count
        project_info = json_data.get("projectInfo", {})
        features_count = len(json_data.get("tasks", {}).get("features", []))
        project_info_total = project_info.get("totalTasks")
        current_app.logger.info(f"TM4 project {project_id} - projectInfo.totalTasks: {project_info_total}, features count: {features_count}")
        current_app.logger.info(f"TM4 projectInfo keys: {list(project_info.keys())}")

        # Use totalTasks from projectInfo if available (more accurate than counting features)
        total_tasks = project_info_total or features_count
        current_app.logger.info(f"Using total_tasks: {total_tasks}")

        if rate_type is True:
            mapping_rate = float(mapping_rate)
            validation_rate = float(validation_rate)

            projected_mapping_budget = mapping_rate * total_tasks
            projected_validation_budget = validation_rate * total_tasks
            total_projected_budget = projected_mapping_budget + projected_validation_budget

            return_text = (
                f"${mapping_rate:.2f}(Mapping) + ${validation_rate:.2f}(Validation) "
                f"x {total_tasks} Tasks = Projected Budget: ${total_projected_budget:.2f}"
            )

            return {"calculation": return_text, "status": 200}

        return {"message": "rate_type must be true", "status": 400}

    def _count_tasks_split_aware(self, tasks, condition_fn=None):
        """
        Count tasks with split-awareness.

        Split task groups (siblings with same parent_task_id) only count as 1
        when ALL siblings meet the condition.

        Args:
            tasks: List of Task objects to count
            condition_fn: Optional function that takes a task and returns True
                         if it should be counted. If None, counts all tasks.

        Returns:
            Effective count where split groups count as 1 only when ALL siblings
            meet condition
        """
        if condition_fn is None:
            condition_fn = lambda t: True

        # Separate normal tasks from split tasks
        normal_tasks = [t for t in tasks if not t.parent_task_id]
        split_tasks = [t for t in tasks if t.parent_task_id]

        # Count normal tasks that meet condition
        normal_count = len([t for t in normal_tasks if condition_fn(t)])

        # Group split tasks by parent_task_id
        split_groups = {}
        for task in split_tasks:
            if task.parent_task_id not in split_groups:
                split_groups[task.parent_task_id] = []
            split_groups[task.parent_task_id].append(task)

        # Count split groups where ALL siblings meet condition
        split_count = 0
        for parent_id, siblings in split_groups.items():
            if all(condition_fn(t) for t in siblings):
                split_count += 1

        return normal_count + split_count

    def _get_effective_task_counts(self, project_id):
        """
        Calculate effective task counts that properly handle split tasks.

        Split tasks (those with parent_task_id) are grouped together and counted
        as fractions. For example, if a task was split into 4, each split task
        contributes 0.25 to the count instead of 1.

        Returns:
            dict with effective_mapped, effective_validated, effective_invalidated,
            plus raw counts and split task info
        """
        project_tasks = Task.query.filter_by(project_id=project_id).all()

        # Separate normal tasks from split tasks
        normal_tasks = [t for t in project_tasks if not t.parent_task_id]
        split_tasks = [t for t in project_tasks if t.parent_task_id]

        # Count normal tasks directly
        normal_mapped = len([t for t in normal_tasks if t.mapped])
        normal_validated = len([t for t in normal_tasks if t.validated])
        normal_invalidated = len([t for t in normal_tasks if t.invalidated])

        # Group split tasks by parent_task_id and count each group as 1 task
        split_groups = {}
        for task in split_tasks:
            if task.parent_task_id not in split_groups:
                split_groups[task.parent_task_id] = {
                    "tasks": [],
                    "mapped": 0,
                    "validated": 0,
                    "invalidated": 0,
                }
            split_groups[task.parent_task_id]["tasks"].append(task)
            if task.mapped:
                split_groups[task.parent_task_id]["mapped"] += 1
            if task.validated:
                split_groups[task.parent_task_id]["validated"] += 1
            if task.invalidated:
                split_groups[task.parent_task_id]["invalidated"] += 1

        # For split groups, only count as 1 when ALL siblings are complete
        # If not all siblings are complete, the group counts as 0
        split_mapped = 0
        split_validated = 0
        split_invalidated = 0

        for parent_id, group in split_groups.items():
            sibling_count = len(group["tasks"])
            # Only count as 1 mapped task if ALL siblings are mapped
            if group["mapped"] == sibling_count:
                split_mapped += 1
            # Only count as 1 validated task if ALL siblings are validated
            if group["validated"] == sibling_count:
                split_validated += 1
            # Only count as 1 invalidated task if ALL siblings are invalidated
            if group["invalidated"] == sibling_count:
                split_invalidated += 1

        return {
            # Effective counts: normal tasks + completed split groups (all siblings done = 1)
            "effective_mapped": normal_mapped + split_mapped,
            "effective_validated": normal_validated + split_validated,
            "effective_invalidated": normal_invalidated + split_invalidated,
            # Raw counts: actual number of task records (includes each split segment)
            "raw_mapped": normal_mapped + len([t for t in split_tasks if t.mapped]),
            "raw_validated": normal_validated + len([t for t in split_tasks if t.validated]),
            "raw_invalidated": normal_invalidated + len([t for t in split_tasks if t.invalidated]),
            "split_task_groups": len(split_groups),
            "split_task_count": len(split_tasks),
        }

    @requires_admin
    def fetch_org_projects(self):
        # Check if user is authenticated
        if not g:
            return {"message": "User not found", "status": 304}
        # Get all projects for the organization
        org_active_projects = []
        org_inactive_projects = []
        active_projects = Project.query.filter_by(
            org_id=g.user.org_id, status=True
        ).all()
        inactive_projects = Project.query.filter_by(
            org_id=g.user.org_id, status=False
        ).all()
        # Add each project to the list
        for project in active_projects:
            # Get effective task counts that handle split tasks properly
            task_counts = self._get_effective_task_counts(project.id)
            org_active_projects.append(
                {
                    "id": project.id,
                    "name": project.name,
                    "visibility": project.visibility,
                    "max_payment": project.max_payment,
                    "payment_due": project.payment_due,
                    "total_payout": project.total_payout,
                    "validation_rate_per_task": project.validation_rate_per_task,  # noqa: E501
                    "mapping_rate_per_task": project.mapping_rate_per_task,
                    "max_editors": project.max_editors,
                    "total_editors": project.total_editors,
                    "max_validators": project.max_editors,
                    "total_validators": project.total_editors,
                    "total_tasks": project.total_tasks,
                    "url": project.url,
                    "difficulty": project.difficulty,
                    # Use effective counts that handle split tasks
                    "total_mapped": task_counts["effective_mapped"],
                    "total_validated": task_counts["effective_validated"],
                    "total_invalidated": task_counts["effective_invalidated"],
                    # Also include raw counts for reference
                    "raw_mapped": task_counts["raw_mapped"],
                    "raw_validated": task_counts["raw_validated"],
                    "raw_invalidated": task_counts["raw_invalidated"],
                    "split_task_groups": task_counts["split_task_groups"],
                    "status": project.status,
                }
            )
        for project in inactive_projects:
            task_counts = self._get_effective_task_counts(project.id)
            org_inactive_projects.append(
                {
                    "id": project.id,
                    "name": project.name,
                    "visibility": project.visibility,
                    "max_payment": project.max_payment,
                    "payment_due": project.payment_due,
                    "total_payout": project.total_payout,
                    "validation_rate_per_task": project.validation_rate_per_task,  # noqa: E501
                    "mapping_rate_per_task": project.mapping_rate_per_task,
                    "max_editors": project.max_editors,
                    "total_editors": project.total_editors,
                    "max_validators": project.max_editors,
                    "total_validators": project.total_editors,
                    "total_tasks": project.total_tasks,
                    "url": project.url,
                    "difficulty": project.difficulty,
                    # Use effective counts that handle split tasks
                    "total_mapped": task_counts["effective_mapped"],
                    "total_validated": task_counts["effective_validated"],
                    "total_invalidated": task_counts["effective_invalidated"],
                    # Also include raw counts for reference
                    "raw_mapped": task_counts["raw_mapped"],
                    "raw_validated": task_counts["raw_validated"],
                    "raw_invalidated": task_counts["raw_invalidated"],
                    "split_task_groups": task_counts["split_task_groups"],
                    "status": project.status,
                }
            )
        return {
            "org_active_projects": org_active_projects,
            "org_inactive_projects": org_inactive_projects,
            "message": "Projects found",
            "status": 200,
        }

    @requires_admin
    def fetch_admin_dash_stats(self):
        # Check if user is authenticated
        if not g:
            return {"message": "User not found", "status": 304}
        # Retrieve all projects and tasks for the organization
        all_projects = Project.query.filter_by(org_id=g.user.org_id).all()
        all_tasks = Task.query.filter_by(org_id=g.user.org_id).all()
        all_requests = PayRequests.query.filter_by(org_id=g.user.org_id).all()
        all_payments = Payments.query.filter_by(org_id=g.user.org_id).all()

        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        weekly_contributions_this_month = (
            UserTasks.query.with_entities(
                func.extract("week", UserTasks.timestamp).label("week"),
                func.count().label("total_contributions"),
            )
            .filter(UserTasks.timestamp >= start_date, UserTasks.timestamp <= end_date)
            .group_by(func.extract("week", UserTasks.timestamp))
            .all()
        )

        weekly_contributions_last_month = (
            UserTasks.query.with_entities(
                func.extract("week", UserTasks.timestamp).label("week"),
                func.count().label("total_contributions"),
            )
            .filter(
                UserTasks.timestamp >= start_date - timedelta(days=30),
                UserTasks.timestamp <= end_date - timedelta(days=30),
            )
            .group_by(func.extract("week", UserTasks.timestamp))
            .all()
        )

        # Print or use the results
        weekly_contributions_array = []
        total_contributions_this_month = 0
        total_contributions_last_month = 0
        for week, total_contributions in weekly_contributions_this_month:
            weekly_contributions_array.append(total_contributions)
            total_contributions_this_month += total_contributions

        for week, total_contributions in weekly_contributions_last_month:
            weekly_contributions_array.append(total_contributions)
            total_contributions_last_month += total_contributions

        month_contribution_change = (
            total_contributions_this_month - total_contributions_last_month
        )

        total_payable = sum(
            [
                user.payable_total
                for user in User.query.filter_by(org_id=g.user.org_id).all()
            ]
        )
        # Compute various statistics
        active_projects_count = sum(project.status for project in all_projects)
        inactive_projects_count = sum(not project.status for project in all_projects)
        completed_projects_count = sum(project.completed for project in all_projects)

        # Use split-aware counting for org-wide task stats
        mapped_tasks_count = self._count_tasks_split_aware(
            all_tasks,
            lambda t: t.mapped and not t.validated and not t.invalidated
        )
        validated_tasks_count = self._count_tasks_split_aware(
            all_tasks,
            lambda t: t.mapped and t.validated
        )
        invalidated_tasks_count = self._count_tasks_split_aware(
            all_tasks,
            lambda t: t.invalidated
        )
        all_requests_total = sum(request.amount_requested for request in all_requests)
        payouts_total = sum(payment.amount_paid for payment in all_payments)
        # Construct response dictionary
        response = {
            "month_contribution_change": month_contribution_change,
            "total_contributions_for_month": total_contributions_this_month,
            "weekly_contributions_array": weekly_contributions_array,
            "active_projects": active_projects_count,
            "inactive_projects": inactive_projects_count,
            "completed_projects": completed_projects_count,
            "mapped_tasks": mapped_tasks_count,
            "validated_tasks": validated_tasks_count,
            "invalidated_tasks": invalidated_tasks_count,
            "payable_total": total_payable,
            "requests_total": all_requests_total,
            "payouts_total": payouts_total,
            "message": "Stats Fetched",
            "status": 200,
        }
        return response

    def fetch_user_dash_stats(self):
        # Check if user is authenticated
        if not g.user:
            return {"message": "User not found", "status": 304}
        user_id = g.user.id
        all_user_assignments_count = len(
            ProjectUser.query.filter_by(user_id=user_id).all()
        )
        all_user_assignment_ids = [
            relation.project_id
            for relation in ProjectUser.query.filter_by(user_id=user_id).all()
        ]
        # Retrieve all projects and tasks for the organization
        all_projects = Project.query.filter_by(org_id=g.user.org_id).all()
        all_tasks = Task.query.filter_by(org_id=g.user.org_id).all()
        all_user_task_ids = [
            relation.task_id
            for relation in UserTasks.query.filter_by(user_id=g.user.id).all()
        ]
        # Get user's tasks
        user_tasks = [task for task in all_tasks if task.id in all_user_task_ids]

        # Use split-aware counting - only counts as 1 when ALL siblings complete
        user_mapped_tasks_count = self._count_tasks_split_aware(
            user_tasks,
            lambda t: t.mapped is True and t.validated is False and t.invalidated is False
        )
        user_validated_tasks_count = self._count_tasks_split_aware(
            user_tasks,
            lambda t: t.mapped is True and t.validated is True
        )
        user_invalidated_tasks_count = self._count_tasks_split_aware(
            user_tasks,
            lambda t: t.mapped is True and t.invalidated is True
        )

        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        weekly_contributions_this_month = (
            UserTasks.query.with_entities(
                func.extract("week", UserTasks.timestamp).label("week"),
                func.count().label("total_contributions"),
            )
            .filter(
                UserTasks.user_id == user_id,
                UserTasks.timestamp >= start_date,
                UserTasks.timestamp <= end_date,
            )
            .group_by(func.extract("week", UserTasks.timestamp))
            .all()
        )

        weekly_contributions_last_month = (
            UserTasks.query.with_entities(
                func.extract("week", UserTasks.timestamp).label("week"),
                func.count().label("total_contributions"),
            )
            .filter(
                UserTasks.user_id == user_id,
                UserTasks.timestamp >= start_date - timedelta(days=30),
                UserTasks.timestamp <= end_date - timedelta(days=30),
            )
            .group_by(func.extract("week", UserTasks.timestamp))
            .all()
        )

        # Print or use the results
        weekly_contributions_array = []
        total_contributions_this_month = 0
        total_contributions_last_month = 0
        for week, total_contributions in weekly_contributions_this_month:
            weekly_contributions_array.append(total_contributions)
            total_contributions_this_month += total_contributions

        for week, total_contributions in weekly_contributions_last_month:
            weekly_contributions_array.append(total_contributions)
            total_contributions_last_month += total_contributions

        month_contribution_change = (
            total_contributions_last_month - total_contributions_this_month
        )

        all_user_requests = PayRequests.query.filter_by(
            org_id=g.user.org_id, user_id=g.user.id
        ).all()
        all_user_payments = Payments.query.filter_by(
            org_id=g.user.org_id, user_id=g.user.id
        ).all()
        # Compute various statistics
        active_projects_count = sum(project.status for project in all_projects)
        completed_projects_count = sum(
            project.completed
            for project in all_projects
            if project.id in all_user_assignment_ids
        )
        # validated_tasks_amounts = sum(task.rate for task in user_validated_tasks)  # noqa: E501
        all_requests_total = sum(
            request.amount_requested for request in all_user_requests
        )
        payouts_total = sum(payment.amount_paid for payment in all_user_payments)
        payable_total = g.user.mapping_payable_total
        # Construct response dictionary
        response = {
            "month_contribution_change": month_contribution_change,
            "total_contributions_for_month": total_contributions_this_month,
            "weekly_contributions_array": weekly_contributions_array,
            # "active_projects": all_user_assignments_count,
            # "inactive_projects": active_projects_count - all_user_assignments_count,
            # "completed_projects": completed_projects_count,
            "mapped_tasks": user_mapped_tasks_count,
            "validated_tasks": user_validated_tasks_count,
            "invalidated_tasks": user_invalidated_tasks_count,
            "validator_validated": g.user.validator_tasks_validated,
            "validator_invalidated": g.user.validator_tasks_invalidated,
            "mapping_payable_total": g.user.mapping_payable_total,
            "validation_payable_total": g.user.validation_payable_total,
            "payable_total": payable_total,
            "requests_total": all_requests_total,
            "payouts_total": payouts_total,
            "message": "Stats Fetched",
            "status": 200,
        }
        return response

    def fetch_validator_dash_stats(self):
        # Check if user is authenticated
        if not g:
            return {"message": "User not found", "status": 304}
        all_user_assignments_count = len(
            ProjectUser.query.filter_by(user_id=g.user.id).all()
        )
        all_user_assignment_ids = [
            relation.project_id
            for relation in ProjectUser.query.filter_by(user_id=g.user.id).all()
        ]
        # Retrieve all projects and tasks for the organization
        all_projects = Project.query.filter_by(org_id=g.user.org_id).all()
        all_tasks = Task.query.filter_by(org_id=g.user.org_id).all()

        all_user_task_ids = [
            relation.task_id
            for relation in UserTasks.query.filter_by(user_id=g.user.id).all()
        ]

        # Get user's tasks (where they are mapper)
        user_tasks = [task for task in all_tasks if task.id in all_user_task_ids]

        # Use split-aware counting for user's mapped tasks
        user_mapped_tasks_count = self._count_tasks_split_aware(
            user_tasks,
            lambda t: t.mapped is True and t.validated is False and t.invalidated is False
        )

        # Use split-aware counting for user's validated tasks (validated by others)
        user_validated_tasks_count = self._count_tasks_split_aware(
            user_tasks,
            lambda t: t.mapped is True and t.validated is True
        )

        # Use split-aware counting for user's invalidated tasks
        user_invalidated_tasks_count = self._count_tasks_split_aware(
            user_tasks,
            lambda t: t.mapped is True and t.invalidated is True
        )

        # Query validated tasks directly by validated_by (not just through UserTasks)
        # This ensures validators see ALL tasks they validated, not just ones linked via UserTasks
        validator_validated_tasks_list = [
            task
            for task in all_tasks
            if task.validated is True
            and task.validated_by == g.user.osm_username
            and not task.self_validated  # Exclude self-validated from payment counts
        ]
        # Use split-aware counting for validator's validated tasks
        validator_validated_tasks = self._count_tasks_split_aware(
            all_tasks,
            lambda t: t.validated is True
            and t.validated_by == g.user.osm_username
            and not t.self_validated
        )

        validator_invalidated_tasks_list = [
            task
            for task in all_tasks
            if task.invalidated is True
            and task.validated_by == g.user.osm_username
        ]
        # Use split-aware counting for validator's invalidated tasks
        validator_invalidated_tasks = self._count_tasks_split_aware(
            all_tasks,
            lambda t: t.invalidated is True and t.validated_by == g.user.osm_username
        )

        # Count self-validated tasks separately for display/warning (split-aware)
        self_validated_tasks_count = self._count_tasks_split_aware(
            all_tasks,
            lambda t: t.validated is True
            and t.validated_by == g.user.osm_username
            and t.self_validated is True
        )

        # Calculate validation earnings excluding self-validated tasks
        validation_earnings = sum(
            self._calculate_task_payment(task, is_mapping=False)
            for task in validator_validated_tasks_list
        )
        # Include invalidation earnings
        invalidation_earnings = sum(
            self._calculate_task_payment(task, is_mapping=False)
            for task in validator_invalidated_tasks_list
        )

        all_user_requests = PayRequests.query.filter_by(
            org_id=g.user.org_id, user_id=g.user.id
        ).all()
        all_user_payments = Payments.query.filter_by(
            org_id=g.user.org_id, user_id=g.user.id
        ).all()
        # Compute various statistics
        active_projects_count = sum(project.status for project in all_projects)
        completed_projects_count = sum(
            project.completed
            for project in all_projects
            if project.id in all_user_assignment_ids
        )
        # validated_tasks_amounts = sum(task.rate for task in user_validated_tasks)  # noqa: E501
        all_requests_total = sum(
            request.amount_requested for request in all_user_requests
        )
        payouts_total = sum(payment.amount_paid for payment in all_user_payments)
        payable_total = float(
            float(g.user.mapping_payable_total) + float(g.user.validation_payable_total)
        )
        # Construct response dictionary
        # Use snake_case field names to match frontend types
        response = {
            "active_projects": all_user_assignments_count,
            "inactive_projects": active_projects_count - all_user_assignments_count,
            "completed_projects": completed_projects_count,
            # Mapped tasks (as mapper)
            "tasks_mapped": user_mapped_tasks_count,
            "mapped_tasks": user_mapped_tasks_count,  # Legacy alias
            # Tasks validated by others (where user was mapper)
            "tasks_validated": user_validated_tasks_count,
            "validated_tasks": user_validated_tasks_count,  # Legacy alias
            "tasks_invalidated": user_invalidated_tasks_count,
            "invalidated_tasks": user_invalidated_tasks_count,  # Legacy alias
            # Validation work done BY this user (as validator)
            "validator_validated": validator_validated_tasks,
            "validator_invalidated": validator_invalidated_tasks,
            "self_validated_count": self_validated_tasks_count,  # For frontend warning display
            # Payment totals
            "mapping_payable_total": g.user.mapping_payable_total,
            "validation_payable_total": g.user.validation_payable_total,
            "calculated_validation_earnings": validation_earnings + invalidation_earnings,
            "payable_total": payable_total,
            "paid_total": payouts_total,  # Alias for frontend
            "requests_total": all_requests_total,
            "payouts_total": payouts_total,
            "message": "Stats Fetched",
            "status": 200,
        }
        return response

    def fetch_user_projects(self):
        # Check if user is authenticated
        if not g.user:
            return {"message": "User not found", "status": 304}

        # Fetch all active projects
        user_projects = []

        active_projects = Project.query.filter(
            Project.org_id == g.user.org_id,
            Project.status == True,
        ).all()

        for project in active_projects:
            user_task_ids = [
                relation.task_id
                for relation in UserTasks.query.filter_by(user_id=g.user.id).all()
            ]
            all_project_tasks = Task.query.filter_by(project_id=project.id).all()
            user_project_task_ids = [
                task.id for task in all_project_tasks if task.id in user_task_ids
            ]
            user_project_tasks = [
                task for task in all_project_tasks if task.id in user_project_task_ids
            ]

            # Use split-aware counting - only counts as 1 when ALL siblings complete
            user_project_mapped_tasks = self._count_tasks_split_aware(
                user_project_tasks,
                lambda t: t.mapped is True and t.validated is False and t.invalidated is False
            )
            user_project_approved_tasks = self._count_tasks_split_aware(
                user_project_tasks,
                lambda t: t.mapped is True and t.validated is True and t.invalidated is False
            )
            user_project_unapproved_tasks = self._count_tasks_split_aware(
                user_project_tasks,
                lambda t: t.mapped is True and t.validated is False and t.invalidated is True
            )

            # Calculate earnings using split-aware payment calculation
            user_mapping_earnings = sum(
                self._calculate_task_payment(task, is_mapping=True)
                for task in user_project_tasks
                if task.validated is True and not getattr(task, 'self_validated', False)
            )
            user_project_earnings = user_mapping_earnings
            user_projects.append(
                {
                    "id": project.id,
                    "name": project.name,
                    "visibility": project.visibility,
                    "max_payment": project.max_payment,
                    "payment_due": project.payment_due,
                    "total_payout": project.total_payout,
                    "validation_rate_per_task": project.validation_rate_per_task,  # noqa: E501
                    "mapping_rate_per_task": project.mapping_rate_per_task,
                    "max_editors": project.max_editors,
                    "total_editors": project.total_editors,
                    "max_validators": project.max_editors,
                    "total_validators": project.total_editors,
                    "total_tasks": project.total_tasks,
                    "url": project.url,
                    "difficulty": project.difficulty,
                    "tasks_mapped": user_project_mapped_tasks,
                    "tasks_approved": user_project_approved_tasks,
                    "tasks_unapproved": user_project_unapproved_tasks,
                    "total_mapped": project.tasks_mapped,
                    "total_validated": project.tasks_validated,
                    "total_invalidated": project.tasks_invalidated,
                    "user_earnings": user_project_earnings,
                    "status": project.status,
                }
            )

        return {
            "user_projects": user_projects,
            "message": "Projects found",
            "status": 200,
        }

    @requires_admin
    def assign_user_project(self):
        # Check if user is authenticated
        if not g:
            return {"message": "User not found", "status": 304}
        project_id = request.json.get("project_id")
        user_id = request.json.get("user_id")
        if not user_id:
            return {"message": "user_id required", "status": 400}
        if not project_id:
            return {"message": "project_id required", "status": 400}
        target_project = Project.query.filter_by(id=project_id).first()
        if target_project.total_editors == target_project.max_editors:
            return {"message": "Editor limit reached", "status": 400}
        ProjectUser.create(project_id=project_id, user_id=user_id)
        if not target_project:
            return {
                "message": "project %s not found" % (project_id),
                "status": 400,
            }
        new_editor_count = target_project.total_editors + 1
        target_project.update(total_editors=new_editor_count)
        return {
            "message": "User %s has joined project %s" % (user_id, project_id),
            "status": 200,
        }

    @requires_admin
    def unassign_user_project(self):
        # Check if user is authenticated
        if not g:
            return {"message": "User not found", "status": 304}
        project_id = request.json.get("project_id")
        user_id = request.json.get("user_id")
        if not user_id:
            return {"message": "user_id required", "status": 400}
        if not project_id:
            return {"message": "project_id required", "status": 400}
        target_relation = ProjectUser.query.filter_by(
            project_id=project_id, user_id=user_id
        ).first()
        if not target_relation:
            return {"message": "project assignment not found", "status": 400}
        target_relation.delete(soft=False)
        target_project = Project.query.filter_by(id=project_id).first()
        if not target_project:
            return {
                "message": "project %s not found" % (project_id),
                "status": 400,
            }
        new_editor_count = target_project.total_editors - 1
        target_project.update(total_editors=new_editor_count)
        return {
            "message": "User %s has left project %s" % (user_id, project_id),
            "status": 200,
        }

    # def user_join_project(self):
    #     # Check if user is authenticated
    #     if not g.user:
    #         return {"message": "User not found", "status": 304}
    #     project_id = request.json.get("project_id")
    #     if not project_id:
    #         return {"message": "project_id required", "status": 400}
    #     target_project = Project.query.filter_by(id=project_id).first()
    #     if not target_project:
    #         return {
    #             "message": "project %s not found" % (project_id),
    #             "status": 400,
    #         }
    #     existing_user_project_relation = ProjectUser.query.filter_by(
    #         project_id=project_id, user_id=g.user.id
    #     ).first()

    #     if existing_user_project_relation:
    #         return {
    #             "message": "User %s has already joined project %s"
    #             % (g.user.id, project_id),
    #             "status": 400,
    #         }
    #     ProjectUser.create(project_id=project_id, user_id=g.user.id)
    #     count = target_project.total_editors + 1
    #     target_project.update(total_editors=count)
    #     return {
    #         "message": "User %s has joined project %s" % (g.user.id, project_id),
    #         "status": 200,
    #     }

    # def user_leave_project(self):
    #     # Check if user is authenticated
    #     if not g:
    #         return {"message": "User not found", "status": 304}
    #     project_id = request.json.get("project_id")
    #     if not project_id:
    #         return {"message": "project_id required", "status": 400}
    #     target_relation = ProjectUser.query.filter_by(
    #         project_id=project_id, user_id=g.user.id
    #     ).first()
    #     if not target_relation:
    #         return {"message": "project assignment not found", "status": 400}
    #     target_relation.delete(soft=False)
    #     target_project = Project.query.filter_by(id=project_id).first()
    #     if not target_project:
    #         return {
    #             "message": "project %s not found" % (project_id),
    #             "status": 400,
    #         }
    #     new_editor_count = target_project.total_editors - 1
    #     target_project.update(total_editors=new_editor_count)
    #     return {
    #         "message": "User %s has left project %s" % (g.user.id, project_id),
    #         "status": 200,
    #     }

    def fetch_validator_projects(self):
        # Check if user is authenticated
        if not g:
            return {"message": "User not found", "status": 304}

        # Get all projects for the validator
        org_active_projects = []
        org_inactive_projects = []
        unassigned_projects_with_validations = []

        all_user_project_ids = [
            relation.project_id
            for relation in ProjectUser.query.filter_by(user_id=g.user.id).all()
        ]

        # Find projects where user has validated tasks but is not assigned
        all_org_tasks = Task.query.filter_by(org_id=g.user.org_id).all()
        validated_project_ids = set(
            task.project_id
            for task in all_org_tasks
            if task.validated_by == g.user.osm_username
        )
        unassigned_validation_project_ids = validated_project_ids - set(all_user_project_ids)

        user_joined_projects = [
            project
            for project in Project.query.filter_by(
                org_id=g.user.org_id, status=True
            ).all()
            if project.id in all_user_project_ids
        ]

        # Projects where user validated tasks but is not assigned
        unassigned_validation_projects = [
            project
            for project in Project.query.filter_by(
                org_id=g.user.org_id, status=True
            ).all()
            if project.id in unassigned_validation_project_ids
        ]

        user_available_projects = [
            project
            for project in Project.query.filter_by(
                org_id=g.user.org_id, status=True
            ).all()
            if project.id not in all_user_project_ids
            and project.id not in unassigned_validation_project_ids
            and project.total_editors < project.max_editors
        ]

        # Add each project to the list
        for project in user_joined_projects:
            user_task_ids = [
                relation.task_id
                for relation in UserTasks.query.filter_by(user_id=g.user.id).all()
            ]
            all_project_tasks = Task.query.filter_by(project_id=project.id).all()
            user_project_task_ids = [
                task.id for task in all_project_tasks if task.id in user_task_ids
            ]
            user_project_tasks = [
                task for task in all_project_tasks if task.id in user_project_task_ids
            ]

            # Use split-aware counting - only counts as 1 when ALL siblings complete
            user_project_mapped_tasks = self._count_tasks_split_aware(
                user_project_tasks,
                lambda t: t.mapped is True and t.validated is False and t.invalidated is False
            )
            user_project_approved_tasks = self._count_tasks_split_aware(
                user_project_tasks,
                lambda t: t.mapped is True and t.validated is True and t.invalidated is False
            )
            user_project_unapproved_tasks = self._count_tasks_split_aware(
                user_project_tasks,
                lambda t: t.mapped is True and t.validated is False and t.invalidated is True
            )

            # Exclude self-validated tasks from payment counts (keep list for earnings calc)
            user_project_validated_tasks_list = [
                task
                for task in all_project_tasks
                if task.mapped is True
                and task.validated is True
                and task.invalidated is False
                and task.validated_by == g.user.osm_username
                and not task.self_validated
            ]
            # Split-aware count for display
            user_project_validated_tasks = self._count_tasks_split_aware(
                all_project_tasks,
                lambda t: t.mapped is True
                and t.validated is True
                and t.invalidated is False
                and t.validated_by == g.user.osm_username
                and not t.self_validated
            )

            user_project_invalidated_tasks_list = [
                task
                for task in all_project_tasks
                if task.mapped is True
                and task.validated is False
                and task.invalidated is True
                and task.validated_by == g.user.osm_username
            ]
            # Split-aware count for display
            user_project_invalidated_tasks = self._count_tasks_split_aware(
                all_project_tasks,
                lambda t: t.mapped is True
                and t.validated is False
                and t.invalidated is True
                and t.validated_by == g.user.osm_username
            )

            # Count self-validated tasks for warning display (split-aware)
            self_validated_count = self._count_tasks_split_aware(
                all_project_tasks,
                lambda t: t.validated is True
                and t.validated_by == g.user.osm_username
                and t.self_validated is True
            )

            # Calculate earnings using split-aware payment calculation
            user_mapping_earnings = sum(
                self._calculate_task_payment(task, is_mapping=True)
                for task in user_project_tasks
                if task.validated is True and not task.self_validated
            )
            user_validator_earnings = sum(
                self._calculate_task_payment(task, is_mapping=False)
                for task in user_project_validated_tasks_list
            )
            user_invalidator_earnings = sum(
                self._calculate_task_payment(task, is_mapping=False)
                for task in user_project_invalidated_tasks_list
            )
            user_project_earnings = (
                user_mapping_earnings
                + user_validator_earnings
                + user_invalidator_earnings
            )

            org_active_projects.append(
                {
                    "id": project.id,
                    "name": project.name,
                    "visibility": project.visibility,
                    "max_payment": project.max_payment,
                    "payment_due": project.payment_due,
                    "total_payout": project.total_payout,
                    "validation_rate_per_task": project.validation_rate_per_task,  # noqa: E501
                    "mapping_rate_per_task": project.mapping_rate_per_task,
                    "max_editors": project.max_editors,
                    "total_editors": project.total_editors,
                    "max_validators": project.max_validators,
                    "total_validators": project.total_validators,
                    "total_tasks": project.total_tasks,
                    "url": project.url,
                    "difficulty": project.difficulty,
                    "tasks_mapped": user_project_mapped_tasks,
                    "tasks approved": user_project_approved_tasks,
                    "tasks unapproved": user_project_unapproved_tasks,
                    "tasks_validated": user_project_validated_tasks,
                    "tasks_invalidated": user_project_invalidated_tasks,
                    "self_validated_count": self_validated_count,
                    "user_earnings": user_project_earnings,
                    "status": project.status,
                }
            )
        for project in user_available_projects:
            org_inactive_projects.append(
                {
                    "id": project.id,
                    "name": project.name,
                    "visibility": project.visibility,
                    "max_payment": project.max_payment,
                    "payment_due": project.payment_due,
                    "total_payout": project.total_payout,
                    "validation_rate_per_task": project.validation_rate_per_task,  # noqa: E501
                    "mapping_rate_per_task": project.mapping_rate_per_task,
                    "max_editors": project.max_editors,
                    "total_editors": project.total_editors,
                    "max_validators": project.max_validators,
                    "total_validators": project.total_validators,
                    "total_tasks": project.total_tasks,
                    "url": project.url,
                    "difficulty": project.difficulty,
                    # "tasks_mapped": user_project_mapped_tasks,
                    # "tasks approved": user_project_approved_tasks,
                    # "tasks unapproved": user_project_unapproved_tasks,
                    # "tasks_validated": user_project_validated_tasks,
                    # "tasks_invalidated": user_project_invalidated_tasks,
                    # "user_earnings":user_project_earnings,
                    "status": project.status,
                }
            )

        # Projects where user validated tasks but is not assigned
        for project in unassigned_validation_projects:
            all_project_tasks = Task.query.filter_by(project_id=project.id).all()

            # Only count tasks validated by this user (no mapping stats since unassigned)
            user_project_validated_tasks = len(
                [
                    task
                    for task in all_project_tasks
                    if task.validated is True
                    and task.validated_by == g.user.osm_username
                    and not task.self_validated
                ]
            )
            user_project_invalidated_tasks = len(
                [
                    task
                    for task in all_project_tasks
                    if task.invalidated is True
                    and task.validated_by == g.user.osm_username
                ]
            )
            # Count self-validated tasks for warning
            self_validated_count = len(
                [
                    task
                    for task in all_project_tasks
                    if task.validated is True
                    and task.validated_by == g.user.osm_username
                    and task.self_validated is True
                ]
            )

            user_validator_earnings = sum(
                self._calculate_task_payment(task, is_mapping=False)
                for task in all_project_tasks
                if task.validated is True
                and task.validated_by == g.user.osm_username
                and not task.self_validated
            )
            user_invalidator_earnings = sum(
                self._calculate_task_payment(task, is_mapping=False)
                for task in all_project_tasks
                if task.invalidated is True
                and task.validated_by == g.user.osm_username
            )
            user_project_earnings = user_validator_earnings + user_invalidator_earnings

            unassigned_projects_with_validations.append(
                {
                    "id": project.id,
                    "name": project.name,
                    "visibility": project.visibility,
                    "max_payment": project.max_payment,
                    "payment_due": project.payment_due,
                    "total_payout": project.total_payout,
                    "validation_rate_per_task": project.validation_rate_per_task,
                    "mapping_rate_per_task": project.mapping_rate_per_task,
                    "max_editors": project.max_editors,
                    "total_editors": project.total_editors,
                    "max_validators": project.max_validators,
                    "total_validators": project.total_validators,
                    "total_tasks": project.total_tasks,
                    "url": project.url,
                    "difficulty": project.difficulty,
                    "tasks_mapped": 0,  # Not assigned, so no mapping
                    "tasks approved": 0,
                    "tasks unapproved": 0,
                    "tasks_validated": user_project_validated_tasks,
                    "tasks_invalidated": user_project_invalidated_tasks,
                    "self_validated_count": self_validated_count,
                    "user_earnings": user_project_earnings,
                    "status": project.status,
                    "unassigned": True,  # Flag for frontend
                }
            )

        return {
            "org_active_projects": org_active_projects,
            "org_inactive_projects": org_inactive_projects,
            "unassigned_validation_projects": unassigned_projects_with_validations,
            "message": "Projects found",
            "status": 200,
        }
