from ..utils import requires_admin
from ..database import Training
from flask.views import MethodView
from flask import g, request
from flask_jwt_extended import (
    jwt_required,
)


class TrainingAPI(MethodView):
    @jwt_required()
    def post(self, path: str):
        if path == "create_training":
            return self.create_training()
        elif path == "modify_training":
            return self.modify_training()
        elif path == "fetch_org_trainings":
            return self.fetch_org_trainings()
        elif path == "delete_training":
            return self.delete_training()
        return {
            "message": "Only /project/{fetch_users,fetch_user_projects} is permitted with GET",  # noqa: E501
        }, 405

    @requires_admin
    def create_training(self):
        response = {}
        # Check if user is authenticated
        if not g:
            response["message"] = "User not found"
            response["status"] = 304
            return response
        # Check if required data is provided
        title = request.json.get("title")

        question1 = request.json.get("question1")
        question2 = request.json.get("question2")
        question3 = request.json.get("question3")

        answer1 = request.json.get("answer1")
        answer2 = request.json.get("answer2")
        answer3 = request.json.get("answer3")

        incorrect1_1 = request.json.get("incorrect1_1")
        incorrect1_2 = request.json.get("incorrect1_2")
        incorrect1_3 = request.json.get("incorrect1_3")

        incorrect2_1 = request.json.get("incorrect2_1")
        incorrect2_2 = request.json.get("incorrect2_2")
        incorrect2_3 = request.json.get("incorrect2_3")

        incorrect3_1 = request.json.get("incorrect3_1")
        incorrect3_2 = request.json.get("incorrect3_2")
        incorrect3_3 = request.json.get("incorrect3_3")

        point_value = request.json.get("point_value")
        difficulty = request.json.get("difficulty")
        training_url = request.json.get("training_url")
        training_type = request.json.get("training_type")

        required_args = [
            "title",
            "question1",
            "question2",
            "question3",
            "answer1",
            "answer2",
            "answer3",
            "incorrect1_1",
            "incorrect1_2",
            "incorrect1_3",
            "incorrect2_1",
            "incorrect2_2",
            "incorrect2_3",
            "incorrect3_1",
            "incorrect3_2",
            "incorrect3_3",
            "point_value",
            "difficulty",
            "training_url",
            "training_type",
        ]
        for arg in required_args:
            if not request.json.get(arg):
                response["message"] = f"{arg} required"
                response["status"] = 400
                return response

        Training.create(
            title=title,
            org_id=g.user.org_id,
            question_1=question1,
            question_2=question2,
            question_3=question3,
            answer_1=answer1,
            answer_2=answer2,
            answer_3=answer3,
            incorrect1_1=incorrect1_1,
            incorrect1_2=incorrect1_2,
            incorrect1_3=incorrect1_3,
            incorrect2_1=incorrect2_1,
            incorrect2_2=incorrect2_2,
            incorrect2_3=incorrect2_3,
            incorrect3_1=incorrect3_1,
            incorrect3_2=incorrect3_2,
            incorrect3_3=incorrect3_3,
            point_value=point_value,
            difficulty=difficulty,
            training_url=training_url,
            training_type=training_type,
        )
        response["message"] = "New Training Created"
        response["status"] = 200
        return response

    @requires_admin
    def modify_training(self):
        response = {}
        # Check if user is authenticated
        if not g:
            response["message"] = "User not found"
            response["status"] = 304
            return response
        # Check if required data is provided
        title = request.json.get("title")
        training_id = request.json.get("training_id")
        question1 = request.json.get("question1")
        question2 = request.json.get("question2")
        question3 = request.json.get("question3")

        answer1 = request.json.get("answer1")
        answer2 = request.json.get("answer2")
        answer3 = request.json.get("answer3")

        incorrect1_1 = request.json.get("incorrect1_1")
        incorrect1_2 = request.json.get("incorrect1_2")
        incorrect1_3 = request.json.get("incorrect1_3")

        incorrect2_1 = request.json.get("incorrect2_1")
        incorrect2_2 = request.json.get("incorrect2_2")
        incorrect2_3 = request.json.get("incorrect2_3")

        incorrect3_1 = request.json.get("incorrect3_1")
        incorrect3_2 = request.json.get("incorrect3_2")
        incorrect3_3 = request.json.get("incorrect3_3")

        point_value = request.json.get("point_value")
        difficulty = request.json.get("difficulty")
        training_url = request.json.get("training_url")
        training_type = request.json.get("training_type")

        required_args = [
            "training_id",
            "title",
            "question1",
            "question2",
            "question3",
            "answer1",
            "answer2",
            "answer3",
            "incorrect1_1",
            "incorrect1_2",
            "incorrect1_3",
            "incorrect2_1",
            "incorrect2_2",
            "incorrect2_3",
            "incorrect3_1",
            "incorrect3_2",
            "incorrect3_3",
            "point_value",
            "difficulty",
            "training_url",
            "training_type",
        ]
        for arg in required_args:
            if not request.json.get(arg):
                response["message"] = f"{arg} required"
                response["status"] = 400
                return response
        target_training = Training.query.filter_by(id=training_id).first()
        if not target_training:
            response["message"] = "Training %s not found" % (training_id)
            response["status"] = 400
            return response
        target_training.update(
            title=title,
            question_1=question1,
            question_2=question2,
            question_3=question3,
            answer_1=answer1,
            answer_2=answer2,
            answer_3=answer3,
            incorrect1_1=incorrect1_1,
            incorrect1_2=incorrect1_2,
            incorrect1_3=incorrect1_3,
            incorrect2_1=incorrect2_1,
            incorrect2_2=incorrect2_2,
            incorrect2_3=incorrect2_3,
            incorrect3_1=incorrect3_1,
            incorrect3_2=incorrect3_2,
            incorrect3_3=incorrect3_3,
            point_value=point_value,
            difficulty=difficulty,
            training_url=training_url,
            training_type=training_type,
        )
        response["message"] = "Training %s has been updated" % (training_id)
        response["status"] = 200
        return response

    @requires_admin
    def delete_training(self):
        response = {}
        # Check if user is authenticated
        if not g:
            response["message"] = "User not found"
            response["status"] = 304
            return response
        # Check if required data is provided
        training_id = request.json.get("training_id")
        if not training_id:
            return {"message": "training_id required", "status": 400}
        target_training = Training.query.filter_by(
            org_id=g.user.org_id, id=training_id
        ).first()
        if not target_training:
            response["message"] = "Training %s not found" % (training_id)
            response["status"] = 400
            return response
        else:
            # Put logic here to process remaining payouts or whatever else before deletion  # noqa: E501
            target_training.delete(soft=False)
            response["message"] = "Training %s deleted" % (training_id)
            response["status"] = 200
            return response

    def fetch_org_trainings(self):
        # Check if user is authenticated
        if not g:
            return {"message": "User Not Found", "status": 304}

        # Get all projects for the organization
        org_id = g.user.org_id
        mapping_trainings = Training.query.filter_by(
            org_id=org_id, training_type="Mapping"
        ).all()
        validation_trainings = Training.query.filter_by(
            org_id=org_id, training_type="Validation"
        ).all()
        project_trainings = Training.query.filter_by(
            org_id=org_id, training_type="Project"
        ).all()

        # Prepare response
        org_mapping_trainings = [
            self.format_training(training) for training in mapping_trainings
        ]
        org_validation_trainings = [
            self.format_training(training) for training in validation_trainings
        ]
        org_project_trainings = [
            self.format_training(training) for training in project_trainings
        ]

        return {
            "org_mapping_trainings": org_mapping_trainings,
            "org_validation_trainings": org_validation_trainings,
            "org_project_trainings": org_project_trainings,
            "status": 200,
        }

    def format_training(self, training):
        return {
            "id": training.id,
            "title": training.title,
            "question1": training.question_1,
            "question2": training.question_2,
            "question3": training.question_3,
            "answer1": training.answer_1,
            "answer2": training.answer_2,
            "answer3": training.answer_3,
            "incorrect1_1": training.incorrect1_1,
            "incorrect1_2": training.incorrect1_2,
            "incorrect1_3": training.incorrect1_3,
            "incorrect2_1": training.incorrect2_1,
            "incorrect2_2": training.incorrect2_2,
            "incorrect2_3": training.incorrect2_3,
            "incorrect3_1": training.incorrect3_1,
            "incorrect3_2": training.incorrect3_2,
            "incorrect3_3": training.incorrect3_3,
            "point_value": training.point_value,
            "difficulty": training.difficulty,
            "training_url": training.training_url,
            "training_type": training.training_type,
        }
