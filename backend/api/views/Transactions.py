#!/usr/bin/env python3
"""
Transaction API endpoints for Mikro.

Handles payment and transaction operations.
"""

from flask.views import MethodView
from flask import g, request

from ..utils import requires_admin
from ..database import User, PayRequests, Payments, UserTasks, Task


class TransactionAPI(MethodView):
    """Payment and transaction management API endpoints."""

    def post(self, path: str):
        if path == "fetch_org_transactions":
            return self.fetch_org_transactions()
        if path == "fetch_user_transactions":
            return self.fetch_user_transactions()
        elif path == "create_transaction":
            return self.create_transaction()
        elif path == "delete_transaction":
            return self.delete_transaction()
        elif path == "process_payment_request":
            return self.process_payment_request()
        elif path == "fetch_user_payable":
            return self.fetch_user_payable()
        elif path == "submit_payment_request":
            return self.submit_payment_request()
        return {
            "message": "Only /project/{fetch_users,fetch_user_projects} is permitted with GET",  # noqa: E501
        }, 405

    @requires_admin
    def fetch_org_transactions(self):
        # Check if user is logged in
        if not g.user:
            return {"message": "User not found", "status": 304}
        # Get all payment requests and payments for the user's organization
        org_payment_requests = PayRequests.query.filter_by(
            org_id=g.user.org_id
        ).all()
        org_payments_made = Payments.query.filter_by(
            org_id=g.user.org_id
        ).all()
        # Create a list of dictionaries containing payment request information
        requests = [
            {
                "id": request.id,
                "amount_requested": request.amount_requested,
                "user": request.user_name,
                "osm_username": request.osm_username,
                "user_id": request.user_id,
                "payment_email": request.payment_email,
                "task_ids": request.task_ids,
                "date_requested": request.date_requested,
                "notes": request.notes,
            }
            for request in org_payment_requests
        ]
        # Create a list of dictionaries containing payment information
        payments = [
            {
                "id": payment.id,
                "payoneer_id": payment.payoneer_id,
                "amount_paid": payment.amount_paid,
                "user": payment.user_name,
                "osm_username": payment.osm_username,
                "user_id": payment.user_id,
                "payment_email": payment.payment_email,
                "task_ids": payment.task_ids,
                "date_paid": payment.date_paid,
                "notes": payment.notes,
            }
            for payment in org_payments_made
        ]
        # Return the list of payment requests and payments along with a success message  # noqa: E501
        return {
            "message": "Payments and requests found",  # noqa: E501
            "requests": requests,
            "payments": payments,
            "status": 200,
        }

    def fetch_user_transactions(self):
        # Check if user is logged in
        if not g.user:
            return {"message": "User not found", "status": 304}
        # Get all payment requests and payments for the user's organization
        org_payment_requests = PayRequests.query.filter_by(
            org_id=g.user.org_id, user_id=g.user.id
        ).all()
        org_payments_made = Payments.query.filter_by(
            org_id=g.user.org_id, user_id=g.user.id
        ).all()
        # Create a list of dictionaries containing payment request information
        requests = [
            {
                "id": request.id,
                "amount_requested": request.amount_requested,
                "user": request.user_name,
                "user_id": request.user_id,
                "payment_email": request.payment_email,
                "task_ids": request.task_ids,
                "date_requested": request.date_requested,
                "notes": request.notes,
            }
            for request in org_payment_requests
        ]
        # Create a list of dictionaries containing payment information
        payments = [
            {
                "id": payment.id,
                "payoneer_id": payment.payoneer_id,
                "amount_paid": payment.amount_paid,
                "user": payment.user_name,
                "user_id": payment.user_id,
                "payment_email": payment.payment_email,
                "task_ids": payment.task_ids,
                "date_paid": payment.date_paid,
                "notes": payment.notes,
            }
            for payment in org_payments_made
        ]
        # Return the list of payment requests and payments along with a success message  # noqa: E501
        return {
            "message": "Payments and requests found",  # noqa: E501
            "requests": requests,
            "payments": payments,
            "status": 200,
        }

    @requires_admin
    def create_transaction(self):
        # Check if user is authenticated
        if not g.user:
            return {"message": "User not found", "status": 304}
        # Get required fields from request payload
        user_id = request.json.get("user_id")
        task_ids = request.json.get("task_ids")
        amount = request.json.get("amount")
        transaction_type = request.json.get("transaction_type")
        # Validate required fields
        if not all([user_id, task_ids, amount, transaction_type]):
            return {"message": "All fields are required", "status": 400}
        target_user = User.query.filter_by(
            org_id=g.user.org_id, id=user_id
        ).first()
        if not target_user:
            return {"message": "User %s not found" % (user_id), "status": 400}
        # Create username from first_name and last_name
        user_name = "%s %s" % (
            target_user.first_name.capitalize(),
            target_user.last_name.capitalize(),
        )
        payment_email = target_user.payment_email
        # Split task_ids by comma and convert to int list
        task_ids = [int(id) for id in task_ids.split(",")]
        # Create transaction based on type
        if transaction_type == "request":
            amount_requested = float(amount)
            PayRequests.create(
                org_id=g.user.org_id,
                amount_requested=amount_requested,
                user_name=user_name,
                user_id=user_id,
                payment_email=payment_email,
                task_ids=task_ids,
            )
        return {"message": "Transaction created", "status": 200}

    @requires_admin
    def delete_transaction(self):
        # Check if user is authenticated
        if not g.user:
            return {"message": "User not found", "status": 304}
        # Get transaction_id from request payload
        transaction_id = request.json.get("transaction_id")
        if not transaction_id:
            return {"message": "transaction_id required", "status": 400}
        # Get transaction_type from request payload
        transaction_type = request.json.get("transaction_type")
        if not transaction_type:
            return {"message": "transaction_type required", "status": 400}
        # Delete transaction based on type and ID
        if transaction_type == "request":
            target_request = PayRequests.query.filter_by(
                id=transaction_id
            ).first()
            if not target_request:
                return {
                    "message": f"Request {transaction_id} not found",
                    "status": 400,
                }
            target_request.delete(soft=False)
            return {
                "message": f"Request {transaction_id} deleted",
                "status": 200,
            }
        else:
            target_payment = Payments.query.filter_by(
                id=transaction_id
            ).first()
            if not target_payment:
                return {
                    "message": f"Payment {transaction_id} not found",
                    "status": 400,
                }
            target_payment.delete(soft=False)
            return {
                "message": f"Payment {transaction_id} deleted",
                "status": 200,
            }

    @requires_admin
    def process_payment_request(self):
        if not g.user:
            return {"message": "User not found", "status": 304}
        # Get required fields from request payload
        request_id = request.json.get("request_id")
        user_id = request.json.get("user_id")
        task_ids = request.json.get("task_ids")
        request_amount = request.json.get("request_amount")
        payoneer_id = request.json.get("payoneer_id")
        notes = request.json.get("notes")
        # Validate required fields
        if not all(
            [task_ids, user_id, request_amount, payoneer_id, request_id]
        ):
            return {"message": "All fields are required", "status": 400}
        print(task_ids)
        # task_ids = str(task_ids).split()
        target_user = User.query.filter_by(
            org_id=g.user.org_id, id=user_id
        ).first()
        user_name = "%s %s" % (
            target_user.first_name.capitalize(),
            target_user.last_name.capitalize(),
        )
        payment_email = target_user.payment_email
        target_request = PayRequests.query.filter_by(
            org_id=g.user.org_id, id=request_id
        ).first()
        if not target_request:
            return {"message": "Payment Request %s not found", "status": 400}
        target_request.delete(soft=False)
        new_payment = Payments.create(
            user_name=user_name,
            osm_username=g.user.osm_username,
            user_id=user_id,
            org_id=g.user.org_id,
            amount_paid=request_amount,
            payoneer_id=payoneer_id,
            payment_email=payment_email,
            task_ids=task_ids,
        )
        if notes:
            new_payment.update(notes=notes)
        return {
            "message": f"Payment Request {request_id} has been processed",
            "status": 200,
        }

    def submit_payment_request(self):
        if not g.user:
            return {"message": "User not found", "status": 304}
        notes = request.json.get("notes")
        user_task_ids = [
            relation.task_id
            for relation in UserTasks.query.filter_by(user_id=g.user.id).all()
        ]

        user_validated_task_ids = [
            task.id
            for task in Task.query.filter_by(
                org_id=g.user.org_id, validated=True, mapped=True
            ).all()
            if task.id in user_task_ids
        ]
        validator_validated_task_ids = [
            task.id
            for task in Task.query.filter_by(
                org_id=g.user.org_id,
                validated=True,
                mapped=True,
                validated_by=g.user.osm_username,
            ).all()
        ]
        validator_invalidated_task_ids = [
            task.id
            for task in Task.query.filter_by(
                org_id=g.user.org_id,
                invalidated=True,
                mapped=True,
                validated_by=g.user.osm_username,
            ).all()
        ]
        print(user_task_ids, user_validated_task_ids)
        user_name = "%s %s" % (
            g.user.first_name.capitalize(),
            g.user.last_name.capitalize(),
        )
        if g.user.role == "validator":
            request_amount = (
                g.user.mapping_payable_total + g.user.validation_payable_total
            )
            request_task_ids = (
                user_validated_task_ids
                + validator_validated_task_ids
                + validator_invalidated_task_ids
            )
        else:
            request_amount = g.user.mapping_payable_total
            request_task_ids = user_validated_task_ids
        new_request = PayRequests.create(
            org_id=g.user.org_id,
            amount_requested=request_amount,
            user_id=g.user.id,
            user_name=user_name,
            osm_username=g.user.osm_username,
            payment_email=g.user.payment_email,
            task_ids=request_task_ids,
        )
        if notes:
            new_request.update(notes=notes)
        g.user.update(
            requested_total=request_amount,
            mapping_payable_total=0.0,
            validation_payable_total=0.0,
        )
        return {
            "message": f"Payment Request {new_request.id} has been submitted",
            "status": 200,
        }

    def fetch_user_payable(self):
        if not g.user:
            return {"message": "User not found", "status": 304}
        target_user = User.query.filter_by(id=g.user.id).first()
        if not target_user:
            return {"message": "User not found", "status": 400}
        payable_total = (
            target_user.mapping_payable_total
            + target_user.validation_payable_total
            + target_user.checklist_payable_total
        )
        mapping_payable_total = target_user.mapping_payable_total
        validation_payable_total = target_user.validation_payable_total
        checklist_payable_total = target_user.checklist_payable_total
        return {
            "message": "payable total fetched",
            "checklist_earnings": checklist_payable_total,
            "mapping_earnings": mapping_payable_total,
            "validation_earnings": validation_payable_total,
            "payable_total": payable_total,
            "status": 200,
        }
