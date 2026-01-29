#!/usr/bin/env python3
"""
Training API endpoints for Mikro.

Handles training module management operations.
"""

from flask.views import MethodView
from flask import g, request

from ..utils import requires_admin
from ..database import (
    Training,
    TrainingCompleted,
    TrainingQuestion,
    TrainingQuestionAnswer,
)


class TrainingAPI(MethodView):
    """Training module management API endpoints."""

    def post(self, path: str):
        if path == "create_training":
            return self.create_training()
        elif path == "modify_training":
            return self.modify_training()
        elif path == "update_training":
            return self.update_training()
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
            "questions",
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
        questions = request.json["questions"]
        try:
            new_training = Training.create(
                title=request.json["title"],
                org_id=g.user.org_id,
                point_value=request.json["point_value"],
                difficulty=request.json["difficulty"],
                training_url=request.json["training_url"],
                training_type=request.json["training_type"],
            )
            for question in questions:
                new_training_question = TrainingQuestion.create(
                    training_id=new_training.id, question=question["question"]
                )
                new_training_correct = TrainingQuestionAnswer.create(
                    training_id=new_training.id,
                    training_question_id=new_training_question.id,
                    value=True,
                    answer=question["correct"],
                )
                for incorrect in question["incorrect"]:
                    new_training_incorrect = TrainingQuestionAnswer.create(
                        training_id=new_training.id,
                        training_question_id=new_training_question.id,
                        value=False,
                        answer=incorrect["answer"],
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

    @requires_admin
    def update_training(self):
        """Update training metadata (title, url, points, difficulty)."""
        if not g:
            return {"message": "User not found", "status": 304}

        training_id = request.json.get("training_id")
        if not training_id:
            return {"message": "training_id required", "status": 400}

        target_training = Training.query.filter_by(
            id=training_id, org_id=g.user.org_id
        ).first()
        if not target_training:
            return {"message": f"Training {training_id} not found", "status": 404}

        # Update only the fields that are provided
        if request.json.get("title"):
            target_training.update(title=request.json.get("title"))
        if request.json.get("training_url"):
            target_training.update(training_url=request.json.get("training_url"))
        if request.json.get("point_value") is not None:
            target_training.update(point_value=request.json.get("point_value"))
        if request.json.get("difficulty"):
            target_training.update(difficulty=request.json.get("difficulty"))

        return {"message": "Training updated", "status": 200}

    @requires_admin
    def modify_training(self):
        # Check if user is authenticated
        if not g:
            return {"message": "User not found", "status": 304}
        required_args = [
            "title",
            "questions",
            "point_value",
            "difficulty",
            "training_url",
            "training_type",
        ]
        missing_args = [
            arg for arg in required_args if arg not in request.json
        ]
        if missing_args:
            print("MISSING ARG")
            response = {
                "message": f"Missing required argument(s): {', '.join(missing_args)}",  # noqa: E501
                "status": 400,
            }
            print(response)
            return response
        questions = request.json["questions"]
        print(questions)
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
            point_value=request.json.get("point_value"),
            difficulty=request.json.get("difficulty"),
            training_url=request.json.get("training_url"),
            training_type=request.json.get("training_type"),
        )
        target_training_questions = TrainingQuestion.query.filter_by(
            training_id=target_training.id
        ).all()
        for question in target_training_questions:
            # print(question.question)
            target_question_answers = TrainingQuestionAnswer.query.filter_by(
                training_question_id=question.id,
                training_id=target_training.id,
            ).all()
            for answer in target_question_answers:

                answer.delete(soft=False)
            question.delete(soft=False)

        for question in questions:
            print(question)
            new_training_question = TrainingQuestion.create(
                training_id=target_training.id, question=question["question"]
            )
            new_training_correct = TrainingQuestionAnswer.create(
                training_id=target_training.id,
                training_question_id=new_training_question.id,
                value=True,
                answer=question["correct"],
            )
            for incorrect in question["incorrect"]:
                print(incorrect)
                new_training_incorrect = TrainingQuestionAnswer.create(
                    training_id=target_training.id,
                    training_question_id=new_training_question.id,
                    value=False,
                    answer=incorrect,
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
            target_training_questions = TrainingQuestion.query.filter_by(
                training_id=target_training.id
            ).all()
            target_training_answers = TrainingQuestionAnswer.query.filter_by(
                training_id=target_training.id
            ).all()
            for question, answer in zip(
                target_training_questions, target_training_answers
            ):
                question.delete(soft=False)
            target_training.delete(soft=False)
            response["message"] = "Training %s deleted" % (training_id)
            response["status"] = 200
            return response

    def complete_training(self):
        if not g:
            return {"message": "User Not Found", "status": 304}
        training_id = request.json.get("training_id")
        if not training_id:
            return {"message": "Training ID required", "status": 400}
        target_training = Training.query.filter_by(id=training_id).first()
        if not target_training:
            return {"message": "Training not found", "status": 400}
        completion_exists = TrainingCompleted.query.filter_by(
            training_id=training_id, user_id=g.user.id
        ).first()
        if completion_exists:
            return {"message": "Training already completed", "status": 200}
        TrainingCompleted.create(training_id=training_id, user_id=g.user.id)
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
        formatted_mapping_trainings = [
            self.format_training(training) for training in mapping_trainings
        ]
        formatted_validation_trainings = [
            self.format_training(training) for training in validation_trainings
        ]
        formatted_project_trainings = [
            self.format_training(training) for training in project_trainings
        ]
        user_completed_trainings = [
            self.format_training(training) for training in completed_trainings
        ]
        return {
            # Keys match what frontend expects
            "mapping_trainings": formatted_mapping_trainings,
            "validation_trainings": formatted_validation_trainings,
            "project_trainings": formatted_project_trainings,
            "user_completed_trainings": user_completed_trainings,
            "status": 200,
        }

    def format_training(self, training):
        questions = []
        training_questions = TrainingQuestion.query.filter_by(
            training_id=training.id
        ).all()
        for question in training_questions:
            all_answers = TrainingQuestionAnswer.query.filter_by(
                training_question_id=question.id,
                training_id=training.id,
            ).all()
            answers = [
                {
                    "id": answer.id,
                    "answer": answer.answer,
                    "correct": answer.value,
                }
                for answer in all_answers
            ]
            question_obj = {
                "id": question.id,
                "question": question.question,
                "answers": answers,
            }
            questions.append(question_obj)

        return {
            "id": training.id,
            "title": training.title,
            "point_value": training.point_value,
            "difficulty": training.difficulty,
            "training_url": training.training_url,
            "training_type": training.training_type,
            "questions": questions,
        }
