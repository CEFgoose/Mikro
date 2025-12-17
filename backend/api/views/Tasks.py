#!/usr/bin/env python3
"""
Task API endpoints for Mikro.

Handles task synchronization with TM4.
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
        if path == "update_user_tasks":
            return self.update_user_tasks()
        elif path == "admin_update_all_user_tasks":
            return self.admin_update_all_user_tasks()
        elif path == "fetch_external_validations":
            return self.admin_fetch_external_validations()
        elif path == "update_task":
            return self.update_task()
        return {
            "message": "Only /project/{fetch_users,fetch_user_projects} is permitted with GET",  # noqa: E501
        }, 405

    def getMappedTM3Tasks(self, inMapped, projectID):
        outMapped = []
        users = User.query.all()  # noqa: E501
        usernames = [x.osm_username for x in users]
        mappedObj = [
            x for x in inMapped["mappedTasks"] if x["username"] in usernames
        ]
        if len(mappedObj) > 0:
            for i in mappedObj:
                user = User.query.filter_by(osm_username=i["username"]).first()
                mappedIDs = [x for x in i["tasksMapped"]]
                for j in mappedIDs:
                    task_exists = Task.query.filter_by(
                        task_id=j,
                        project_id=projectID.id,
                        deleted=False,
                        mapped_by=user.osm_username,
                    ).first()
                    if task_exists is None:
                        outMapped.append(j)
                        Task.create(
                            task_id=j,
                            project_id=projectID.id,
                            amount=projectID.per_task_amount,
                            paid_out=False,
                            mapped_by=user.osm_username,
                            validated_by="TM3",
                            validated=False,
                            deleted=False,
                        )
                        user.update(
                            total_tasks_mapped=user.total_tasks_mapped + 1
                        )
                    else:
                        pass
        return {"response": "Updated!"}

    def getValidatedTM3Tasks(self, inStatus, projectID):
        outValidated = []
        validatedIDs = [
            x["properties"]["taskId"]
            for x in inStatus["features"]
            if x["properties"]["taskStatus"] == "VALIDATED"
        ]  # noqa: E501
        users = User.query.all()
        usernames = [x.osm_username for x in users]
        for i in validatedIDs:
            task_exists = Task.query.filter_by(
                task_id=i,
                project_id=projectID.id,
            ).first()
            if task_exists is not None:
                if (
                    task_exists.mapped_by in usernames
                    and not task_exists.validated
                ):
                    user = User.query.filter_by(
                        osm_username=task_exists.mapped_by
                    ).first()
                    outValidated.append(i)
                    task_exists.update(validated_by="TM3", validated=True)
                    oldAwaitingPayment = int(user.awaiting_payment)
                    newAwaitingPayment = task_exists.amount
                    if (
                        oldAwaitingPayment is not None
                        and newAwaitingPayment is not None
                        and newAwaitingPayment != 0
                    ):
                        currentAwaitingPayment = (
                            oldAwaitingPayment + newAwaitingPayment
                        )
                    else:
                        currentAwaitingPayment = oldAwaitingPayment
                    user.update(
                        awaiting_payment=currentAwaitingPayment,
                        total_tasks_validated=user.total_tasks_validated + 1,
                    )
                else:
                    pass
            else:
                pass
        return {"response": "complete"}

    def getInvalidatedTM3Tasks(self, inStatus, projectID):
        validatedIDs = [
            x["properties"]["taskId"]
            for x in inStatus["features"]
            if x["properties"]["taskStatus"] == "INVALIDATED"
        ]  # noqa: E501
        users = User.query.all()
        usernames = [x.osm_username for x in users]
        for i in validatedIDs:
            task_exists = Task.query.filter_by(
                task_id=i,
                project_id=projectID.id,
            ).first()
            if task_exists is not None:
                if (
                    task_exists.mapped_by in usernames
                    and not task_exists.validated
                    and task_exists.validated_by != "TM3 - INVALID"
                ):
                    user = User.query.filter_by(
                        osm_username=task_exists.mapped_by
                    ).first()
                    task_exists.update(
                        validated_by="TM3 - INVALID", validated=False
                    )
                    user.update(
                        total_tasks_invalidated=user.total_tasks_invalidated
                        + 1,
                    )
                else:
                    pass
            else:
                pass
        return {"response": "complete"}

    def get_validated_TM4_tasks(self, data, projectID):
        users = User.query.all()
        usernames = [x.osm_username for x in users]
        contributions = data["userContributions"]
        tempValidators = []
        target_project = Project.query.filter_by(id=projectID).first()
        for c in contributions:
            validator_exists = User.query.filter_by(
                osm_username=c["username"]
            ).first()
            if validator_exists is not None:
                for task in c["validatedTasks"]:
                    task_exists = Task.query.filter_by(
                        task_id=task, project_id=projectID
                    ).first()
                    if task_exists is not None:
                        if (
                            task_exists.mapped_by in usernames
                            and not task_exists.validated
                        ):
                            mapper = task_exists.mapped_by
                            mapper = User.query.filter_by(
                                osm_username=mapper
                            ).first()
                            if task_exists.invalidated is True:
                                mapper.update(
                                    total_tasks_validated=mapper.total_tasks_validated  # noqa: E501
                                    - 1,
                                )
                                validator_exists.update(
                                    validator_tasks_invalidated=validator_exists.validator_tasks_invalidated  # noqa: E501
                                    - 1
                                )
                                target_project.update(
                                    tasks_invalidated=target_project.tasks_invalidated  # noqa: E501
                                    - 1
                                )
                            task_exists.update(
                                validated_by=c["username"],
                                unknown_validator=False,
                                validated=True,
                                invalidated=False,
                            )
                            oldValidatedTotal = int(
                                mapper.total_tasks_validated
                            )
                            newTasksValidated = oldValidatedTotal + 1
                            oldAwaitingPayment = mapper.mapping_payable_total
                            newAwaitingPayment = task_exists.mapping_rate
                            if (
                                oldAwaitingPayment is not None
                                and newAwaitingPayment is not None
                                and newAwaitingPayment != 0
                            ):
                                currentAwaitingPayment = (
                                    oldAwaitingPayment + newAwaitingPayment
                                )
                            else:
                                currentAwaitingPayment = oldAwaitingPayment
                            mapper.update(
                                mapping_payable_total=currentAwaitingPayment,
                                total_tasks_validated=newTasksValidated,
                            )

                            oldValidationsPayment = float(
                                validator_exists.validation_payable_total
                            )  # noqa: E501
                            newValidationsPayment = task_exists.validation_rate
                            if (
                                oldValidationsPayment is not None
                                and newValidationsPayment is not None
                                and newValidationsPayment != 0
                            ):
                                currentValidationsPayment = (
                                    oldValidationsPayment
                                    + newValidationsPayment
                                )
                            else:
                                currentValidationsPayment = (
                                    oldValidationsPayment
                                )

                            validator_exists.update(
                                validator_tasks_validated=validator_exists.validator_tasks_validated  # noqa: E501
                                + 1,
                                validation_payable_total=currentValidationsPayment,  # noqa: E501
                            )

                            target_project.update(
                                tasks_validated=target_project.tasks_validated
                                + 1
                            )
                        else:
                            pass
                    else:
                        pass
            else:
                tempValidators.append(c["username"])
                for task in c["validatedTasks"]:
                    task_exists = Task.query.filter_by(
                        id=task, project_id=projectID
                    ).first()
                    if task_exists is not None:
                        if (
                            task_exists.mapped_by in usernames
                            and not task_exists.validated
                            and task_exists.validated_by is None
                        ):
                            mapper = task_exists.mapped_by
                            mapper = User.query.filter_by(
                                osm_username=mapper
                            ).first()
                            task_exists.update(
                                validated_by=c["username"],
                                validated=False,
                                unknown_validator=True,
                            )
        return {"response": "complete"}

    def get_invalidated_TM4_tasks(self, project_id, user):
        user_tasks = UserTasks.query.filter_by(user_id=user.id).all()
        user_task_ids = [relation.task_id for relation in user_tasks]
        headers = {
            "Authorization": "Bearer TVRBME1qSTBNek0uWkFkbWJ3LnA0aFZZVXZ0bl9RZWRJTVpaaHpTcE5vbVRMZw==",  # noqa: E501
            "Accept-Language": "en-US",
        }
        target_project = Project.query.filter_by(id=project_id).first()
        for task_id in user_task_ids:
            target_user = User.query.filter_by(id=user.id).first()
            target_task = Task.query.filter_by(task_id=task_id).first()
            if target_task and not target_task.invalidated:
                invalid_tasks_url = (
                    "https://tasks.kaart.com/api/v2/projects/%s/tasks/%s/"
                    % (project_id, task_id)
                )
                tasksInvalidatedCall = requests.request(
                    "GET", invalid_tasks_url, headers=headers
                )
                if tasksInvalidatedCall.ok:
                    taskData = tasksInvalidatedCall.json()
                    invalidated = []
                    if taskData["taskStatus"] == "INVALIDATED":
                        validator_exists = User.query.filter_by(
                            osm_username=taskData["taskHistory"][0]["actionBy"]
                        ).first()
                        if validator_exists:
                            validator_exists.update(
                                validator_tasks_invalidated=validator_exists.validator_tasks_invalidated  # noqa: E501
                                + 1,
                                validation_payable_total=validator_exists.validation_payable_total  # noqa: E501
                                + target_task.validation_rate,
                            )
                            target_task.update(
                                validated_by=validator_exists.osm_username
                            )

                        else:
                            validator_name = taskData["taskHistory"][0][
                                "actionBy"
                            ]
                            target_task.update(validated_by=validator_name)
                        invalidated.append(task_id)

                        target_task.update(
                            invalidated=True,
                            validated=False,
                        )
                        invalidated_count = target_user.total_tasks_invalidated
                        invalidated_count += 1
                        target_user.update(
                            total_tasks_invalidated=invalidated_count
                        )
                        target_project.update(
                            tasks_invalidated=target_project.tasks_invalidated
                            + 1
                        )
                else:
                    return {"request": "tm4 tasks invalidated call failed"}
        return {"response": "complete"}

    def get_mapped_TM4_tasks(self, data, projectID):
        newMappedTasks = []
        users = User.query.all()
        usernames = [x.osm_username for x in users]
        target_project = Project.query.filter_by(id=projectID).first()
        for contributor in data["userContributions"]:
            if contributor["username"] in usernames:
                mapper = User.query.filter_by(
                    osm_username=contributor["username"]
                ).first()
                for task in contributor["mappedTasks"]:
                    task_exists = Task.query.filter_by(
                        task_id=task,
                        project_id=projectID,
                        mapped_by=mapper.osm_username,
                    ).first()
                    if task_exists is None:
                        newMappedTasks.append(task)
                        new_task = Task.create(
                            task_id=task,
                            org_id=g.user.org_id,
                            project_id=projectID,
                            mapping_rate=target_project.mapping_rate_per_task,
                            validation_rate=target_project.validation_rate_per_task,  # noqa: E501
                            paid_out=False,
                            mapped=True,
                            mapped_by=contributor["username"],
                            validated_by="",
                            validated=False,
                        )
                        UserTasks.create(
                            user_id=mapper.id, task_id=new_task.id
                        )
                        mapper.update(
                            total_tasks_mapped=mapper.total_tasks_mapped + 1
                        )
                        target_project.update(
                            tasks_mapped=target_project.tasks_mapped + 1
                        )
                    else:
                        pass
        return {"message": "complete"}

    def TM3PaymentCall(self, project_id):
        headers = {
            "Authorization": "Bearer TVRBek5ERTBNalEuWVFzUXJRLm5HX0ZuaURJb2tlRjNzV1g4cXA2TExBOUVMRQ==",  # noqa: E501
            "Accept-Language": "en-US",
        }
        TM3tasksMapped = (
            "https://tm3.kaart.com/api/v1/project/%s/mapped-tasks-by-user"  # noqa: E501
            % (project_id)
        )
        TM3tasksStatus = (
            "https://tm3.kaart.com/api/v1/project/%s/tasks"  # noqa: E501
            % (project_id)
        )
        tasksMappedCall = requests.request(
            "GET", TM3tasksMapped, headers=headers
        )
        if tasksMappedCall.ok:
            taskData = tasksMappedCall.json()
        else:
            return {"request": "tm3 tasks mapped call failed"}
        tasksStatusCall = requests.request(
            "GET", TM3tasksStatus, headers=headers
        )
        if tasksStatusCall.ok:
            taskStatusData = tasksStatusCall.json()
        else:
            return {"request": "tm3 tasks status call failed"}
        self.getMappedTM3Tasks(taskData, project_id)
        self.getValidatedTM3Tasks(taskStatusData, project_id)
        self.getInvalidatedTM3Tasks(taskStatusData, project_id)
        return {"response": "complete"}

    def TM4_payment_call(self, project_id, user):
        payload = {}
        headers = {
            "Authorization": "Bearer TVRBek5ERTBNalEuWVFzUXJRLm5HX0ZuaURJb2tlRjNzV1g4cXA2TExBOUVMRQ==",  # noqa: E501
            "Accept-Language": "en-US",
        }
        TM4url = (
            "https://tasks.kaart.com/api/v2/projects/%s/contributions/"  # noqa: E501
            % (project_id)
        )
        response = requests.request(
            "GET", TM4url, headers=headers, data=payload
        )
        if response.ok:
            data = response.json()
            self.get_mapped_TM4_tasks(data, project_id)
            self.get_validated_TM4_tasks(data, project_id)
            self.get_invalidated_TM4_tasks(project_id, user)
            return {"message": "updated!"}

    def update_user_tasks(self):
        # Check if user is authenticated
        if not g:
            return {"message": "User not found", "status": 304}
        user_project_ids = [
            relation.project_id
            for relation in ProjectUser.query.filter_by(
                user_id=g.user.id
            ).all()
        ]
        user_projects = [
            project
            for project in Project.query.filter_by(org_id=g.user.org_id).all()
            if project.id in user_project_ids
        ]
        user_tm4_project_ids = [
            project.id
            for project in user_projects
            if project.source == "tasks"
        ]
        user_tm3_project_ids = [
            project.id
            for project in user_projects
            if project.source != "tasks"
        ]
        for project_id in user_tm4_project_ids:
            self.TM4_payment_call(project_id, g.user)
        for project_id in user_tm3_project_ids:
            self.TM3PaymentCall(project_id)
        return {"message": "updated", "status": 200}

    @requires_admin
    def admin_update_all_user_tasks(self):
        # Check if user is authenticated
        if not g:
            return {"message": "User not found", "status": 304}
        org_users = User.query.filter_by(org_id=g.user.org_id).all()
        for user in org_users:
            user_project_ids = [
                relation.project_id
                for relation in ProjectUser.query.filter_by(
                    user_id=user.id
                ).all()
            ]
            user_projects = [
                project
                for project in Project.query.filter_by(
                    org_id=user.org_id
                ).all()
                if project.id in user_project_ids
            ]
            user_tm4_project_ids = [
                project.id
                for project in user_projects
                if project.source == "tasks"
            ]
            user_tm3_project_ids = [
                project.id
                for project in user_projects
                if project.source != "tasks"
            ]
            for project_id in user_tm4_project_ids:
                self.TM4_payment_call(project_id, user)
            for project_id in user_tm3_project_ids:
                self.TM3PaymentCall(project_id)
            return {"message": "updated", "status": 200}

    @requires_admin
    def admin_fetch_external_validations(self):
        response = {}
        # Check if user is authenticated
        if not g:
            return {"message": "User not found", "status": 304}
        unknown_validator_tasks = Task.query.filter_by(
            org_id=g.user.org_id, unknown_validator=True
        ).all()
        external_validations = []
        for task in unknown_validator_tasks:
            task_project = Project.query.filter_by(id=task.project_id).first()
            task_obj = {
                "id": task.id,
                "project_id": task.project_id,
                "project_name": task_project.name,
                "project_url": task_project.url,
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
        response["external_validations"] = external_validations
        response["status"] = 200
        return response

    @requires_admin
    def update_task(self):
        response = {}
        # Check if user is authenticated
        if not g:
            return {"message": "User not found", "status": 304}
        task_id = request.json.get("task_id")
        task_action = request.json.get("task_action")
        target_task = Task.query.filter_by(task_id=task_id).first()
        target_project = Project.query.filter_by(
            id=target_task.project_id
        ).first()
        target_mapper = User.query.filter_by(
            osm_username=target_task.mapped_by
        ).first()
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
                + target_task.mapping_rate,
            )
            target_project.update(
                tasks_validated=target_project.tasks_validated + 1
            )

        if task_action == "Invalidate":
            target_task.update(
                validated=False,
                invalidated=True,
                validated_by=g.user.osm_username,
                unknown_validator=False,
            )
            target_mapper.update(
                total_tasks_invalidated=target_mapper.total_tasks_invalidated
                + 1
            )
            target_project.update(
                tasks_validated=target_project.tasks_invalidated + 1
            )
        response["status"] = 200
        return response
