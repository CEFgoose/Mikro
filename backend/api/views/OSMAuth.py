#!/usr/bin/env python3
"""
OSM OAuth API endpoint for Mikro.

Handles OSM account linking via OAuth 2.0.
Users verify they own their OSM account through this flow.
"""

import hashlib
import hmac
import secrets
from datetime import datetime
from urllib.parse import urlencode

import requests
from flask import current_app, g, jsonify, redirect, request
from flask.views import MethodView

from ..database import User


class OSMAuthAPI(MethodView):
    """
    OSM OAuth endpoint for account linking.

    Endpoints:
    - POST /api/osm/start - Initiates OAuth flow, returns authorization URL
    - GET /api/osm/callback - Handles OAuth callback from OSM
    - POST /api/osm/unlink - Unlinks OSM account
    - GET /api/osm/status - Returns current OSM linking status
    """

    def get(self, path: str):
        """Handle GET requests."""
        if path == "callback":
            return self._oauth_callback()
        elif path == "status":
            return self._get_status()
        return jsonify({"message": "Endpoint not found"}), 404

    def post(self, path: str):
        """Handle POST requests."""
        if path == "start":
            return self._start_oauth()
        elif path == "unlink":
            return self._unlink_osm()
        return jsonify({"message": "Endpoint not found"}), 404

    def _get_status(self):
        """
        Get current OSM linking status for the authenticated user.

        Returns:
            JSON with OSM linking status
        """
        if not hasattr(g, "user") or not g.user:
            return jsonify({"message": "Unauthorized"}), 401

        user = g.user
        return jsonify(
            {
                "osm_id": user.osm_id,
                "osm_username": user.osm_username,
                "osm_verified": user.osm_verified,
                "osm_verified_at": (
                    user.osm_verified_at.isoformat() if user.osm_verified_at else None
                ),
            }
        )

    def _create_signed_state(self, user_id: str) -> str:
        """
        Create a signed state token that encodes the user_id.

        Format: {nonce}:{user_id}:{signature}
        """
        secret = current_app.config.get("SECRET_KEY", "")
        nonce = secrets.token_urlsafe(16)
        message = f"{nonce}:{user_id}"
        signature = hmac.new(
            secret.encode(), message.encode(), hashlib.sha256
        ).hexdigest()[:16]
        return f"{nonce}:{user_id}:{signature}"

    def _verify_signed_state(self, state: str) -> str | None:
        """
        Verify a signed state token and extract the user_id.

        Returns user_id if valid, None if invalid.
        """
        try:
            parts = state.split(":")
            if len(parts) != 3:
                return None
            nonce, user_id, signature = parts
            secret = current_app.config.get("SECRET_KEY", "")
            message = f"{nonce}:{user_id}"
            expected_sig = hmac.new(
                secret.encode(), message.encode(), hashlib.sha256
            ).hexdigest()[:16]
            if hmac.compare_digest(signature, expected_sig):
                return user_id
            return None
        except Exception:
            return None

    def _start_oauth(self):
        """
        Initiate OSM OAuth flow.

        Returns:
            JSON with authorization URL to redirect user to
        """
        if not hasattr(g, "user") or not g.user:
            return jsonify({"message": "Unauthorized"}), 401

        client_id = current_app.config.get("OSM_OAUTH_CLIENT_ID")
        redirect_uri = current_app.config.get("OSM_OAUTH_REDIRECT_URI")
        osm_url = current_app.config.get("OSM_API_URL")

        if not client_id:
            current_app.logger.error("OSM_OAUTH_CLIENT_ID not configured")
            return jsonify({"message": "OSM OAuth not configured"}), 500

        # Create signed state that encodes user_id (no Flask session needed)
        state = self._create_signed_state(g.user.id)

        # Build authorization URL
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "read_prefs",
            "state": state,
        }

        auth_url = f"{osm_url}/oauth2/authorize?{urlencode(params)}"

        return jsonify({"auth_url": auth_url})

    def _oauth_callback(self):
        """
        Handle OAuth callback from OSM.

        Exchanges authorization code for token, fetches user info,
        and updates the user's OSM account linking.

        Returns:
            Redirect to frontend account page with success/error status
        """
        code = request.args.get("code")
        state = request.args.get("state")
        error = request.args.get("error")

        # Frontend URL for redirect after OAuth (configurable for dev/prod)
        base_url = current_app.config.get("FRONTEND_URL", "http://localhost:3000")
        frontend_url = request.args.get("redirect", f"{base_url}/account")

        if error:
            current_app.logger.error(f"OSM OAuth error: {error}")
            return redirect(f"{frontend_url}?osm_error={error}")

        if not code or not state:
            return redirect(f"{frontend_url}?osm_error=missing_params")

        # Verify signed state token and extract user_id
        user_id = self._verify_signed_state(state)
        if not user_id:
            current_app.logger.error("OSM OAuth state verification failed")
            return redirect(f"{frontend_url}?osm_error=invalid_state")

        # Exchange code for token
        token_data = self._exchange_code_for_token(code)
        if not token_data:
            return redirect(f"{frontend_url}?osm_error=token_exchange_failed")

        access_token = token_data.get("access_token")
        if not access_token:
            return redirect(f"{frontend_url}?osm_error=no_access_token")

        # Fetch OSM user info
        osm_user = self._fetch_osm_user(access_token)
        if not osm_user:
            return redirect(f"{frontend_url}?osm_error=fetch_user_failed")

        osm_id = osm_user.get("id")
        osm_username = osm_user.get("display_name")

        if not osm_id or not osm_username:
            return redirect(f"{frontend_url}?osm_error=invalid_osm_user")

        # Check if this OSM account is already linked to another user
        existing_user = User.query.filter_by(osm_id=osm_id).first()
        if existing_user and existing_user.id != user_id:
            current_app.logger.error(
                f"OSM account {osm_id} already linked to user {existing_user.id}"
            )
            return redirect(f"{frontend_url}?osm_error=already_linked")

        # Update user with verified OSM info
        user = User.query.get(user_id)
        if not user:
            return redirect(f"{frontend_url}?osm_error=user_not_found")

        try:
            user.update(
                osm_id=osm_id,
                osm_username=osm_username,
                osm_verified=True,
                osm_verified_at=datetime.utcnow(),
            )
            current_app.logger.info(
                f"User {user_id} linked OSM account: {osm_username} (ID: {osm_id})"
            )
        except Exception as e:
            current_app.logger.error(f"Error updating user OSM info: {e}")
            return redirect(f"{frontend_url}?osm_error=update_failed")

        return redirect(f"{frontend_url}?osm_linked=true")

    def _exchange_code_for_token(self, code: str) -> dict | None:
        """
        Exchange authorization code for access token.

        Args:
            code: Authorization code from OSM

        Returns:
            Token response dict or None on failure
        """
        client_id = current_app.config.get("OSM_OAUTH_CLIENT_ID")
        client_secret = current_app.config.get("OSM_OAUTH_CLIENT_SECRET")
        redirect_uri = current_app.config.get("OSM_OAUTH_REDIRECT_URI")
        osm_url = current_app.config.get("OSM_API_URL")

        token_url = f"{osm_url}/oauth2/token"

        try:
            response = requests.post(
                token_url,
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": redirect_uri,
                    "client_id": client_id,
                    "client_secret": client_secret,
                },
                headers={"Accept": "application/json"},
                timeout=30,
            )

            if response.status_code != 200:
                current_app.logger.error(
                    f"OSM token exchange failed: {response.status_code} {response.text}"
                )
                return None

            return response.json()
        except Exception as e:
            current_app.logger.error(f"OSM token exchange error: {e}")
            return None

    def _fetch_osm_user(self, access_token: str) -> dict | None:
        """
        Fetch OSM user details using access token.

        Args:
            access_token: OAuth access token

        Returns:
            User details dict or None on failure
        """
        try:
            response = requests.get(
                "https://api.openstreetmap.org/api/0.6/user/details.json",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json",
                },
                timeout=30,
            )

            if response.status_code != 200:
                current_app.logger.error(
                    f"OSM user fetch failed: {response.status_code} {response.text}"
                )
                return None

            data = response.json()
            return data.get("user")
        except Exception as e:
            current_app.logger.error(f"OSM user fetch error: {e}")
            return None

    def _unlink_osm(self):
        """
        Unlink OSM account from user.

        Returns:
            JSON response with success/error
        """
        if not hasattr(g, "user") or not g.user:
            return jsonify({"message": "Unauthorized"}), 401

        user = g.user

        try:
            user.update(
                osm_id=None,
                osm_username=None,
                osm_verified=False,
                osm_verified_at=None,
            )
            current_app.logger.info(f"User {user.id} unlinked OSM account")
            return jsonify({"message": "OSM account unlinked successfully"})
        except Exception as e:
            current_app.logger.error(f"Error unlinking OSM: {e}")
            return jsonify({"message": "Failed to unlink OSM account"}), 500
