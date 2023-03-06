from ..utils import requires_admin
import requests
import re
from ..database import Project,Task,PayRequests,Payments,ProjectUser,UserTasks,User
from flask.views import MethodView
from flask import g, request
from flask_jwt_extended import (
    jwt_required,
)
from ..static_variables import TASKING_KEY

class TaskAPI(MethodView):
    @jwt_required()
    def post(self, path: str):
        if path == "get_validated_TM4_tasks":
            return self.get_validated_TM4_tasks()
        elif path == "get_invalidated_TM4_tasks":
            return self.get_invalidated_TM4_tasks()
        elif path == "get_mapped_TM4_tasks":
            return self.get_mapped_TM4_tasks()
        elif path == "TM4_payment_call":
            return self.TM4_payment_call()
        return {
            "message": "Only /project/{fetch_users,fetch_user_projects} is permitted with GET",  # noqa: E501
        }, 405





    def get_validated_TM4_tasks(data, projectID):
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
                        task_id=task, project_id=projectID.id, deleted=False
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
                            oldValidatedTotal = int(mapper.total_tasks_validated)
                            newTasksValidated = oldValidatedTotal + 1
                            oldAwaitingPayment = int(
                                mapper.awaiting_payment
                            )  # noqa: E501
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
                            mapper.update(
                                awaiting_payment=currentAwaitingPayment,
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
                        task_id=task, project_id=projectID.id, deleted=False
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


    # --------------------------------GET ALL MIKRO INVALIDATED TASKS FROM TM4------  # noqa: E501


    def get_invalidated_TM4_tasks(data, projectID):
        users = User.query.all()
        usernames = [x.osm_username for x in users]
        contributions = data["userContributions"]
        for c in contributions:
            validator_exists = User.query.filter_by(
                osm_username=c["username"]
            ).first()
            if validator_exists is not None:
                for task in c["invalidatedTasks"]:
                    task_exists = Task.query.filter_by(
                        task_id=task, project_id=projectID.id, deleted=False
                    ).first()
                    if task_exists is not None:
                        if (
                            task_exists.mapped_by in usernames
                            and not task_exists.validated
                            and task_exists.validated_by != "tasks - INVALIDATED"
                        ):
                            mapper = task_exists.mapped_by
                            mapper = User.query.filter_by(
                                osm_username=mapper
                            ).first()
                            task_exists.update(
                                validated_by="tasks - INVALIDATED",
                                validated=False,
                            )
                            oldInvalidatedTotal = int(mapper.total_tasks_validated)
                            newTasksInvalidated = oldInvalidatedTotal + 1
                            mapper.update(
                                total_tasks_invalidated=newTasksInvalidated,
                            )
                        else:
                            pass
                    else:
                        pass
        return {"response": "complete"}




    def TM4_payment_call(projectID):
        payload = {}
        # returnObj = {}
        headers = {
            "Authorization": "Bearer TVRBek5ERTBNalEuWVFzUXJRLm5HX0ZuaURJb2tlRjNzV1g4cXA2TExBOUVMRQ==",  # noqa: E501
            "Accept-Language": "en-US",
        }
        TM4url = (
            "https://tasks.kaart.com/api/v2/projects/%s/contributions/"  # noqa: E501
            % (projectID.project)
        )
        response = requests.request("GET", TM4url, headers=headers, data=payload)
        if response.ok:
            data = response.json()
            get_mapped_TM4_tasks(data, projectID)
            # get_validated_TM4_tasks(data, projectID)
            return {"response": "updated!"}


    def get_mapped_TM4_tasks(data, projectID):
        newMappedTasks = []
        users = User.query.all()
        usernames = [x.osm_username for x in users]
        for contributor in data["userContributions"]:
            if contributor["username"] in usernames:
                mapper = User.query.filter_by(
                    osm_username=contributor["username"]
                ).first()
                for task in contributor["mappedTasks"]:
                    task_exists = Task.query.filter_by(
                        id=task,
                        project_id=projectID.id,
                        mapped_by=mapper.osm_username,
                    ).first()
                    if task_exists is None:
                        newMappedTasks.append(task)
                        Task.create(
                            id=task,
                            project_id=projectID.id,
                            amount=projectID.per_task_amount,
                            paid_out=False,
                            mapped_by=contributor["username"],
                            validated_by="",
                            validated=False,
                        )
                        mapper.update(
                            total_tasks_mapped=mapper.total_tasks_mapped + 1
                        )
                    else:
                        pass
        return {"response": "complete"}




