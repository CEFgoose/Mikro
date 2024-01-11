from ..utils import requires_admin, jwt_verification
import requests
import re
from ..database import (
    Project,
    Task,
    PayRequests,
    Payments,
    ProjectUser,
    UserTasks,
    User,
)
from flask.views import MethodView
from flask import g, request

from datetime import datetime, timedelta
from sqlalchemy import func


class ProjectAPI(MethodView):
    @jwt_verification
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
        rateType = request.json.get("rate_type")
        mapping_rate = float(request.json.get("mapping_rate"))
        validation_rate = float(request.json.get("validation_rate"))
        max_editors = request.json.get("max_editors")
        max_validators = request.json.get("max_validators")
        visibility = request.json.get("visibility")

        # Extract project ID from URL
        m = re.match(r"^.*\/([0-9]+)$", url)
        if not m:
            return {
                "message": "Cannot get URL from project info",
                "status": 400,
            }
        project_id = m.group(1)
        # Determine which version of the API to use
        TMregex = re.search(r"(?<=\//)(.*?)(?=\.)", url)
        APImatch = TMregex.group(1)
        tm3StatsUrl = "https://tm3.kaart.com/api/v1/stats/project/%s" % project_id
        tm4StatsUrl = "https://tasks.kaart.com/api/v2/projects/%s/" % project_id
        statsAPI = tm3StatsUrl if APImatch == "tm3" else tm4StatsUrl
        # Check if project already exists
        project_exists = Project.query.filter_by(
            id=project_id,
        ).first()
        if project_exists:
            return {"message": "Project already exists", "status": 400}
        # Fetch project data
        tm_fetch = requests.request("GET", statsAPI)
        if not tm_fetch.ok:
            return {"message": "Failed to fetch project data", "status": 400}
        # Calculate payment rate and rate based on rate type
        project_data = tm_fetch.json()
        project_name = project_data["projectInfo"]["name"]
        if APImatch == "tm3":
            totalTasks = project_data["totalTasks"]
        else:
            totalTasks = len(project_data["tasks"]["features"])

        if rateType is True:
            mapping_rate = float(mapping_rate)
            validation_rate = float(validation_rate)
            calculation = mapping_rate + validation_rate * totalTasks
        # elif rateType is False:
        #     rate = float(rate)
        #     rate = rate / totalTasks
        #     calculation = rate
        # Create new project
        if mapping_rate >= 0.01 and validation_rate >= 0.01:
            Project.create(
                id=project_id,
                org_id=g.user.org_id,
                name=project_name,
                total_tasks=totalTasks,
                max_payment=float(calculation),
                url=url,
                validation_rate_per_task=validation_rate,
                mapping_rate_per_task=mapping_rate,
                max_editors=max_editors,
                max_validators=max_validators,
                source=APImatch,
                visibility=visibility,
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
        # Check if user is authenticated
        if not hasattr(g, "user") or not g.user:
            return {"message": "Missing user info", "status": 304}
        url = request.json.get("url")
        rate_type = bool(request.json.get("rate_type"))
        mapping_rate = request.json.get("mapping_rate")
        validation_rate = request.json.get("validation_rate")
        project_id = request.json.get("project_id")
        required_args = ["mapping_rate", "validation_rate", "project_id", "url"]
        # Check required inputs
        for arg in required_args:
            if not request.json.get(arg):
                return {"message": f"{arg} required", "status": 400}
        # Determine stats API URL
        if project_id is not None:
            # Fetch project data
            project = Project.query.filter_by(id=project_id).first()
            if not project:
                return {"message": "Project not found", "status": 400}
            if project.source == "tm3":
                statsAPI = f"https://tm3.kaart.com/api/v1/stats/project/{project_id}"
            else:
                statsAPI = f"https://tasks.kaart.com/api/v2/projects/{project_id}/"
            matcher = project.source
        else:
            # Extract project ID and determine stats API URL
            m = re.match(r"^.*\/([0-9]+)$", url)
            if not m:
                return {
                    "message": "Cannot get URL from project info",
                    "status": 400,
                }
            project_id = m.group(1)
            APImatch = re.search(r"(?<=\//)(.*?)(?=\.)", url)

            if APImatch.group(1) == "tm3":
                statsAPI = f"https://tm3.kaart.com/api/v1/stats/project/{project_id}"
            else:
                statsAPI = f"https://tasks.kaart.com/api/v2/projects/{project_id}/"
            matcher = APImatch.group(1)
        # Fetch project data
        tm_fetch = requests.get(statsAPI)
        if not tm_fetch.ok:
            return {"message": "Failed to fetch project data", "status": 500}
        json_data = tm_fetch.json()
        # Calculate payment
        total_tasks = (
            json_data["totalTasks"]
            if matcher == "tm3"
            else len(json_data["tasks"]["features"])
        )
        if rate_type is True:
            mapping_rate = float(mapping_rate)
            mapping_dollars = int(mapping_rate)
            mapping_cents = int(mapping_rate % 1 * 100)
            mapping_dollarcents = mapping_dollars * 100 + mapping_cents
            projected_mapping_budget = mapping_dollarcents * total_tasks / 100

            validation_rate = float(validation_rate)
            validation_dollars = int(validation_rate)
            validation_cents = int(validation_rate % 1 * 100)
            validation_dollarcents = validation_dollars * 100 + validation_cents
            projected_validation_budget = validation_dollarcents * total_tasks / 100

            total_projected_budget = (
                projected_mapping_budget + projected_validation_budget
            )
            return_text = f"${mapping_rate:.2f}(Mapping) + ${validation_rate:.2f}(Validation)  x {total_tasks} Tasks = Projected Budget: ${total_projected_budget:.2f}"  # noqa: E501

            return {"calculation": return_text, "status": 200}

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
                    "source": project.source,
                    "difficulty": project.difficulty,
                    "total_mapped": project.tasks_mapped,
                    "total_validated": project.tasks_validated,
                    "total_invalidated": project.tasks_invalidated,
                    "status": project.status,
                }
            )
        for project in inactive_projects:
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
                    "source": project.source,
                    "difficulty": project.difficulty,
                    "total_mapped": project.tasks_mapped,
                    "total_validated": project.tasks_validated,
                    "total_invalidated": project.tasks_invalidated,
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
        mapped_tasks_count = sum(
            task.mapped and not task.validated and not task.invalidated
            for task in all_tasks
        )
        validated_tasks_count = sum(
            task.mapped and task.validated for task in all_tasks
        )
        invalidated_tasks_count = sum(task.invalidated for task in all_tasks)
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
        if not g:
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
        user_mapped_tasks = [
            task
            for task in all_tasks
            if task.id in all_user_task_ids
            and task.mapped is True
            and task.validated is False
            and task.invalidated is False
        ]
        user_mapped_tasks_count = len(user_mapped_tasks)
        user_validated_tasks = [
            task
            for task in all_tasks
            if task.id in all_user_task_ids
            and task.mapped is True
            and task.validated is True
        ]
        user_validated_tasks_count = len(user_validated_tasks)
        user_invalidated_tasks_count = len(
            [
                task
                for task in all_tasks
                if task.id in all_user_task_ids
                and task.mapped is True
                and task.invalidated is True
            ]
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
            "active_projects": all_user_assignments_count,
            "inactive_projects": active_projects_count - all_user_assignments_count,
            "completed_projects": completed_projects_count,
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

        user_mapped_tasks = [
            task
            for task in all_tasks
            if task.id in all_user_task_ids
            and task.mapped is True
            and task.validated is False
            and task.invalidated is False
        ]
        user_mapped_tasks_count = len(user_mapped_tasks)

        user_validated_tasks = [
            task
            for task in all_tasks
            if task.id in all_user_task_ids
            and task.mapped is True
            and task.validated is True
        ]
        user_validated_tasks_count = len(user_validated_tasks)
        user_invalidated_tasks_count = len(
            [
                task
                for task in all_tasks
                if task.id in all_user_task_ids
                if task.mapped is True and task.invalidated is True
            ]
        )

        validator_validated_tasks = len(
            [
                task
                for task in all_tasks
                if task.id in all_user_task_ids
                and task.mapped is True
                and task.validated is True
                and task.validated_by == g.user.osm_username
            ]
        )

        validator_invalidated_tasks = len(
            [
                task
                for task in all_tasks
                if task.id in all_user_task_ids
                and task.mapped is True
                and task.invalidated is True
                and task.validated_by == g.user.osm_username
            ]
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
        response = {
            "active_projects": all_user_assignments_count,
            "inactive_projects": active_projects_count - all_user_assignments_count,
            "completed_projects": completed_projects_count,
            "mapped_tasks": user_mapped_tasks_count,
            "validated_tasks": user_validated_tasks_count,
            "invalidated_tasks": user_invalidated_tasks_count,
            "validator_validated": validator_validated_tasks,
            "validator_invalidated": validator_invalidated_tasks,
            "mapping_payable_total": g.user.mapping_payable_total,
            "validation_payable_total": g.user.validation_payable_total,
            "payable_total": payable_total,
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
        # Get all projects for the organization
        user_projects = []

        all_user_project_ids = [
            relation.project_id
            for relation in ProjectUser.query.filter_by(user_id=g.user.id).all()
        ]
        user_joined_projects = [
            project
            for project in Project.query.filter_by(
                org_id=g.user.org_id, status=True
            ).all()
            if project.id in all_user_project_ids
        ]
        user_available_projects = [
            project
            for project in Project.query.filter_by(
                org_id=g.user.org_id, status=True
            ).all()
            if project.id not in all_user_project_ids
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
            user_project_mapped_tasks = len(
                [
                    task
                    for task in user_project_tasks
                    if task.mapped is True
                    and task.validated is False
                    and task.invalidated is False
                ]
            )
            user_project_approved_tasks = len(
                [
                    task
                    for task in user_project_tasks
                    if task.mapped is True
                    and task.validated is True
                    and task.invalidated is False
                ]
            )
            user_project_unapproved_tasks = len(
                [
                    task
                    for task in user_project_tasks
                    if task.mapped is True
                    and task.validated is False
                    and task.invalidated is True
                ]
            )
            user_mapping_earnings = (
                project.mapping_rate_per_task * user_project_approved_tasks
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
                    "source": project.source,
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
        for project in user_available_projects:
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
                    "source": project.source,
                    "difficulty": project.difficulty,
                    "total_mapped": project.tasks_mapped,
                    "total_validated": project.tasks_validated,
                    "total_invalidated": project.tasks_invalidated,
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

    def user_join_project(self):
        # Check if user is authenticated
        if not g.user:
            return {"message": "User not found", "status": 304}
        project_id = request.json.get("project_id")
        if not project_id:
            return {"message": "project_id required", "status": 400}
        target_project = Project.query.filter_by(id=project_id).first()
        if not target_project:
            return {
                "message": "project %s not found" % (project_id),
                "status": 400,
            }
        existing_user_project_relation = ProjectUser.query.filter_by(
            project_id=project_id, user_id=g.user.id
        ).first()

        if existing_user_project_relation:
            return {
                "message": "User %s has already joined project %s"
                % (g.user.id, project_id),
                "status": 400,
            }
        ProjectUser.create(project_id=project_id, user_id=g.user.id)
        count = target_project.total_editors + 1
        target_project.update(total_editors=count)
        return {
            "message": "User %s has joined project %s" % (g.user.id, project_id),
            "status": 200,
        }

    def user_leave_project(self):
        # Check if user is authenticated
        if not g:
            return {"message": "User not found", "status": 304}
        project_id = request.json.get("project_id")
        if not project_id:
            return {"message": "project_id required", "status": 400}
        target_relation = ProjectUser.query.filter_by(
            project_id=project_id, user_id=g.user.id
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
            "message": "User %s has left project %s" % (g.user.id, project_id),
            "status": 200,
        }

    def fetch_validator_projects(self):
        # Check if user is authenticated
        if not g:
            return {"message": "User not found", "status": 304}

        # Get all projects for the validator
        org_active_projects = []
        org_inactive_projects = []
        all_user_project_ids = [
            relation.project_id
            for relation in ProjectUser.query.filter_by(user_id=g.user.id).all()
        ]
        user_joined_projects = [
            project
            for project in Project.query.filter_by(
                org_id=g.user.org_id, status=True
            ).all()
            if project.id in all_user_project_ids
        ]
        user_available_projects = [
            project
            for project in Project.query.filter_by(
                org_id=g.user.org_id, status=True
            ).all()
            if project.id not in all_user_project_ids
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
            user_project_mapped_tasks = len(
                [
                    task
                    for task in user_project_tasks
                    if task.mapped is True
                    and task.validated is False
                    and task.invalidated is False
                ]
            )
            user_project_approved_tasks = len(
                [
                    task
                    for task in user_project_tasks
                    if task.mapped is True
                    and task.validated is True
                    and task.invalidated is False
                ]
            )
            user_project_unapproved_tasks = len(
                [
                    task
                    for task in user_project_tasks
                    if task.mapped is True
                    and task.validated is False
                    and task.invalidated is True
                ]
            )
            user_project_validated_tasks = len(
                [
                    task
                    for task in all_project_tasks
                    if task.mapped is True
                    and task.validated is True
                    and task.invalidated is False
                    and task.validated_by == g.user.osm_username
                ]
            )
            user_project_invalidated_tasks = len(
                [
                    task
                    for task in all_project_tasks
                    if task.mapped is True
                    and task.validated is False
                    and task.invalidated is True
                    and task.validated_by == g.user.osm_username
                ]
            )
            user_mapping_earnings = (
                project.mapping_rate_per_task * user_project_approved_tasks
            )
            user_validator_earnings = (
                project.validation_rate_per_task * user_project_validated_tasks
            )
            user_invalidator_earnings = (
                project.validation_rate_per_task * user_project_invalidated_tasks
            )
            user_project_earnings = (
                user_mapping_earnings
                + user_validator_earnings
                + user_invalidator_earnings
            )
            print(user_project_earnings)
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
                    "source": project.source,
                    "difficulty": project.difficulty,
                    "tasks_mapped": user_project_mapped_tasks,
                    "tasks approved": user_project_approved_tasks,
                    "tasks unapproved": user_project_unapproved_tasks,
                    "tasks_validated": user_project_validated_tasks,
                    "tasks_invalidated": user_project_invalidated_tasks,
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
                    "source": project.source,
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
        return {
            "org_active_projects": org_active_projects,
            "org_inactive_projects": org_inactive_projects,
            "message": "Projects found",
            "status": 200,
        }
