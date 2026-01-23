#!/usr/bin/env python3
"""
User API endpoints for Mikro.

Handles user management operations.
"""

from flask.views import MethodView
from flask import g, request, current_app

from ..utils import requires_admin
from ..database import User, ProjectUser


class UserAPI(MethodView):
    """User management API endpoints."""

    def post(self, path: str):
        if path == "fetch_user_role":
            return self.fetch_user_role()
        if path == "fetch_user_details" or path == "fetch_user_profile":
            return self.fetch_user_details()
        if path == "update_user_details" or path == "update_profile":
            return self.update_user_details()
        elif path == "assign_user":
            return self.assign_user()
        elif path == "unassign_user":
            return self.unassign_user()
        elif path == "invite_user":
            return self.invite_user()
        elif path == "fetch_users":
            return self.do_fetch_users()
        elif path == "fetch_project_users":
            return self.fetch_project_users()
        elif path == "remove_users":
            return self.do_remove_users()
        elif path == "modify_users":
            return self.do_modify_users()
        elif path == "first_login_update":
            return self.first_login_update()
        elif path == "reset_test_user_stats":
            return self.reset_test_user_stats()
        elif path == "import_users":
            return self.import_users()
        # elif path == "register_user":
        #     return self.register_user()
        return {
            "message": "Only /project/{fetch_users,fetch_user_projects} is permitted with GET",  # noqa: E501
        }, 405

    # DEPRECATED: Mass import - SSO has been replaced with Auth0
    # User registration is now handled directly through Auth0
    @requires_admin
    def import_users(self):
        """
        DEPRECATED: This method relied on the old Kaart SSO.
        User registration is now handled through Auth0.
        """
        return {
            "message": "User import via SSO is deprecated. Use Auth0 for user management.",
            "status": 501,
        }

    # FETCH USER ROLE ON LOGIN FOR UI RENDER
    def fetch_user_role(self):
        # initialize an empty dictionary to store the response
        response = {}
        # check if the user information is available in the global context
        if not g.user:
            response["message"] = "User not found"
            response["status"] = 304
            return response
        else:
            # extract the role, first name, and last name from the user information # noqa: E501
            role = g.user.role
            firstname = g.user.first_name.capitalize()
            lastname = g.user.last_name.capitalize()
            name = f"{firstname} {lastname}"
            # update the response dictionary with the extracted information
            response["role"] = role
            response["name"] = name
            response["status"] = 200
            return response

    def first_login_update(self):
        # Check if the user is already logged in
        if not g.user:
            # If user is not logged in, return appropriate error message and status code  # noqa: E501
            return {"message": "User not found", "status": 304}
        # Get required fields from the JSON request, returning appropriate error messages if missing  # noqa: E501
        osm_username = request.json.get("osm_username") or {
            "message": "osm_username required",
            "status": 400,
        }
        payment_email = request.json.get("payment_email") or {
            "message": "payment_email required",
            "status": 400,
        }
        terms_agreement = request.json.get("terms_agreement") or {
            "message": "terms_agreement required",
            "status": 400,
        }
        city = request.json.get("city") or {
            "message": "city required",
            "status": 400,
        }
        country = request.json.get("country") or {
            "message": "country required",
            "status": 400,
        }
        # If any required fields are missing, return the error message and status code  # noqa: E501
        if isinstance(osm_username, dict):
            return osm_username
        if isinstance(payment_email, dict):
            return payment_email
        if isinstance(terms_agreement, dict):
            return terms_agreement
        if isinstance(city, dict):
            return city
        if isinstance(country, dict):
            return country
        # Update the user's details
        g.user.update(
            osm_username=osm_username,
            payment_email=payment_email,
            city=city,
            country=country,
        )
        # Return success message and status code
        return {"message": "User Updated", "status": 200}

    # FETCH USER DETAILS FOR ACCOUNT PAGE
    def fetch_user_details(self):
        # initialize an empty dictionary to store the response
        response = {}
        # check if the user information is available in the global context
        if not g or not g.user:
            response["message"] = "User not found"
            response["status"] = 304
            return response

        user = g.user
        # extract user information
        first_name = (user.first_name or "").capitalize()
        last_name = (user.last_name or "").capitalize()
        full_name = f"{first_name} {last_name}".strip()

        # update the response dictionary with the extracted information
        response["id"] = user.id
        response["role"] = user.role
        response["first_name"] = first_name
        response["last_name"] = last_name
        response["name"] = full_name
        response["full_name"] = full_name
        response["email"] = user.email
        response["payment_email"] = user.payment_email
        response["city"] = user.city
        response["country"] = user.country

        # OSM account linking fields
        response["osm_username"] = user.osm_username
        response["osm_id"] = user.osm_id
        response["osm_verified"] = user.osm_verified or False
        response["osm_verified_at"] = (
            user.osm_verified_at.isoformat() if user.osm_verified_at else None
        )

        # Stats for display
        response["total_tasks_mapped"] = user.total_tasks_mapped or 0
        response["total_tasks_validated"] = user.total_tasks_validated or 0
        response["total_payout"] = user.paid_total or 0

        response["status"] = 200
        return response

    @requires_admin
    def do_fetch_users(self):
        # Initialize an empty dictionary for returning the response
        return_obj = {}
        # Check if the user is not found in the context
        if not g:
            return_obj["message"] = "User not found"
            return_obj["status"] = 304
            return return_obj
        # Get all the users from the database that belong to the same organization as the current user  # noqa: E501
        users_in_org = User.query.filter_by(org_id=g.user.org_id).all()
        # Initialize an empty list to store information about the users
        org_users = []
        # Loop over each user and extract relevant information
        for user in users_in_org:
            # Capitalize first and last name of the user
            first_name = user.first_name.title()
            last_name = user.last_name.title()
            full_name = first_name + " " + last_name
            if user.assigned_projects is not None:
                assigned_projects_count = len(user.assigned_projects)
            else:
                assigned_projects_count = 0
            # Append the user information to the org_users list
            org_users.append(
                {
                    "id": user.id,
                    "name": full_name,
                    "role": user.role,
                    "joined": user.create_time,
                    "total_payout": user.paid_total,
                    "awaiting_payment": user.requested_total,
                    "validated_tasks_amounts": user.mapping_payable_total
                    + user.validation_payable_total,
                    "total_tasks_mapped": user.total_tasks_mapped,
                    "total_tasks_validated": user.total_tasks_validated,
                    "total_tasks_invalidated": user.total_tasks_invalidated,
                    "requesting_payment": user.requesting_payment,
                    "assigned_projects": assigned_projects_count,
                }
            )
        # Add the list of users to the return_obj dictionary
        return_obj["users"] = org_users
        return_obj["status"] = 200
        # Return the final response
        return return_obj

    @requires_admin
    def fetch_project_users(self):
        # Initialize an empty dictionary for returning the response
        return_obj = {}
        # Check if the user is not found in the context
        if not g:
            return_obj["message"] = "User not found"
            return_obj["status"] = 304
            return return_obj
        project_id = (
            request.json["project_id"]
            if "project_id" in request.json
            else None
        )
        # Check if the email address is not provided or is an empty string
        if not project_id or project_id == "":
            return_obj["message"] = "project_id required"
            return_obj["status"] = 400
            return return_obj
        # Get all the users from the database that belong to the same organization as the current user  # noqa: E501
        users_in_org = User.query.filter_by(org_id=g.user.org_id).all()
        all_assigned_user_relations = ProjectUser.query.filter_by(
            project_id=project_id
        ).all()
        assigned_user_ids = [r.user_id for r in all_assigned_user_relations]
        assigned_users = [u for u in users_in_org if u.id in assigned_user_ids]
        unassigned_users = [
            u for u in users_in_org if u.id not in assigned_user_ids
        ]
        # Initialize an empty list to store information about the users
        org_users = []
        # Loop over each user and extract relevant information
        for user in users_in_org:
            # Capitalize first and last name of the user
            first_name = user.first_name.title()
            last_name = user.last_name.title()
            full_name = first_name + " " + last_name
            if user in assigned_users:
                assigned = "Yes"
            if user in unassigned_users:
                assigned = "No"
            if user.assigned_projects is not None:
                assigned_projects_count = len(user.assigned_projects)
            else:
                assigned_projects_count = 0
            # Append the user information to the org_users list
            org_users.append(
                {
                    "id": user.id,
                    "name": full_name,
                    "role": user.role,
                    "joined": user.create_time,
                    "total_payout": user.paid_total,
                    "awaiting_payment": user.requested_total,
                    "total_tasks_mapped": user.total_tasks_mapped,
                    "total_tasks_validated": user.total_tasks_validated,
                    "total_tasks_invalidated": user.total_tasks_invalidated,
                    "requesting_payment": user.requesting_payment,
                    "assigned_projects": assigned_projects_count,
                    "assigned": assigned,
                }
            )
        # Add the list of users to the return_obj dictionary
        return_obj["users"] = org_users
        return_obj["status"] = 200
        # Return the final response
        return return_obj

    # UPDATE USER DETAILS FROM ACCOUNT PAGE
    def update_user_details(self):
        # initialize an empty dictionary to store the response
        response = {}
        # check if the user information is available in the global context
        if not g:
            response = {"message": "User not found", "status": 304}
            return response
        # Update user details based on provided fields
        fields = [
            "first_name",
            "last_name",
            "osm_username",
            "city",
            "country",
            "email",
            "payment_email",
        ]
        for field in fields:
            value = request.json.get(field)
            if (
                value is not None
                and value != ""
                and value != getattr(g.user, field)
            ):
                setattr(g.user, field, value)
                g.user.update()
        # Return success response
        response = {"message": "User details updated", "status": 200}
        return response

    # DEPRECATED: Invite user via SSO - now handled through Auth0
    @requires_admin
    def invite_user(self):
        """
        DEPRECATED: This method relied on the old Kaart SSO.
        User invitations are now handled through Auth0.
        TODO: Implement Auth0-based user invitation using Management API.
        """
        return {
            "message": "User invitation via SSO is deprecated. Use Auth0 for user management.",
            "status": 501,
        }

    @requires_admin
    def do_remove_users(self):
        # Check if user_id is present in the request
        user_id = request.json.get("user_id")
        if not user_id:
            return {"message": "User_id required", "status": 400}
        # Query the user and remove the org_id
        remove_user = User.query.filter_by(id=user_id).first()
        if remove_user:
            remove_user.delete(soft=False)
            return {"message": "User Removed", "status": 200}
        else:
            return {"message": "User entry not found", "status": 400}

    @requires_admin
    def do_modify_users(self):
        # Initialize the return object
        return_obj = {}
        # Get the user ID from the request JSON
        user_id = request.json.get("user_id")
        if not user_id:
            return_obj["message"] = "User_id required"
            return_obj["status"] = 400
            return return_obj
        # Get the new role from the request JSON
        new_role = request.json.get("role")
        if not new_role:
            return_obj["message"] = "new role required"
            return_obj["status"] = 400
            return return_obj
        # Query the database for the user
        user = User.query.filter_by(id=user_id).first()
        if user:
            # Update the user's role
            user.update(role=new_role)
            return_obj["message"] = "Role Changed"
            return_obj["status"] = 200
            return return_obj
        else:
            # Return an error if the user was not found
            return {"message": "User Entry not found "}, 400

    # # ADMIN ONLY ROUTE - ASSIGN CURRENT SELECTED USER TO CURRENT SELECTED TEAM # noqa: E501
    @requires_admin
    def assign_user(self):
        # Initialize response dictionary
        response = {}
        # Extract project_id from request body
        project_id = request.json.get("project_id")
        if not project_id:
            # Return error response if project_id is not provided
            response["message"] = "project_id required"
            response["status"] = 400
            return response
        # Extract user_id from request body
        user_id = request.json.get("user_id")
        if not user_id:
            # Return error response if user_id is not provided
            response["message"] = "User_id required"
            response["status"] = 400
            return response
        # Check if relation between user and project already exists
        user_relation = ProjectUser.query.filter_by(
            project_id=project_id, user_id=user_id
        ).first()
        # If relation exists, update deleted field to False
        if user_relation:
            user_relation.delete(soft=False)
            response[
                "message"
            ] = f"User {user_id} unassigned from Project {project_id}"
        # If relation doesn't exist, create a new one
        else:
            ProjectUser.create(user_id=user_id, project_id=project_id)
            response[
                "message"
            ] = f"User {user_id} assigned to Project {project_id}"
        # Set status code for response
        response["status"] = 200
        return response

    def reset_test_user_stats(self):
        response = {}
        g.user.update(
            total_tasks_mapped=0,
            total_tasks_validated=0,
            total_tasks_invalidated=0,
            validator_tasks_validated=0,
            validator_tasks_invalidated=0,
            payable_total=0,
            validation_payable_total=0,
            mapping_payable_total=0,
        )

        response["message"] = "Stats reset"
        response["status"] = 200
        return response

    # def register_user(self):
    #     # Initialize response dictionary
    #     response = {}
    #     response["status"] = 200
    #     return response
