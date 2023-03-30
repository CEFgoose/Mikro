#!/usr/bin/env python3
from ..database import User
from flask.views import MethodView
from flask import (
    g,
    jsonify,
    request,
)
from flask_jwt_extended import jwt_required, get_jwt
import requests
from ..static_variables import SSO_BASE_URL
from flask.globals import current_app


class LoginAPI(MethodView):
    # JWT protected login call, calls the actual login function if JWT present & valid & path is correct # noqa: E501
    @jwt_required()
    def post(self, path: str):

        import foobar

        if path == "login":
            print("LOGIN!")
            return self.do_login()

        return jsonify({"message": "Only auth/login is permitted!"}), 405

    def do_login(self):
        current_app.logger.error("starting login")
        # Initialize the return object
        return_obj = {}
        # Check if the user is already logged in
        if not g.user:
            current_app.logger.error("getting jwt")
            # Get the JWT user information
            jwt_user = get_jwt()
            current_app.logger.error(str(jwt_user))
            # Check if the "Mikro" integration is missing
            if "micro" not in jwt_user["integrations"]:
                return_obj["message"] = "Mikro Integration Missing"
                return_obj["status"] = 400
                return return_obj
            # Get the access token cookie
            at_cookie = request.cookies.get("access_token_cookie")
            current_app.logger.error(str(at_cookie))
            # Use a session to access the user information from the SSO
            with requests.Session() as s:
                org_id = jwt_user["company_id"]
                # Get the user information from the SSO
                url = SSO_BASE_URL
                current_app.logger.error(url)
                resp = s.get(
                    url + f"users/{jwt_user['id']}",
                    cookies={"access_token_cookie": at_cookie},
                )
                current_app.logger.error(resp.text)
                # If the request is successful, create or retrieve the user
                if resp.ok:
                    current_app.logger.error("RESPONSE OK")
                    user_info = resp.json()["result"]
                    user = User.create(
                        id=jwt_user["id"],
                        role=jwt_user["role"],
                        org_id=org_id,
                        osm_username=None,
                        first_name=user_info["first_name"],
                        last_name=user_info["last_name"],
                        email=user_info["email"],
                    )
                    g.user = user
                else:
                    current_app.logger.error("RESPONSE NOT OK")
                    # Return an error if the request fails
                    return_obj[
                        "message"
                    ] = "An error occurred, please try again later"
                    return_obj["status"] = 400
                    return return_obj

        current_app.logger.error("USER FOUND")
        # Return the user information if the login was successful
        return_obj["name"] = (
            g.user.first_name.capitalize()
            + " "
            + g.user.last_name.capitalize()
        )
        return_obj["email"] = g.user.email
        # return_obj["terms_agreement"] = g.user.terms_agreement
        return_obj["osm_username"] = g.user.osm_username
        return_obj["payment_email"] = g.user.payment_email
        return_obj["city"] = g.user.city
        return_obj["country"] = g.user.country
        return_obj["role"] = g.user.role
        return_obj["id"] = g.user.id
        return_obj["status"] = 200
        return return_obj
