"""
Auth0 JWT validation module for Mikro API.

This module provides JWT token validation against Auth0's JWKS endpoint.
Pattern adapted from Viewer application.
"""

import json
import os
from urllib.request import urlopen

from flask import request, jsonify, g, current_app
from jose import jwt
import requests


class AuthError(Exception):
    """Custom exception for authentication errors."""

    def __init__(self, error, status_code):
        self.error = error
        self.status_code = status_code


def get_token_auth_header():
    """
    Extract the Bearer token from the Authorization header.

    Returns:
        str: The JWT token

    Raises:
        AuthError: If the header is missing or malformed
    """
    auth = request.headers.get("Authorization", None)

    if not auth:
        raise AuthError(
            {
                "code": "authorization_header_missing",
                "description": "Authorization header is expected",
            },
            401,
        )

    parts = auth.split()

    if parts[0].lower() != "bearer":
        raise AuthError(
            {
                "code": "invalid_header",
                "description": "Authorization header must start with Bearer",
            },
            401,
        )
    elif len(parts) == 1:
        raise AuthError(
            {"code": "invalid_header", "description": "Token not found"}, 401
        )
    elif len(parts) > 2:
        raise AuthError(
            {
                "code": "invalid_header",
                "description": "Authorization header must be Bearer token",
            },
            401,
        )

    return parts[1]


def authenticate_request():
    """
    Validate JWT token from Authorization header.

    This function is called before each request to validate the JWT token.
    It fetches the JWKS from Auth0 and validates the token signature,
    audience, and issuer.

    Returns:
        None on success, or a JSON error response on failure
    """
    # Skip auth for health checks and preflight OPTIONS requests
    if request.method == "OPTIONS":
        return None

    if request.path in ["/health", "/api/health"]:
        return None

    try:
        auth0_domain = current_app.config.get("AUTH0_DOMAIN")
        api_audience = current_app.config.get("API_AUDIENCE")
        algorithms = current_app.config.get("ALGORITHMS", ["RS256"])

        if not auth0_domain:
            current_app.logger.error("AUTH0_DOMAIN not configured")
            raise AuthError(
                {"code": "config_error", "description": "Auth0 not configured"}, 500
            )

        token = get_token_auth_header()

        # Fetch JWKS from Auth0
        jsonurl = urlopen(f"https://{auth0_domain}/.well-known/jwks.json")
        jwks = json.loads(jsonurl.read())

        # Get the unverified header to find the key ID
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}

        # Find the matching key in JWKS
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"],
                }
                break

        if rsa_key:
            try:
                # Decode and validate the token
                payload = jwt.decode(
                    token,
                    rsa_key,
                    algorithms=algorithms,
                    audience=api_audience,
                    issuer=f"https://{auth0_domain}/",
                )

                # Store the decoded payload in Flask's g object
                g.current_user = payload

                # Try to load the user from the database
                try:
                    from ..database import User

                    auth0_sub = payload.get("sub")
                    if auth0_sub:
                        user = User.query.filter_by(auth0_sub=auth0_sub).first()
                        g.user = user
                    else:
                        g.user = None
                except Exception as e:
                    current_app.logger.warning(f"Could not load user from DB: {e}")
                    g.user = None

                return None

            except jwt.ExpiredSignatureError:
                raise AuthError(
                    {"code": "token_expired", "description": "Token has expired"}, 401
                )

            except jwt.JWTClaimsError:
                raise AuthError(
                    {
                        "code": "invalid_claims",
                        "description": "Incorrect claims. Please check the audience and issuer",
                    },
                    401,
                )

            except Exception as e:
                current_app.logger.error(f"Token parsing error: {e}")
                raise AuthError(
                    {
                        "code": "invalid_header",
                        "description": "Unable to parse authentication token",
                    },
                    401,
                )

        raise AuthError(
            {"code": "invalid_header", "description": "Unable to find appropriate key"},
            401,
        )

    except AuthError as e:
        return jsonify(e.error), e.status_code

    except Exception as e:
        current_app.logger.error(f"Authentication error: {e}")
        return (
            jsonify(
                {
                    "code": "auth_error",
                    "description": f"An error occurred during authentication: {str(e)}",
                }
            ),
            401,
        )


def get_auth0_management_api_token():
    """
    Retrieve an access token for Auth0 Management API.

    This is used for server-to-server calls to Auth0's Management API,
    such as creating users or updating user metadata.

    Returns:
        str: Access token for Management API, or None on failure
    """
    auth0_domain = os.getenv("AUTH0_DOMAIN")
    client_id = os.getenv("AUTH0_M2M_CLIENT_ID")
    client_secret = os.getenv("AUTH0_M2M_CLIENT_SECRET")

    if not all([auth0_domain, client_id, client_secret]):
        print("Missing Auth0 M2M credentials")
        return None

    url = f"https://{auth0_domain}/oauth/token"

    payload = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
        "audience": f"https://{auth0_domain}/api/v2/",
    }

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json()["access_token"]
    except requests.RequestException as e:
        print(f"Failed to retrieve Auth0 Management API token: {e}")
        return None
