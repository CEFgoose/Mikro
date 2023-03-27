from ..utils import requires_admin
import requests
from ..database import (
    Project,
    Task,
    ProjectUser,
    UserTasks,
    User,
)
from flask.views import MethodView
from flask import g
from flask_jwt_extended import (
    jwt_required,
)


class TaskAPI(MethodView):
    @jwt_required()
    def post(self, path: str):
        if path == "update_user_tasks":
            return self.update_user_tasks()
        elif path == "admin_update_all_user_tasks":
            return self.admin_update_all_user_tasks()
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
        for c in contributions:
            validator_exists = User.query.filter_by(
                osm_username=c["username"]
            ).first()
            if validator_exists is not None:
                for task in c["validatedTasks"]:
                    task_exists = Task.query.filter_by(
                        id=task, project_id=projectID
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
                            task_exists.update(
                                validated_by=c["username"],
                                validated=True,
                            )
                            oldValidatedTotal = int(
                                mapper.total_tasks_validated
                            )
                            newTasksValidated = oldValidatedTotal + 1
                            oldAwaitingPayment = float(
                                mapper.payable_total
                            )  # noqa: E501
                            newAwaitingPayment = task_exists.rate
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
                                payable_total=currentAwaitingPayment,
                                total_tasks_validated=newTasksValidated,
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
                            )
        return {"response": "complete"}

    def get_invalidated_TM4_tasks(self, project_id, user):
        user_tasks = UserTasks.query.filter_by(user_id=user.id).all()
        user_task_ids = [relation.task_id for relation in user_tasks]
        headers = {
            "Authorization": "Bearer TVRBME1qSTBNek0uWkFkbWJ3LnA0aFZZVXZ0bl9RZWRJTVpaaHpTcE5vbVRMZw==",  # noqa: E501
            "Accept-Language": "en-US",
        }
        for task_id in user_task_ids:
            target_user = User.query.filter_by(id=user.id).first()
            target_task = Task.query.filter_by(id=task_id).first()
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
                if taskData["taskStatus"] == "BADIMAGERY":
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
            else:
                return {"request": "tm3 tasks mapped call failed"}
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
                        id=task,
                        project_id=projectID,
                        mapped_by=mapper.osm_username,
                    ).first()
                    if task_exists is None:
                        newMappedTasks.append(task)
                        new_task = Task.create(
                            id=task,
                            org_id=g.user.org_id,
                            project_id=projectID,
                            rate=target_project.rate_per_task,
                            paid_out=False,
                            mapped=True,
                            mapped_by=contributor["username"],
                            validated_by="",
                            validated=False,
                        )
                        UserTasks.create(
                            user_id=g.user.id, task_id=new_task.id
                        )
                        mapper.update(
                            total_tasks_mapped=mapper.total_tasks_mapped + 1
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
