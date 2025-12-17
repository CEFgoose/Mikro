#!/usr/bin/env python3
"""
Login API endpoint for Mikro.

Handles user authentication via Auth0 JWT tokens.
Creates or retrieves user records based on Auth0 claims.
"""

from flask.views import MethodView
from flask import g, jsonify, current_app

from ..database import User


class LoginAPI(MethodView):
    """
    Login endpoint for Auth0 authentication.

    The JWT is validated by the before_request hook in app.py.
    This endpoint creates or retrieves the user record and returns user info.
    """

    def post(self):
        """
        Handle login request.

        The JWT has already been validated by the before_request hook.
        This endpoint:
        1. Gets user info from the validated JWT payload
        2. Creates a new user or retrieves existing user
        3. Returns user information to the frontend

        Returns:
            JSON response with user information or error
        """
        try:
            return self._do_login()
        except Exception as e:
            current_app.logger.error(f"Login error: {e}")
            return jsonify({"message": "Login failed", "status": 500}), 500

    def _do_login(self):
        """
        Perform the login logic.

        Returns:
            dict: User information or error response
        """
        # Check if JWT was validated (set by before_request hook)
        if not hasattr(g, "current_user") or not g.current_user:
            return jsonify({"message": "Unauthorized", "status": 401}), 401

        auth0_payload = g.current_user
        auth0_sub = auth0_payload.get("sub")

        if not auth0_sub:
            current_app.logger.error("No 'sub' claim in JWT")
            return jsonify({"message": "Invalid token", "status": 401}), 401

        # Get the namespace from config
        namespace = current_app.config.get("AUTH0_NAMESPACE", "mikro")

        # Extract user info from Auth0 token
        email = auth0_payload.get("email")
        name = auth0_payload.get("name", "")
        name_parts = name.split(" ", 1)
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        # Get role from custom claim (mikro/roles)
        roles = auth0_payload.get(f"{namespace}/roles", ["user"])
        role = roles[0] if roles else "user"

        # Get org_id from custom claim (mikro/org_id)
        org_id = auth0_payload.get(f"{namespace}/org_id")

        # Try to get existing user
        user = User.query.filter_by(auth0_sub=auth0_sub).first()

        if not user:
            # Create new user
            current_app.logger.info(f"Creating new user for {auth0_sub}")
            try:
                user = User.create(
                    id=auth0_sub,
                    auth0_sub=auth0_sub,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    role=role,
                    org_id=org_id,
                )
            except Exception as e:
                current_app.logger.error(f"Error creating user: {e}")
                return jsonify({"message": "Failed to create user", "status": 500}), 500
        else:
            # Update user info from Auth0 on each login
            current_app.logger.info(f"Updating user {auth0_sub}")
            try:
                user.update(
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    role=role,
                )
            except Exception as e:
                current_app.logger.warning(f"Error updating user: {e}")

        # Store user in g for use by other endpoints
        g.user = user

        # Check if user needs onboarding (missing required fields)
        needs_onboarding = not user.osm_username or not user.payment_email

        # Build response
        return jsonify(
            {
                "id": user.id,
                "name": user.full_name,
                "email": user.email,
                "role": user.role,
                "osm_username": user.osm_username,
                "payment_email": user.payment_email,
                "city": user.city,
                "country": user.country,
                "needs_onboarding": needs_onboarding,
                "status": 200,
            }
        )
