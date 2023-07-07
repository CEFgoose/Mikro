#!/usr/bin/env python3
from backend import app
from ..utils import requires_admin
import requests
from ..database import User, ProjectUser
from flask.views import MethodView
from flask import g, request
from flask_jwt_extended import (jwt_required)
from ..static_variables import SSO_BASE_URL


class UserAPI(MethodView):
    @jwt_required()
    def post(self, path: str):
        if path == "fetch_user_role":
            return self.fetch_user_role()
        if path == "fetch_user_details":
            return self.fetch_user_details()
        if path == "update_user_details":
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

    # MASS IMPORT
    # @app.route('/import_users', methods=['POST'])
    # @requires_admin
    def import_users(self):
    # Get the JSON data from the request body
        json_data = request.json

        if json_data:
            # Create new user profiles from the JSON data
            for user in json_data:
                # Extract the necessary information from the user object
                email = user.get('email')
                payment_email = user.get('payment_email')
                city = user.get('city')
                country = user.get('country')
                osm_username = user.get('osm_username')
                first_name = user.get('first_name')
                last_name = user.get('last_name')
                role = user.get('role')
                
                # Create a new user registration payload
                registration_payload = {
                    'email': email,
                    'firstName': first_name,
                    'lastName': last_name,
                    'password': 'password',
                    'org': 'org',
                    'int': 'micro',
                }

                # Send a POST request to the SSO server's register_user endpoint
                url = SSO_BASE_URL + 'auth/register_user'
                response = requests.post(url, json=registration_payload)

                if response.status_code == 200:
                    resp = response.json()
                    if resp['code'] == 0:
                        message = f"User {email} registered successfully"
                    else:
                        message = f"Error registering user {email}: {resp['message']}"
                else:
                    message = f"Error registering user {email}: {response.text}"

                # Print or store the registration message as needed
                print(message)

        # Return a success response
        return {
            "message": "User profiles created successfully",
            "status": 200
        }

    # FETCH USER ROLE ON LOGIN FOR UI RENDER
    def fetch_user_role(self):
        # initialize an empty dictionary to store the response
        response = {}
        # check if the user information is available in the global context
        if not g:
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
        if not g:
            response["message"] = "User not found"
            response["status"] = 304
            return response
        else:
            # extract the role, first name, and last name from the user information # noqa: E501
            first_name = g.user.first_name.capitalize()
            last_name = g.user.last_name.capitalize()
            osm_username = g.user.osm_username
            role = g.user.role
            city = g.user.city
            country = g.user.country
            email = g.user.email
            payment_email = g.user.payment_email
            full_name = f"{first_name} {last_name}"
            # update the response dictionary with the extracted information
            response["role"] = role
            response["first_name"] = first_name
            response["last_name"] = last_name
            response["osm_username"] = osm_username
            response["full_name"] = full_name
            response["city"] = city
            response["country"] = country
            response["email"] = email
            response["payment_email"] = payment_email
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

    # ADMIN ONLY ROUTE - SEND EMAIL INVITE TO USER FOR JOINING MIKRO UNDER THE ADMINS ORG # noqa: E501
    @requires_admin
    def invite_user(self):
        # Initialize an empty dictionary to store the response
        return_obj = {}
        # Get the target email address from the request
        target_email = request.json.get("email")
        if not target_email:
            return {
                "message": "target_email integration required",
                "status": 400,
            }

        app = request.json.get("app")
        if not app:
            return {"message": "app integration required", "status": 400}
        # Check if the email address is not provided or is an empty string
        if not target_email or target_email == "":
            return_obj["message"] = "email address required"
            return_obj["status"] = 400
            return return_obj
        # Construct the URL for sending the registration email
        url = SSO_BASE_URL + "auth/send_reg_email"
        # Send the request to the SSO API
        response = requests.post(url, json={"email": target_email, "app": app})
        # Update the return object with the response from the SSO API
        return_obj["message"] = "email sent"
        return_obj["sso_response"] = response.status_code
        return_obj["status"] = 200
        # Return the response
        return return_obj

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
