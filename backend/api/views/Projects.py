from ..utils import requires_admin
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
from flask_jwt_extended import (
    jwt_required,
)


class ProjectAPI(MethodView):
    @jwt_required()
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
        elif path == "update_project":
            return self.update_project()
        elif path == "fetch_admin_dash_stats":
            return self.fetch_admin_dash_stats()
        elif path == "fetch_user_dash_stats":
            return self.fetch_user_dash_stats()
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
        response = {}
        # Check if user is authenticated
        if not g:
            response["message"] = "User not found"
            response["status"] = 304
            return response
        # Check if required data is provided
        url = request.json.get("url")
        rateType = request.json.get("rate_type")
        rate = float(request.json.get("rate"))
        max_editors = request.json.get("max_editors")
        visibility = request.json.get("visibility")
        required_args = [
            "url",
            "rate_type",
            "rate",
            "max_editors",
            "visibility",
        ]
        for arg in required_args:
            if not request.json.get(arg):
                return {"message": f"{arg} required", "status": 400}
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
        tm3StatsUrl = (
            "https://tm3.kaart.com/api/v1/stats/project/%s" % project_id
        )
        tm4StatsUrl = (
            "https://tasks.kaart.com/api/v2/projects/%s/" % project_id
        )
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
            rate = float(rate)
            calculation = rate * totalTasks

        elif rateType is False:
            rate = float(rate)
            rate = rate / totalTasks
            calculation = rate

        # Create new project
        if rate >= 0.01:
            Project.create(
                id=project_id,
                org_id=g.user.org_id,
                name=project_name,
                total_tasks=totalTasks,
                max_payment=float(calculation),
                url=url,
                rate_per_task=rate,
                max_editors=max_editors,
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
        if not g:
            response["message"] = "User not found"
            response["status"] = 304
            return response
        # Check if required data is provided
        project_id = request.json.get("project_id")
        difficulty = request.json.get("difficulty")
        rate_type = request.json.get("rate_type")
        rate = float(request.json.get("rate"))
        max_editors = request.json.get("max_editors")
        visibility = request.json.get("visibility")
        project_status = request.json.get("project_status")
        required_args = ["difficulty", "rate", "max_editors", "project_id"]
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
        if rate != 0:
            if rate_type is True:
                rate = float(rate)
                calculation = rate * target_project.total_tasks
            elif rate_type is False:
                rate = float(rate)
                rate = rate / target_project.total_tasks
                calculation = rate

            target_project.update(
                rate_per_task=rate, max_payment=float(calculation)
            )
        target_project.update(
            visibility=visibility, difficulty=difficulty, status=project_status
        )
        if max_editors and max_editors != 0:
            target_project.update(
                max_editors=max_editors,
            )
        # Put logic here to process remaining payouts or whatever else before deletion  # noqa: E501
        response["status"] = 200
        return response

    @requires_admin
    def delete_project(self):
        response = {}
        # Check if user is authenticated
        if not g:
            response["message"] = "User not found"
            response["status"] = 304
            return response
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
        response = {}
        # Check if user is authenticated
        if not g:
            response["message"] = "User not found"
            response["status"] = 304
            return response
        url = request.json.get("url")
        rate_type = request.json.get("rate_type")
        if not rate_type:
            rate_type = False
        rate = float(request.json.get("rate"))
        project_id = request.json.get("project_id")
        required_args = ["rate"]
        # Check required inputs
        for arg in required_args:
            if not request.json.get(arg):
                return {"message": f"{arg} required", "status": 400}
        if not url:
            if not project_id:
                return {"message": "url or project_id required", "status": 400}
        # Determine stats API URL
        if project_id is not None:
            # Fetch project data
            project = Project.query.filter_by(id=project_id).first()
            if not project:
                return {"message": "Project not found", "status": 400}
            if project.source == "tm3":
                statsAPI = (
                    f"https://tm3.kaart.com/api/v1/stats/project/{project_id}"
                )
            else:
                statsAPI = (
                    f"https://tasks.kaart.com/api/v2/projects/{project_id}/"
                )
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
                statsAPI = (
                    f"https://tm3.kaart.com/api/v1/stats/project/{project_id}"
                )
            else:
                statsAPI = (
                    f"https://tasks.kaart.com/api/v2/projects/{project_id}/"
                )
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
            rate = float(rate)
            dollars = int(rate)
            cents = int(rate % 1 * 100)
            dollarcents = dollars * 100 + cents
            projected_budget = dollarcents * total_tasks / 100
            return_text = f"${rate:.2f} x {total_tasks} Tasks = Projected Budget: ${projected_budget:.2f}"  # noqa: E501
            return {"calculation": return_text, "status": 200}
        elif rate_type is False:
            rate = float(rate)
            dollars = int(rate)
            cents = int(rate % 1 * 100)
            dollarcents = dollars * 100 + cents
            calculation = dollarcents / total_tasks
            if calculation <= 0.10:
                calculation /= 10
            else:
                calculation /= 100
            adjusted_budget = total_tasks / 100
            return_text = f"${rate:.2f} / {total_tasks} tasks =  ${calculation:.2f} per task."  # noqa: E501
            adjust_budget_text = (
                f"  - Recommended adjusted budget = ${adjusted_budget:.2f}"
            )
            if calculation < 0.01:
                return_text = f"${rate:.2f} / {total_tasks} tasks =   less than $0.01 per task."  # noqa: E501
                return_text += adjust_budget_text
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
                    "rate_per_task": project.rate_per_task,
                    "max_editors": project.max_editors,
                    "total_editors": project.total_editors,
                    "total_tasks": project.total_tasks,
                    "url": project.url,
                    "source": project.source,
                    "difficulty": project.difficulty,
                    "tasks_mapped": project.tasks_mapped,
                    "tasks_validated": project.tasks_validated,
                    "tasks_invalidated": project.tasks_invalidated,
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
                    "rate_per_task": project.rate_per_task,
                    "max_editors": project.max_editors,
                    "total_editors": project.total_editors,
                    "total_tasks": project.total_tasks,
                    "url": project.url,
                    "source": project.source,
                    "difficulty": project.difficulty,
                    "tasks_mapped": project.tasks_mapped,
                    "tasks_validated": project.tasks_validated,
                    "tasks_invalidated": project.tasks_invalidated,
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
        total_payable = sum(
            [
                user.payable_total
                for user in User.query.filter_by(org_id=g.user.org_id).all()
            ]
        )
        # Compute various statistics
        active_projects_count = sum(project.status for project in all_projects)
        inactive_projects_count = sum(
            not project.status for project in all_projects
        )
        completed_projects_count = sum(
            project.completed for project in all_projects
        )
        mapped_tasks_count = sum(
            task.mapped and not task.validated for task in all_tasks
        )
        validated_tasks_count = sum(
            task.mapped and task.validated for task in all_tasks
        )
        invalidated_tasks_count = sum(task.invalidated for task in all_tasks)
        all_requests_total = sum(
            request.amount_requested for request in all_requests
        )
        payouts_total = sum(payment.amount_paid for payment in all_payments)
        # Construct response dictionary
        response = {
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
        all_user_assignments_count = len(
            ProjectUser.query.filter_by(user_id=g.user.id).all()
        )
        all_user_assignment_ids = [
            relation.project_id
            for relation in ProjectUser.query.filter_by(
                user_id=g.user.id
            ).all()
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
            if task.mapped is True
            and task.validated is False
            and task.invalidated is False
        ]

        user_mapped_tasks_count = len(user_mapped_tasks)
        user_validated_tasks = [
            task
            for task in all_tasks
            if task.id in all_user_task_ids
            if task.mapped is True and task.validated is True
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
        payouts_total = sum(
            payment.amount_paid for payment in all_user_payments
        )
        # Construct response dictionary
        response = {
            "active_projects": all_user_assignments_count,
            "inactive_projects": active_projects_count
            - all_user_assignments_count,
            "completed_projects": completed_projects_count,
            "mapped_tasks": user_mapped_tasks_count,
            "validated_tasks": user_validated_tasks_count,
            "invalidated_tasks": user_invalidated_tasks_count,
            "payable_total": g.user.payable_total,
            "requests_total": all_requests_total,
            "payouts_total": payouts_total,
            "message": "Stats Fetched",
            "status": 200,
        }
        return response

    def fetch_user_projects(self):
        # Check if user is authenticated
        if not g:
            return {"message": "User not found", "status": 304}
        # Get all projects for the organization
        org_active_projects = []
        org_inactive_projects = []
        all_user_project_ids = [
            relation.project_id
            for relation in ProjectUser.query.filter_by(
                user_id=g.user.id
            ).all()
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
            org_active_projects.append(
                {
                    "id": project.id,
                    "name": project.name,
                    "visibility": project.visibility,
                    "max_payment": project.max_payment,
                    "payment_due": project.payment_due,
                    "total_payout": project.total_payout,
                    "rate_per_task": project.rate_per_task,
                    "max_editors": project.max_editors,
                    "total_editors": project.total_editors,
                    "total_tasks": project.total_tasks,
                    "url": project.url,
                    "source": project.source,
                    "difficulty": project.difficulty,
                    "tasks_mapped": project.tasks_mapped,
                    "tasks_validated": project.tasks_validated,
                    "tasks_invalidated": project.tasks_invalidated,
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
                    "rate_per_task": project.rate_per_task,
                    "max_editors": project.max_editors,
                    "total_editors": project.total_editors,
                    "total_tasks": project.total_tasks,
                    "url": project.url,
                    "source": project.source,
                    "difficulty": project.difficulty,
                    "tasks_mapped": project.tasks_mapped,
                    "tasks_validated": project.tasks_validated,
                    "tasks_invalidated": project.tasks_invalidated,
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
        if not g:
            return {"message": "User not found", "status": 304}
        project_id = request.json.get("project_id")
        if not project_id:
            return {"message": "project_id required", "status": 400}
        ProjectUser.create(project_id=project_id, user_id=g.user.id)
        target_project = Project.query.filter_by(id=project_id).first()
        if not target_project:
            return {
                "message": "project %s not found" % (project_id),
                "status": 400,
            }
        new_editor_count = target_project.total_editors + 1
        target_project.update(total_editors=new_editor_count)
        return {
            "message": "User %s has joined project %s"
            % (g.user.id, project_id),
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
