from ..utils import requires_admin
from ..database import Training, TrainingCompleted
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
        elif path == "fetch_user_trainings":
            return self.fetch_user_trainings()
        elif path == "delete_training":
            return self.delete_training()
        elif path == "complete_training":
            return self.complete_training()
        return {
            "message": "Only /project/{fetch_users,fetch_user_projects} is permitted with GET",  # noqa: E501
        }, 405

    @requires_admin
    def create_training(self):
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
        missing_args = [
            arg for arg in required_args if arg not in request.json
        ]
        if missing_args:
            response = {
                "message": f"Missing required argument(s): {', '.join(missing_args)}",  # noqa: E501
                "status": 400,
            }
            return response, 400
        try:
            Training.create(
                title=request.json["title"],
                org_id=g.user.org_id,
                question_1=request.json["question1"],
                question_2=request.json["question2"],
                question_3=request.json["question3"],
                answer_1=request.json["answer1"],
                answer_2=request.json["answer2"],
                answer_3=request.json["answer3"],
                incorrect1_1=request.json["incorrect1_1"],
                incorrect1_2=request.json["incorrect1_2"],
                incorrect1_3=request.json["incorrect1_3"],
                incorrect2_1=request.json["incorrect2_1"],
                incorrect2_2=request.json["incorrect2_2"],
                incorrect2_3=request.json["incorrect2_3"],
                incorrect3_1=request.json["incorrect3_1"],
                incorrect3_2=request.json["incorrect3_2"],
                incorrect3_3=request.json["incorrect3_3"],
                point_value=request.json["point_value"],
                difficulty=request.json["difficulty"],
                training_url=request.json["training_url"],
                training_type=request.json["training_type"],
            )
            response = {"message": "New Training Created", "status": 200}
            return response, 200
        except Exception as e:
            response = {
                "message": f"Failed to create training: {str(e)}",
                "status": 500,
            }
            return response, 500

    @requires_admin
    def modify_training(self):
        # Check if user is authenticated
        if not g:
            return {"message": "User not found", "status": 304}
        # Check if required data is provided
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
                return {"message": f"{arg} required", "status": 400}
        # Update training data
        training_id = request.json.get("training_id")
        target_training = Training.query.filter_by(id=training_id).first()
        if not target_training:
            return {
                "message": f"Training {training_id} not found",
                "status": 400,
            }
        target_training.update(
            title=request.json.get("title"),
            question_1=request.json.get("question1"),
            question_2=request.json.get("question2"),
            question_3=request.json.get("question3"),
            answer_1=request.json.get("answer1"),
            answer_2=request.json.get("answer2"),
            answer_3=request.json.get("answer3"),
            incorrect1_1=request.json.get("incorrect1_1"),
            incorrect1_2=request.json.get("incorrect1_2"),
            incorrect1_3=request.json.get("incorrect1_3"),
            incorrect2_1=request.json.get("incorrect2_1"),
            incorrect2_2=request.json.get("incorrect2_2"),
            incorrect2_3=request.json.get("incorrect2_3"),
            incorrect3_1=request.json.get("incorrect3_1"),
            incorrect3_2=request.json.get("incorrect3_2"),
            incorrect3_3=request.json.get("incorrect3_3"),
            point_value=request.json.get("point_value"),
            difficulty=request.json.get("difficulty"),
            training_url=request.json.get("training_url"),
            training_type=request.json.get("training_type"),
        )
        # Return response
        return {
            "message": f"Training {training_id} has been updated",
            "status": 200,
        }

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
            target_training.delete(soft=False)
            response["message"] = "Training %s deleted" % (training_id)
            response["status"] = 200
            return response

    @requires_admin
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

    def complete_training(self):
        # Check if user is authenticated
        if not g:
            return {"message": "User Not Found", "status": 304}
        # Get training ID from request data
        training_id = request.json.get("training_id")
        if not training_id:
            return {"message": "Training ID required", "status": 400}
        # Get target training and check if it exists
        target_training = Training.query.filter_by(id=training_id).first()
        if not target_training:
            return {"message": "Training not found", "status": 400}
        # Check if completion already exists for this user and training
        completion_exists = TrainingCompleted.query.filter_by(
            training_id=training_id, user_id=g.user.id
        ).first()
        if completion_exists:
            return {"message": "Training already completed", "status": 200}
        # Create completion record for user and training
        TrainingCompleted.create(training_id=training_id, user_id=g.user.id)
        # Update user's points based on training type
        if target_training.training_type == "Mapping":
            g.user.update(
                mapper_points=g.user.mapper_points
                + target_training.point_value
            )
            earned_points = g.user.mapper_points
        elif target_training.training_type == "Validation":
            g.user.update(
                validator_points=g.user.validator_points
                + target_training.point_value
            )
            earned_points = g.user.validator_points
        elif target_training.training_type == "Project":
            g.user.update(
                special_project_points=g.user.special_project_points
                + target_training.point_value
            )
            earned_points = g.user.special_project_points
        # Return response with training type, earned points, and completion status  # noqa: E501
        return {
            "training_type": target_training.training_type,
            "earned_points": earned_points,
            "message": "Training completed",
            "status": 200,
        }

    def fetch_user_trainings(self):
        # Check if user is authenticated
        if not g:
            return {"message": "User Not Found", "status": 304}
        # Get all projects for the organization
        org_id = g.user.org_id
        trainings_completed_ids = [
            completion.training_id
            for completion in TrainingCompleted.query.filter_by(
                user_id=g.user.id
            ).all()
        ]
        mapping_trainings = [
            training
            for training in Training.query.filter_by(
                org_id=org_id, training_type="Mapping"
            ).all()
            if training.id not in trainings_completed_ids
        ]
        validation_trainings = [
            training
            for training in Training.query.filter_by(
                org_id=org_id, training_type="Validation"
            ).all()
            if training.id not in trainings_completed_ids
        ]
        project_trainings = [
            training
            for training in Training.query.filter_by(
                org_id=org_id, training_type="Project"
            ).all()
            if training.id not in trainings_completed_ids
        ]
        completed_trainings = [
            training
            for training in Training.query.filter_by(org_id=org_id).all()
            if training.id in trainings_completed_ids
        ]
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
        user_completed_trainings = [
            self.format_training(training) for training in completed_trainings
        ]
        return {
            "org_mapping_trainings": org_mapping_trainings,
            "org_validation_trainings": org_validation_trainings,
            "org_project_trainings": org_project_trainings,
            "user_completed_trainings": user_completed_trainings,
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
