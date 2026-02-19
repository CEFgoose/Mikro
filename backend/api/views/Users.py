#!/usr/bin/env python3
"""
User API endpoints for Mikro.

Handles user management operations.
"""

import requests
import secrets
import string
from datetime import datetime, timedelta
from flask.views import MethodView
from flask import g, request, current_app
from sqlalchemy import func

from ..utils import requires_admin
from ..database import (
    User,
    Project,
    ProjectUser,
    Task,
    TimeEntry,
    UserTasks,
    UserChecklist,
    UserChecklistItem,
    TrainingCompleted,
    Country,
    Region,
    UserCountry,
    db,
)
from ..filters import resolve_filtered_user_ids


def _auto_assign_country(user, country_text):
    """
    Auto-assign a user to a Country record based on free-text country name.
    Sets user.country_id, user.timezone (from country default), and creates UserCountry.
    """
    if not country_text:
        return

    # Try exact match first, then case-insensitive
    country_obj = Country.query.filter(
        db.func.lower(Country.name) == country_text.strip().lower()
    ).first()

    if not country_obj:
        # Try matching by ISO code
        upper = country_text.strip().upper()
        if len(upper) <= 3:
            country_obj = Country.query.filter_by(iso_code=upper).first()

    if not country_obj:
        return

    updates = {"country_id": country_obj.id}
    if country_obj.default_timezone and not user.timezone:
        updates["timezone"] = country_obj.default_timezone
    user.update(**updates)

    # Create UserCountry record if not exists
    existing = UserCountry.query.filter_by(
        user_id=user.id, country_id=country_obj.id
    ).first()
    if not existing:
        UserCountry.create(
            user_id=user.id, country_id=country_obj.id, is_primary=True
        )


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
        elif path == "purge_all_users":
            return self.purge_all_users()
        elif path == "fetch_user_profile_by_id":
            return self.fetch_user_profile_by_id()
        elif path == "fetch_user_stats_by_date":
            return self.fetch_user_stats_by_date()
        elif path == "fetch_user_changesets":
            return self.fetch_user_changesets()
        elif path == "fetch_user_activity_chart":
            return self.fetch_user_activity_chart()
        elif path == "fetch_user_task_history":
            return self.fetch_user_task_history()
        # elif path == "register_user":
        #     return self.register_user()
        return {
            "message": "Only /project/{fetch_users,fetch_user_projects} is permitted with GET",  # noqa: E501
        }, 405

    @requires_admin
    def import_users(self):
        """
        Bulk import users via Auth0 Management API.
        Expects JSON: { "users": [{ "email": "...", "name": "...", "role": "..." }, ...] }
        """
        VALID_ROLES = {"admin", "validator", "user"}

        users = request.json.get("users", [])
        if not users:
            return {"message": "No users provided", "status": 400}

        # Get Auth0 config
        domain = current_app.config.get("AUTH0_DOMAIN")
        client_id = current_app.config.get("AUTH0_M2M_CLIENT_ID")
        client_secret = current_app.config.get("AUTH0_M2M_CLIENT_SECRET")

        if not all([domain, client_id, client_secret]):
            return {
                "message": "Auth0 Management API not configured",
                "status": 500,
            }

        try:
            # Get Management API access token
            token_url = f"https://{domain}/oauth/token"
            token_payload = {
                "grant_type": "client_credentials",
                "client_id": client_id,
                "client_secret": client_secret,
                "audience": f"https://{domain}/api/v2/",
            }
            token_response = requests.post(token_url, json=token_payload)
            if not token_response.ok:
                return {"message": "Failed to authenticate with Auth0", "status": 500}

            access_token = token_response.json().get("access_token")
            headers = {"Authorization": f"Bearer {access_token}"}

            results = {"success": [], "failed": []}

            for user_data in users:
                email = user_data.get("email", "").strip().lower()
                name = user_data.get("name", "")
                role = user_data.get("role", "user").strip().lower()

                if not email:
                    results["failed"].append({"email": "unknown", "error": "No email provided"})
                    continue

                # Validate role
                if role not in VALID_ROLES:
                    results["failed"].append({
                        "email": email,
                        "error": f"Invalid role '{role}'. Must be one of: {', '.join(sorted(VALID_ROLES))}"
                    })
                    continue

                # Parse name into first/last
                name_parts = name.strip().split(" ", 1) if name else ["", ""]
                first_name = name_parts[0] if name_parts else ""
                last_name = name_parts[1] if len(name_parts) > 1 else ""

                try:
                    # Generate cryptographically random temp password
                    alphabet = string.ascii_letters + string.digits + "!@#$%"
                    temp_password = "".join(secrets.choice(alphabet) for _ in range(24))

                    # Create user in Auth0
                    create_url = f"https://{domain}/api/v2/users"
                    user_payload = {
                        "email": email,
                        "connection": "Username-Password-Authentication",
                        "email_verified": True,
                        "password": temp_password,
                        "name": name or email.split("@")[0],
                        "given_name": first_name,
                        "family_name": last_name,
                    }
                    create_response = requests.post(create_url, json=user_payload, headers=headers)

                    auth0_created = True
                    auth0_user_id = None
                    if create_response.status_code == 409:
                        # User already exists in Auth0 — look up their ID
                        auth0_created = False
                        lookup_url = f"https://{domain}/api/v2/users-by-email"
                        lookup_resp = requests.get(
                            lookup_url,
                            params={"email": email},
                            headers=headers,
                        )
                        if lookup_resp.ok and lookup_resp.json():
                            auth0_user_id = lookup_resp.json()[0].get("user_id")
                    elif not create_response.ok:
                        error_detail = create_response.json().get("message", create_response.text[:100])
                        current_app.logger.error(f"Auth0 create user failed for {email}: {error_detail}")
                        results["failed"].append({"email": email, "error": f"Auth0: {error_detail}"})
                        continue
                    else:
                        # New user created — get their Auth0 ID
                        auth0_user_id = create_response.json().get("user_id")

                    if not auth0_user_id:
                        results["failed"].append({"email": email, "error": "Could not resolve Auth0 user ID"})
                        continue

                    # Trigger password set email for all imported users
                    reset_url = f"https://{domain}/dbconnections/change_password"
                    reset_payload = {
                        "client_id": client_id,
                        "email": email,
                        "connection": "Username-Password-Authentication",
                    }
                    requests.post(reset_url, json=reset_payload)

                    # Create/update user in local database
                    existing_user = User.query.filter_by(email=email).first()
                    if not existing_user:
                        existing_user = User.query.filter_by(id=auth0_user_id).first()

                    if existing_user:
                        existing_user.update(
                            first_name=first_name,
                            last_name=last_name,
                            role=role,
                            org_id=g.user.org_id,
                            auth0_sub=auth0_user_id,
                        )
                    else:
                        User.create(
                            id=auth0_user_id,
                            auth0_sub=auth0_user_id,
                            email=email,
                            first_name=first_name,
                            last_name=last_name,
                            role=role,
                            org_id=g.user.org_id,
                        )

                    suffix = " (already in Auth0, synced locally)" if not auth0_created else ""
                    results["success"].append(email + suffix)

                except Exception as e:
                    db.session.rollback()
                    current_app.logger.error(f"Error importing user {email}: {e}")
                    results["failed"].append({"email": email, "error": str(e)})

            return {
                "message": f"Imported {len(results['success'])} user(s)",
                "results": results,
                "status": 200,
            }

        except Exception as e:
            current_app.logger.error(f"Error in bulk import: {e}")
            return {"message": "Import failed", "status": 500}

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
        # Auto-assign country → country_id, timezone, UserCountry
        _auto_assign_country(g.user, country)
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

        # Support universal filter system
        filters = request.json.get("filters") if request.json else None
        filtered_ids = resolve_filtered_user_ids(filters, g.user.org_id) if filters else None

        # Get all the users from the database that belong to the same organization
        users_query = User.query.filter_by(org_id=g.user.org_id)
        if filtered_ids is not None:
            users_query = users_query.filter(User.id.in_(filtered_ids))
        users_in_org = users_query.all()

        # Build country/region lookup caches
        country_cache = {}
        region_cache = {}

        # Initialize an empty list to store information about the users
        org_users = []
        # Loop over each user and extract relevant information
        for user in users_in_org:
            # Capitalize first and last name of the user (handle None)
            first_name = (user.first_name or "").title()
            last_name = (user.last_name or "").title()
            full_name = f"{first_name} {last_name}".strip() or user.email or "Unknown"
            if user.assigned_projects is not None:
                assigned_projects_count = len(user.assigned_projects)
            else:
                assigned_projects_count = 0

            # Resolve country and region names
            country_name = None
            region_name = None
            if user.country_id:
                if user.country_id not in country_cache:
                    c = Country.query.get(user.country_id)
                    country_cache[user.country_id] = c
                country_obj = country_cache[user.country_id]
                if country_obj:
                    country_name = country_obj.name
                    if country_obj.region_id:
                        if country_obj.region_id not in region_cache:
                            r = Region.query.get(country_obj.region_id)
                            region_cache[country_obj.region_id] = r
                        region_obj = region_cache[country_obj.region_id]
                        if region_obj:
                            region_name = region_obj.name

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
                    "country_name": country_name,
                    "region_name": region_name,
                    "timezone": user.timezone,
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
            # Capitalize first and last name of the user (handle None)
            first_name = (user.first_name or "").title()
            last_name = (user.last_name or "").title()
            full_name = f"{first_name} {last_name}".strip() or user.email or "Unknown"
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
        country_changed = False
        for field in fields:
            value = request.json.get(field)
            if (
                value is not None
                and value != ""
                and value != getattr(g.user, field)
            ):
                if field == "country":
                    country_changed = True
                setattr(g.user, field, value)
                g.user.update()
        # Auto-assign country when country text changes
        if country_changed:
            _auto_assign_country(g.user, g.user.country)
        # Return success response
        response = {"message": "User details updated", "status": 200}
        return response

    @requires_admin
    def invite_user(self):
        """
        Invite a user via Auth0 Management API.
        Creates the user in Auth0 and triggers a password reset email.
        """
        email = request.json.get("email")
        if not email:
            return {"message": "Email is required", "status": 400}

        # Get Auth0 config
        domain = current_app.config.get("AUTH0_DOMAIN")
        client_id = current_app.config.get("AUTH0_M2M_CLIENT_ID")
        client_secret = current_app.config.get("AUTH0_M2M_CLIENT_SECRET")

        if not all([domain, client_id, client_secret]):
            current_app.logger.error("Auth0 Management API not configured")
            return {
                "message": "Auth0 Management API not configured. Please set AUTH0_M2M_CLIENT_ID and AUTH0_M2M_CLIENT_SECRET.",
                "status": 500,
            }

        try:
            # Get Management API access token
            token_url = f"https://{domain}/oauth/token"
            token_payload = {
                "grant_type": "client_credentials",
                "client_id": client_id,
                "client_secret": client_secret,
                "audience": f"https://{domain}/api/v2/",
            }
            token_response = requests.post(token_url, json=token_payload)
            if not token_response.ok:
                current_app.logger.error(f"Failed to get Auth0 token: {token_response.text}")
                return {"message": "Failed to authenticate with Auth0", "status": 500}

            access_token = token_response.json().get("access_token")

            # Generate cryptographically random temp password
            alphabet = string.ascii_letters + string.digits + "!@#$%"
            temp_password = "".join(secrets.choice(alphabet) for _ in range(24))

            # Create user in Auth0
            create_url = f"https://{domain}/api/v2/users"
            headers = {"Authorization": f"Bearer {access_token}"}
            user_payload = {
                "email": email,
                "connection": "Username-Password-Authentication",
                "email_verified": False,
                "password": temp_password,
            }
            create_response = requests.post(create_url, json=user_payload, headers=headers)

            if create_response.status_code == 409:
                return {"message": "User with this email already exists", "status": 400}
            elif not create_response.ok:
                current_app.logger.error(f"Failed to create Auth0 user: {create_response.text}")
                return {"message": "Failed to create user in Auth0", "status": 500}

            auth0_user = create_response.json()

            # Trigger password reset email
            reset_url = f"https://{domain}/dbconnections/change_password"
            reset_payload = {
                "client_id": client_id,
                "email": email,
                "connection": "Username-Password-Authentication",
            }
            requests.post(reset_url, json=reset_payload)

            return {
                "message": f"Invitation sent to {email}. They will receive an email to set their password.",
                "status": 200,
            }

        except Exception as e:
            current_app.logger.error(f"Error inviting user: {e}")
            return {"message": "Failed to invite user", "status": 500}

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

    @requires_admin
    def purge_all_users(self):
        """DEV ONLY: Purge all users EXCEPT the initiating admin."""
        if not g.user:
            return {"message": "User not found", "status": 304}

        org_id = g.user.org_id
        admin_id = g.user.id  # Don't delete this user

        # Get all users except the admin
        users_to_delete = User.query.filter(
            User.org_id == org_id,
            User.id != admin_id
        ).all()

        users_deleted = 0
        for user in users_to_delete:
            user_id = user.id

            # Delete user's task relations
            user_tasks = UserTasks.query.filter_by(user_id=user_id).all()
            for ut in user_tasks:
                ut.delete(soft=False)

            # Delete user's project relations
            project_users = ProjectUser.query.filter_by(user_id=user_id).all()
            for pu in project_users:
                pu.delete(soft=False)

            # Delete user's checklist items
            user_checklist_items = UserChecklistItem.query.filter_by(user_id=user_id).all()
            for uci in user_checklist_items:
                uci.delete(soft=False)

            # Delete user's checklists
            user_checklists = UserChecklist.query.filter_by(user_id=user_id).all()
            for uc in user_checklists:
                uc.delete(soft=False)

            # Delete user's training completions
            training_completions = TrainingCompleted.query.filter_by(user_id=user_id).all()
            for tc in training_completions:
                tc.delete(soft=False)

            # Delete the user
            user.delete(soft=False)
            users_deleted += 1

        return {
            "message": f"Purged {users_deleted} users (admin preserved)",
            "users_deleted": users_deleted,
            "admin_preserved": admin_id,
            "status": 200,
        }

    # ─── User Profile ─────────────────────────────────────

    @staticmethod
    def _format_time_entry(entry):
        """Format a TimeEntry for the profile response."""
        project = Project.query.get(entry.project_id) if entry.project_id else None
        duration = None
        if entry.duration_seconds is not None:
            hours = entry.duration_seconds // 3600
            minutes = (entry.duration_seconds % 3600) // 60
            seconds = entry.duration_seconds % 60
            duration = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        return {
            "id": entry.id,
            "clockIn": entry.clock_in.isoformat() + "Z" if entry.clock_in else None,
            "clockOut": entry.clock_out.isoformat() + "Z" if entry.clock_out else None,
            "duration": duration,
            "durationSeconds": entry.duration_seconds,
            "category": entry.category.capitalize() if entry.category else "",
            "projectId": entry.project_id,
            "projectName": project.name if project else "No Project",
            "status": entry.status,
            "notes": entry.notes,
        }

    @requires_admin
    def fetch_user_profile_by_id(self):
        """Fetch comprehensive profile data for a specific user."""
        data = request.get_json() or {}
        user_id = data.get("userId")

        if not user_id:
            return {"message": "userId is required", "status": 400}

        user = User.query.get(user_id)
        if not user or user.org_id != g.user.org_id:
            return {"message": "User not found in your organization", "status": 404}

        # Build per-project breakdown from Task table
        projects_data = []
        osm_username = user.osm_username
        if osm_username:
            # Get all projects in org
            org_projects = Project.query.filter_by(org_id=g.user.org_id).all()
            for proj in org_projects:
                tasks = Task.query.filter_by(project_id=proj.id).all()
                mapped = 0
                validated = 0
                invalidated = 0
                mapping_earnings = 0.0
                validation_earnings = 0.0
                for t in tasks:
                    if t.mapped_by == osm_username and t.mapped:
                        mapped += 1
                        mapping_earnings += (t.mapping_rate or 0)
                    if t.validated_by == osm_username and t.validated:
                        validated += 1
                        validation_earnings += (t.validation_rate or 0)
                    if t.validated_by == osm_username and t.invalidated:
                        invalidated += 1

                if mapped > 0 or validated > 0 or invalidated > 0:
                    projects_data.append({
                        "id": proj.id,
                        "name": proj.name,
                        "url": proj.url,
                        "tasks_mapped": mapped,
                        "tasks_validated": validated,
                        "tasks_invalidated": invalidated,
                        "mapping_earnings": round(mapping_earnings, 2),
                        "validation_earnings": round(validation_earnings, 2),
                    })

        # Get recent time entries
        time_entries = (
            TimeEntry.query
            .filter_by(user_id=user_id)
            .filter(TimeEntry.status.in_(["completed", "voided"]))
            .order_by(TimeEntry.clock_in.desc())
            .limit(50)
            .all()
        )

        first_name = (user.first_name or "").title()
        last_name = (user.last_name or "").title()
        full_name = f"{first_name} {last_name}".strip() or user.email or "Unknown"

        return {
            "status": 200,
            "user": {
                "id": user.id,
                "first_name": first_name,
                "last_name": last_name,
                "full_name": full_name,
                "email": user.email,
                "payment_email": user.payment_email,
                "osm_username": user.osm_username,
                "role": user.role,
                "city": user.city,
                "country": user.country,
                "country_id": user.country_id,
                "timezone": user.timezone,
                "joined": user.create_time.isoformat() if user.create_time else None,
                # Task stats
                "total_tasks_mapped": user.total_tasks_mapped or 0,
                "total_tasks_validated": user.total_tasks_validated or 0,
                "total_tasks_invalidated": user.total_tasks_invalidated or 0,
                "validator_tasks_validated": user.validator_tasks_validated or 0,
                "validator_tasks_invalidated": user.validator_tasks_invalidated or 0,
                # Payment stats
                "mapping_payable_total": round(user.mapping_payable_total or 0, 2),
                "validation_payable_total": round(user.validation_payable_total or 0, 2),
                "checklist_payable_total": round(user.checklist_payable_total or 0, 2),
                "payable_total": round(user.payable_total or 0, 2),
                "requested_total": round(user.requested_total or 0, 2),
                "paid_total": round(user.paid_total or 0, 2),
                # Other
                "total_checklists_completed": user.total_checklists_completed or 0,
                "validator_total_checklists_confirmed": user.validator_total_checklists_confirmed or 0,
                "mapper_level": user.mapper_level or 0,
                "mapper_points": user.mapper_points or 0,
                "validator_points": user.validator_points or 0,
                # Nested
                "projects": projects_data,
                "time_entries": [self._format_time_entry(e) for e in time_entries],
            },
        }

    @requires_admin
    def fetch_user_stats_by_date(self):
        """Fetch date-filtered time tracking stats for a user."""
        data = request.get_json() or {}
        user_id = data.get("userId")
        start_date_str = data.get("startDate")
        end_date_str = data.get("endDate")

        if not user_id or not start_date_str or not end_date_str:
            return {"message": "userId, startDate, and endDate are required", "status": 400}

        user = User.query.get(user_id)
        if not user or user.org_id != g.user.org_id:
            return {"message": "User not found in your organization", "status": 404}

        # Support both date-only and datetime formats
        try:
            try:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%dT%H:%M:%S")
            except ValueError:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
            try:
                end_date = datetime.strptime(end_date_str, "%Y-%m-%dT%H:%M:%S")
            except ValueError:
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d") + timedelta(days=1)
        except ValueError:
            return {"message": "Invalid date format. Use YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS.", "status": 400}

        # Query time entries in date range
        entries = (
            TimeEntry.query
            .filter(
                TimeEntry.user_id == user_id,
                TimeEntry.status == "completed",
                TimeEntry.clock_in >= start_date,
                TimeEntry.clock_in < end_date,
            )
            .order_by(TimeEntry.clock_in.desc())
            .all()
        )

        total_seconds = sum(e.duration_seconds or 0 for e in entries)
        total_hours = round(total_seconds / 3600, 1)

        # Per-project breakdown
        project_hours = {}
        for e in entries:
            pid = e.project_id or 0
            if pid not in project_hours:
                proj = Project.query.get(pid) if pid else None
                project_hours[pid] = {
                    "id": pid,
                    "name": proj.name if proj else "No Project",
                    "total_seconds": 0,
                    "entries_count": 0,
                }
            project_hours[pid]["total_seconds"] += (e.duration_seconds or 0)
            project_hours[pid]["entries_count"] += 1

        projects_list = [
            {
                "id": v["id"],
                "name": v["name"],
                "total_hours": round(v["total_seconds"] / 3600, 1),
                "entries_count": v["entries_count"],
            }
            for v in sorted(project_hours.values(), key=lambda x: x["total_seconds"], reverse=True)
        ]

        # Date-filtered task stats
        osm_username = user.osm_username
        tasks_mapped_in_range = 0
        tasks_validated_in_range = 0
        tasks_invalidated_in_range = 0
        validator_validated_in_range = 0
        mapping_earnings_in_range = 0.0
        validation_earnings_in_range = 0.0

        if osm_username:
            mapped_tasks = Task.query.filter(
                Task.mapped_by == osm_username,
                Task.mapped == True,
                Task.date_mapped >= start_date,
                Task.date_mapped < end_date,
            ).all()
            tasks_mapped_in_range = len(mapped_tasks)
            mapping_earnings_in_range = sum(
                t.mapping_rate or 0 for t in mapped_tasks if t.validated
            )

            validated_tasks = Task.query.filter(
                Task.mapped_by == osm_username,
                Task.validated == True,
                Task.date_validated >= start_date,
                Task.date_validated < end_date,
            ).all()
            tasks_validated_in_range = len(validated_tasks)

            invalidated_tasks = Task.query.filter(
                Task.mapped_by == osm_username,
                Task.invalidated == True,
                Task.date_validated >= start_date,
                Task.date_validated < end_date,
            ).all()
            tasks_invalidated_in_range = len(invalidated_tasks)

            validator_validated_in_range = Task.query.filter(
                Task.validated_by == osm_username,
                Task.validated == True,
                Task.date_validated >= start_date,
                Task.date_validated < end_date,
            ).count()

            validation_earnings_in_range = sum(
                t.validation_rate or 0
                for t in Task.query.filter(
                    Task.validated_by == osm_username,
                    Task.validated == True,
                    Task.date_validated >= start_date,
                    Task.date_validated < end_date,
                ).all()
            )

        return {
            "status": 200,
            "stats": {
                "startDate": start_date_str,
                "endDate": end_date_str,
                "total_hours": total_hours,
                "entries_count": len(entries),
                "time_entries": [self._format_time_entry(e) for e in entries],
                "projects": projects_list,
                "tasks_mapped": tasks_mapped_in_range,
                "tasks_validated": tasks_validated_in_range,
                "tasks_invalidated": tasks_invalidated_in_range,
                "validator_validated": validator_validated_in_range,
                "mapping_earnings": round(mapping_earnings_in_range, 2),
                "validation_earnings": round(validation_earnings_in_range, 2),
            },
        }

    @requires_admin
    def fetch_user_changesets(self):
        """Fetch OSM changesets for a user within a date range."""
        import xml.etree.ElementTree as ET
        from concurrent.futures import ThreadPoolExecutor, as_completed

        data = request.get_json() or {}
        user_id = data.get("userId")
        start_date_str = data.get("startDate")
        end_date_str = data.get("endDate")

        if not user_id or not start_date_str or not end_date_str:
            return {"message": "userId, startDate, and endDate are required", "status": 400}

        user = User.query.get(user_id)
        if not user or user.org_id != g.user.org_id:
            return {"message": "User not found in your organization", "status": 404}

        osm_username = user.osm_username
        if not osm_username:
            return {
                "status": 200,
                "changesets": [],
                "summary": {
                    "totalChangesets": 0, "totalChanges": 0,
                    "totalAdded": 0, "totalModified": 0, "totalDeleted": 0,
                },
                "hashtagSummary": {},
                "message": "No OSM username set for this user",
            }

        # Fetch changesets from OSM API
        osm_url = "https://api.openstreetmap.org/api/0.6/changesets"
        params = {
            "display_name": osm_username,
            "time": f"{start_date_str},{end_date_str}",
            "closed": "true",
        }

        try:
            resp = requests.get(osm_url, params=params, timeout=30)
            if not resp.ok:
                current_app.logger.error(f"OSM API error: {resp.status_code} - {resp.text[:200]}")
                return {"message": "Could not reach OSM API", "status": 502}
        except requests.RequestException as e:
            current_app.logger.error(f"OSM API request failed: {e}")
            return {"message": f"OSM API error: {str(e)}", "status": 502}

        # Parse changeset list XML
        try:
            root = ET.fromstring(resp.text)
        except ET.ParseError as e:
            current_app.logger.error(f"Failed to parse OSM XML: {e}")
            return {"message": "Failed to parse OSM API response", "status": 502}

        changeset_metas = []
        for cs in root.findall("changeset"):
            tags = {}
            for tag in cs.findall("tag"):
                tags[tag.get("k", "")] = tag.get("v", "")

            # Extract hashtags from comment
            comment = tags.get("comment", "")
            hashtags_from_comment = [
                word for word in comment.split() if word.startswith("#")
            ]
            # Also check the hashtag tag
            hashtag_tag = tags.get("hashtag", "")
            if hashtag_tag:
                for h in hashtag_tag.split(";"):
                    h = h.strip()
                    if h and not h.startswith("#"):
                        h = "#" + h
                    if h and h not in hashtags_from_comment:
                        hashtags_from_comment.append(h)

            # Extract bbox centroid for heatmap
            min_lat = cs.get("min_lat")
            max_lat = cs.get("max_lat")
            min_lon = cs.get("min_lon")
            max_lon = cs.get("max_lon")
            centroid = None
            if min_lat and max_lat and min_lon and max_lon:
                centroid = {
                    "lat": (float(min_lat) + float(max_lat)) / 2,
                    "lon": (float(min_lon) + float(max_lon)) / 2,
                }

            changeset_metas.append({
                "id": int(cs.get("id", 0)),
                "createdAt": cs.get("created_at", ""),
                "closedAt": cs.get("closed_at", ""),
                "changesCount": int(cs.get("changes_count", 0)),
                "comment": comment,
                "hashtags": hashtags_from_comment,
                "source": tags.get("source", ""),
                "imageryUsed": tags.get("imagery_used", tags.get("source", "")),
                "added": None,
                "modified": None,
                "deleted": None,
                "elements": None,
                "centroid": centroid,
            })

        # Fetch detail counts for each changeset concurrently
        def fetch_changeset_details(cs_id):
            """Fetch OsmChange XML and count create/modify/delete elements plus element types."""
            try:
                detail_url = f"https://api.openstreetmap.org/api/0.6/changeset/{cs_id}/download"
                detail_resp = requests.get(detail_url, timeout=30)
                if not detail_resp.ok:
                    return cs_id, None, None, None, None

                detail_root = ET.fromstring(detail_resp.text)
                added = 0
                modified = 0
                deleted = 0
                nodes = 0
                ways = 0
                relations = 0

                for child in detail_root:
                    tag_name = child.tag.lower()
                    for elem in child:
                        elem_type = elem.tag.lower()
                        if elem_type == "node":
                            nodes += 1
                        elif elem_type == "way":
                            ways += 1
                        elif elem_type == "relation":
                            relations += 1

                        if tag_name == "create":
                            added += 1
                        elif tag_name == "modify":
                            modified += 1
                        elif tag_name == "delete":
                            deleted += 1

                return cs_id, added, modified, deleted, {"nodes": nodes, "ways": ways, "relations": relations}
            except Exception:
                return cs_id, None, None, None, None

        # Concurrently fetch details (max 5 workers)
        detail_map = {}
        if changeset_metas:
            with ThreadPoolExecutor(max_workers=5) as executor:
                futures = {
                    executor.submit(fetch_changeset_details, cs["id"]): cs["id"]
                    for cs in changeset_metas
                }
                for future in as_completed(futures):
                    result = future.result()
                    cs_id = result[0]
                    detail_map[cs_id] = result[1:]

        # Merge details into changeset metadata
        for cs in changeset_metas:
            details = detail_map.get(cs["id"])
            if details:
                cs["added"], cs["modified"], cs["deleted"], cs["elements"] = details

        # Compute summary
        total_changesets = len(changeset_metas)
        total_changes = sum(cs["changesCount"] for cs in changeset_metas)
        total_added = sum(cs["added"] or 0 for cs in changeset_metas)
        total_modified = sum(cs["modified"] or 0 for cs in changeset_metas)
        total_deleted = sum(cs["deleted"] or 0 for cs in changeset_metas)
        total_nodes = sum((cs.get("elements") or {}).get("nodes", 0) for cs in changeset_metas)
        total_ways = sum((cs.get("elements") or {}).get("ways", 0) for cs in changeset_metas)
        total_relations = sum((cs.get("elements") or {}).get("relations", 0) for cs in changeset_metas)

        # Build heatmap points from centroids
        heatmap_points = [
            [cs["centroid"]["lat"], cs["centroid"]["lon"], cs["changesCount"]]
            for cs in changeset_metas if cs.get("centroid")
        ]

        # Aggregate hashtags
        hashtag_summary = {}
        for cs in changeset_metas:
            for h in cs["hashtags"]:
                hashtag_summary[h] = hashtag_summary.get(h, 0) + 1

        # Sort changesets by creation date (newest first)
        changeset_metas.sort(key=lambda x: x["createdAt"], reverse=True)

        return {
            "status": 200,
            "changesets": changeset_metas,
            "summary": {
                "totalChangesets": total_changesets,
                "totalChanges": total_changes,
                "totalAdded": total_added,
                "totalModified": total_modified,
                "totalDeleted": total_deleted,
                "totalNodes": total_nodes,
                "totalWays": total_ways,
                "totalRelations": total_relations,
            },
            "hashtagSummary": hashtag_summary,
            "heatmapPoints": heatmap_points,
        }

    @requires_admin
    def fetch_user_activity_chart(self):
        """Aggregate daily activity data for charting."""
        data = request.get_json() or {}
        user_id = data.get("userId")
        start_date_str = data.get("startDate")
        end_date_str = data.get("endDate")

        if not user_id or not start_date_str or not end_date_str:
            return {"message": "userId, startDate, and endDate required", "status": 400}

        user = User.query.get(user_id)
        if not user or user.org_id != g.user.org_id:
            return {"message": "User not found", "status": 404}

        # Parse dates
        try:
            try:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%dT%H:%M:%S")
            except ValueError:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
            try:
                end_date = datetime.strptime(end_date_str, "%Y-%m-%dT%H:%M:%S")
            except ValueError:
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d") + timedelta(days=1)
        except ValueError:
            return {"message": "Invalid date format", "status": 400}

        osm_username = user.osm_username

        # Generate day-by-day buckets
        days = {}
        current = start_date.date() if hasattr(start_date, "date") else start_date
        end = end_date.date() if hasattr(end_date, "date") else end_date
        while current <= end:
            days[current.isoformat()] = {
                "date": current.isoformat(),
                "tasksMapped": 0,
                "tasksValidated": 0,
                "hoursWorked": 0.0,
            }
            current += timedelta(days=1)

        # Fill task data
        if osm_username:
            mapped = Task.query.filter(
                Task.mapped_by == osm_username,
                Task.mapped == True,
                Task.date_mapped >= start_date,
                Task.date_mapped < end_date,
            ).all()
            for t in mapped:
                day_key = t.date_mapped.date().isoformat()
                if day_key in days:
                    days[day_key]["tasksMapped"] += 1

            validated = Task.query.filter(
                Task.validated_by == osm_username,
                Task.validated == True,
                Task.date_validated >= start_date,
                Task.date_validated < end_date,
            ).all()
            for t in validated:
                day_key = t.date_validated.date().isoformat()
                if day_key in days:
                    days[day_key]["tasksValidated"] += 1

        # Fill time tracking data
        entries = TimeEntry.query.filter(
            TimeEntry.user_id == user_id,
            TimeEntry.status == "completed",
            TimeEntry.clock_in >= start_date,
            TimeEntry.clock_in < end_date,
        ).all()
        for e in entries:
            day_key = e.clock_in.date().isoformat()
            if day_key in days:
                days[day_key]["hoursWorked"] += round((e.duration_seconds or 0) / 3600, 1)

        # Filter out days with no activity
        activity = [
            v for v in sorted(days.values(), key=lambda x: x["date"])
            if v["tasksMapped"] or v["tasksValidated"] or v["hoursWorked"]
        ]

        return {"status": 200, "activity": activity}

    @requires_admin
    def fetch_user_task_history(self):
        """Fetch task-level history for a user in date range."""
        data = request.get_json() or {}
        user_id = data.get("userId")
        start_date_str = data.get("startDate")
        end_date_str = data.get("endDate")

        if not user_id or not start_date_str or not end_date_str:
            return {"message": "userId, startDate, and endDate required", "status": 400}

        user = User.query.get(user_id)
        if not user or user.org_id != g.user.org_id:
            return {"message": "User not found", "status": 404}

        # Parse dates
        try:
            try:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%dT%H:%M:%S")
            except ValueError:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
            try:
                end_date = datetime.strptime(end_date_str, "%Y-%m-%dT%H:%M:%S")
            except ValueError:
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d") + timedelta(days=1)
        except ValueError:
            return {"message": "Invalid date format", "status": 400}

        osm_username = user.osm_username
        if not osm_username:
            return {"status": 200, "tasks": []}

        history = []

        # Tasks mapped by this user
        mapped = Task.query.filter(
            Task.mapped_by == osm_username,
            Task.date_mapped >= start_date,
            Task.date_mapped < end_date,
        ).all()
        for t in mapped:
            proj = Project.query.get(t.project_id)
            history.append({
                "taskId": t.task_id,
                "projectId": t.project_id,
                "projectName": proj.name if proj else f"Project {t.project_id}",
                "action": "mapped",
                "date": t.date_mapped.isoformat() if t.date_mapped else None,
                "status": "validated" if t.validated else ("invalidated" if t.invalidated else "pending"),
                "validatedBy": t.validated_by,
                "mappingRate": t.mapping_rate,
            })

        # Tasks validated/invalidated by this user
        val_tasks = Task.query.filter(
            Task.validated_by == osm_username,
            Task.date_validated >= start_date,
            Task.date_validated < end_date,
        ).all()
        for t in val_tasks:
            proj = Project.query.get(t.project_id)
            action = "validated" if t.validated else "invalidated"
            history.append({
                "taskId": t.task_id,
                "projectId": t.project_id,
                "projectName": proj.name if proj else f"Project {t.project_id}",
                "action": action,
                "date": t.date_validated.isoformat() if t.date_validated else None,
                "status": action,
                "mappedBy": t.mapped_by,
                "validationRate": t.validation_rate,
            })

        # Sort by date descending
        history.sort(key=lambda x: x["date"] or "", reverse=True)

        return {"status": 200, "tasks": history}
