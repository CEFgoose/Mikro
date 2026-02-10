#!/usr/bin/env python3
"""
Time Tracking API endpoints for Mikro.

Handles clock in/out, session management, and admin oversight
for contractor time tracking with OSM changeset correlation.
"""

import logging
from datetime import datetime

import requests as http_requests
from flask.views import MethodView
from flask import g, request, jsonify

from ..utils import requires_admin
from ..database import TimeEntry, User, Project, db

logger = logging.getLogger(__name__)

VALID_CATEGORIES = {"mapping", "validation", "review", "training", "other"}


class TimeTrackingAPI(MethodView):
    """Time tracking management API endpoints."""

    def post(self, path: str):
        # User endpoints
        if path == "clock_in":
            return self.clock_in()
        elif path == "clock_out":
            return self.clock_out()
        elif path == "my_active_session":
            return self.my_active_session()
        elif path == "my_history":
            return self.my_history()
        # Admin endpoints
        elif path == "active_sessions":
            return self.admin_active_sessions()
        elif path == "history":
            return self.admin_history()
        elif path == "force_clock_out":
            return self.admin_force_clock_out()
        elif path == "void_entry":
            return self.admin_void_entry()
        elif path == "edit_entry":
            return self.admin_edit_entry()
        elif path == "request_adjustment":
            return self.request_adjustment()

        return jsonify({"message": "Endpoint not found", "status": 404}), 404

    # ─── Helpers ───────────────────────────────────────────────

    @staticmethod
    def _format_entry(entry):
        """Format a TimeEntry for JSON response."""
        user = User.query.get(entry.user_id)
        project = Project.query.get(entry.project_id) if entry.project_id else None

        duration = None
        if entry.duration_seconds is not None:
            hours = entry.duration_seconds // 3600
            minutes = (entry.duration_seconds % 3600) // 60
            seconds = entry.duration_seconds % 60
            duration = f"{hours:02d}:{minutes:02d}:{seconds:02d}"

        return {
            "id": entry.id,
            "userId": entry.user_id,
            "userName": user.full_name if user else "Unknown",
            "projectId": entry.project_id,
            "projectName": project.name if project else "No Project",
            "category": entry.category.capitalize() if entry.category else "",
            "clockIn": entry.clock_in.isoformat() + "Z" if entry.clock_in else None,
            "clockOut": entry.clock_out.isoformat() + "Z" if entry.clock_out else None,
            "duration": duration,
            "durationSeconds": entry.duration_seconds,
            "status": entry.status,
            "changesetCount": entry.changeset_count or 0,
            "changesCount": entry.changes_count or 0,
            "notes": entry.notes,
            "voidedBy": entry.voided_by,
            "voidedAt": entry.voided_at.isoformat() + "Z" if entry.voided_at else None,
            "editedBy": entry.edited_by,
            "editedAt": entry.edited_at.isoformat() + "Z" if entry.edited_at else None,
            "forceClockedOutBy": entry.force_clocked_out_by,
        }

    @staticmethod
    def _fetch_osm_changesets(osm_username, clock_in_time):
        """
        Fetch OSM changesets for a user since clock_in_time.

        Returns (changeset_count, changes_count) tuple.
        Best-effort: returns (0, 0) on any failure.
        """
        if not osm_username:
            return 0, 0

        time_str = clock_in_time.strftime("%Y-%m-%dT%H:%M:%SZ")
        url = (
            f"https://api.openstreetmap.org/api/0.6/changesets.json"
            f"?display_name={osm_username}&time={time_str}"
        )

        for attempt in range(3):
            try:
                resp = http_requests.get(url, timeout=30)
                if resp.status_code == 429:
                    import time
                    time.sleep(2 ** attempt)
                    continue
                resp.raise_for_status()
                data = resp.json()
                changesets = data.get("changesets", [])
                changeset_count = len(changesets)
                changes_count = sum(
                    cs.get("changes_count", 0) for cs in changesets
                )
                return changeset_count, changes_count
            except Exception as e:
                logger.warning(
                    f"OSM changeset fetch attempt {attempt + 1} failed for "
                    f"{osm_username}: {e}"
                )
                if attempt < 2:
                    import time
                    time.sleep(2 ** attempt)

        logger.error(f"OSM changeset fetch failed after 3 attempts for {osm_username}")
        return 0, 0

    # ─── User Endpoints ───────────────────────────────────────

    def clock_in(self):
        """Clock in the current user."""
        if not hasattr(g, "user") or not g.user:
            return jsonify({"message": "Unauthorized", "status": 401}), 401

        data = request.get_json() or {}
        project_id = data.get("project_id")
        category = data.get("category", "").lower()

        # Validate category
        if category not in VALID_CATEGORIES:
            return jsonify({
                "message": f"Invalid category. Must be one of: {', '.join(VALID_CATEGORIES)}",
                "status": 400,
            }), 400

        # Validate project if provided
        if project_id:
            project = Project.query.get(project_id)
            if not project:
                return jsonify({
                    "message": "Project not found",
                    "status": 404,
                }), 404

        # Check for existing active session
        active = TimeEntry.query.filter_by(
            user_id=g.user.id, status="active"
        ).first()
        if active:
            return jsonify({
                "message": "You already have an active session. Clock out first.",
                "status": 409,
            }), 409

        # Create new time entry
        entry = TimeEntry()
        entry.user_id = g.user.id
        entry.project_id = project_id
        entry.org_id = g.user.org_id
        entry.category = category
        entry.clock_in = datetime.utcnow()
        entry.status = "active"
        entry.save()

        return jsonify({
            "message": "Clocked in successfully",
            "status": 200,
            "session_id": entry.id,
            "session": self._format_entry(entry),
        }), 200

    def clock_out(self):
        """Clock out the current user."""
        if not hasattr(g, "user") or not g.user:
            return jsonify({"message": "Unauthorized", "status": 401}), 401

        data = request.get_json() or {}
        session_id = data.get("session_id")

        # Find active session
        if session_id:
            entry = TimeEntry.query.filter_by(
                id=session_id, user_id=g.user.id, status="active"
            ).first()
        else:
            entry = TimeEntry.query.filter_by(
                user_id=g.user.id, status="active"
            ).first()

        if not entry:
            return jsonify({
                "message": "No active session found",
                "status": 404,
            }), 404

        # Clock out
        now = datetime.utcnow()
        entry.clock_out = now
        entry.duration_seconds = int((now - entry.clock_in).total_seconds())
        entry.status = "completed"

        # Fetch OSM changesets (best-effort)
        osm_username = getattr(g.user, "osm_username", None)
        if osm_username:
            changeset_count, changes_count = self._fetch_osm_changesets(
                osm_username, entry.clock_in
            )
            entry.changeset_count = changeset_count
            entry.changes_count = changes_count

        entry.save()

        return jsonify({
            "message": "Clocked out successfully",
            "status": 200,
            "duration_seconds": entry.duration_seconds,
            "session": self._format_entry(entry),
        }), 200

    def my_active_session(self):
        """Get the current user's active session."""
        if not hasattr(g, "user") or not g.user:
            return jsonify({"message": "Unauthorized", "status": 401}), 401

        entry = TimeEntry.query.filter_by(
            user_id=g.user.id, status="active"
        ).first()

        return jsonify({
            "status": 200,
            "session": self._format_entry(entry) if entry else None,
        }), 200

    def my_history(self):
        """Get the current user's time entry history."""
        if not hasattr(g, "user") or not g.user:
            return jsonify({"message": "Unauthorized", "status": 401}), 401

        entries = (
            TimeEntry.query
            .filter(
                TimeEntry.user_id == g.user.id,
                TimeEntry.status.in_(["completed", "voided"]),
            )
            .order_by(TimeEntry.clock_in.desc())
            .limit(100)
            .all()
        )

        return jsonify({
            "status": 200,
            "entries": [self._format_entry(e) for e in entries],
        }), 200

    def request_adjustment(self):
        """Request an adjustment to a time entry."""
        if not hasattr(g, "user") or not g.user:
            return jsonify({"message": "Unauthorized", "status": 401}), 401

        data = request.get_json() or {}
        entry_id = data.get("entry_id")
        reason = data.get("reason", "").strip()

        if not entry_id:
            return jsonify({
                "message": "entry_id is required",
                "status": 400,
            }), 400

        if not reason:
            return jsonify({
                "message": "reason is required",
                "status": 400,
            }), 400

        entry = TimeEntry.query.filter_by(
            id=entry_id, user_id=g.user.id
        ).first()

        if not entry:
            return jsonify({
                "message": "Entry not found",
                "status": 404,
            }), 404

        if entry.status == "voided":
            return jsonify({
                "message": "Cannot request adjustment for a voided entry",
                "status": 400,
            }), 400

        entry.notes = f"[ADJUSTMENT REQUESTED] {reason}"
        entry.save()

        return jsonify({
            "message": "Adjustment request submitted",
            "status": 200,
        }), 200

    # ─── Admin Endpoints ──────────────────────────────────────

    @requires_admin
    def admin_active_sessions(self):
        """Get all active sessions for the admin's org."""
        entries = (
            TimeEntry.query
            .filter_by(org_id=g.user.org_id, status="active")
            .order_by(TimeEntry.clock_in.asc())
            .all()
        )

        return jsonify({
            "status": 200,
            "sessions": [self._format_entry(e) for e in entries],
        }), 200

    @requires_admin
    def admin_history(self):
        """Get time entry history for the admin's org."""
        entries = (
            TimeEntry.query
            .filter(
                TimeEntry.org_id == g.user.org_id,
                TimeEntry.status.in_(["completed", "voided"]),
            )
            .order_by(TimeEntry.clock_in.desc())
            .limit(100)
            .all()
        )

        return jsonify({
            "status": 200,
            "entries": [self._format_entry(e) for e in entries],
        }), 200

    @requires_admin
    def admin_force_clock_out(self):
        """Force clock out a user's session."""
        data = request.get_json() or {}
        session_id = data.get("session_id")

        if not session_id:
            return jsonify({
                "message": "session_id is required",
                "status": 400,
            }), 400

        entry = TimeEntry.query.filter_by(
            id=session_id, org_id=g.user.org_id, status="active"
        ).first()

        if not entry:
            return jsonify({
                "message": "Active session not found",
                "status": 404,
            }), 404

        now = datetime.utcnow()
        entry.clock_out = now
        entry.duration_seconds = int((now - entry.clock_in).total_seconds())
        entry.status = "completed"
        entry.force_clocked_out_by = g.user.id

        # Fetch OSM changesets (best-effort)
        user = User.query.get(entry.user_id)
        if user and user.osm_username:
            changeset_count, changes_count = self._fetch_osm_changesets(
                user.osm_username, entry.clock_in
            )
            entry.changeset_count = changeset_count
            entry.changes_count = changes_count

        entry.save()

        return jsonify({
            "message": "Force clock out successful",
            "status": 200,
            "session": self._format_entry(entry),
        }), 200

    @requires_admin
    def admin_void_entry(self):
        """Void a time entry."""
        data = request.get_json() or {}
        entry_id = data.get("entry_id")

        if not entry_id:
            return jsonify({
                "message": "entry_id is required",
                "status": 400,
            }), 400

        entry = TimeEntry.query.filter_by(
            id=entry_id, org_id=g.user.org_id
        ).first()

        if not entry:
            return jsonify({
                "message": "Entry not found",
                "status": 404,
            }), 404

        if entry.status == "voided":
            return jsonify({
                "message": "Entry is already voided",
                "status": 400,
            }), 400

        entry.status = "voided"
        entry.voided_by = g.user.id
        entry.voided_at = datetime.utcnow()
        entry.save()

        return jsonify({
            "message": "Entry voided",
            "status": 200,
            "entry": self._format_entry(entry),
        }), 200

    @requires_admin
    def admin_edit_entry(self):
        """Edit a time entry's times or category."""
        data = request.get_json() or {}
        entry_id = data.get("entry_id")

        if not entry_id:
            return jsonify({
                "message": "entry_id is required",
                "status": 400,
            }), 400

        entry = TimeEntry.query.filter_by(
            id=entry_id, org_id=g.user.org_id
        ).first()

        if not entry:
            return jsonify({
                "message": "Entry not found",
                "status": 404,
            }), 404

        # Parse optional fields
        if "clockIn" in data:
            try:
                entry.clock_in = datetime.fromisoformat(
                    data["clockIn"].replace("Z", "+00:00")
                ).replace(tzinfo=None)
            except (ValueError, AttributeError):
                return jsonify({
                    "message": "Invalid clockIn format. Use ISO 8601.",
                    "status": 400,
                }), 400

        if "clockOut" in data:
            try:
                entry.clock_out = datetime.fromisoformat(
                    data["clockOut"].replace("Z", "+00:00")
                ).replace(tzinfo=None)
            except (ValueError, AttributeError):
                return jsonify({
                    "message": "Invalid clockOut format. Use ISO 8601.",
                    "status": 400,
                }), 400

        if "category" in data:
            cat = data["category"].lower()
            if cat not in VALID_CATEGORIES:
                return jsonify({
                    "message": f"Invalid category. Must be one of: {', '.join(VALID_CATEGORIES)}",
                    "status": 400,
                }), 400
            entry.category = cat

        # Recalculate duration if both times present
        if entry.clock_in and entry.clock_out:
            entry.duration_seconds = int(
                (entry.clock_out - entry.clock_in).total_seconds()
            )

        entry.edited_by = g.user.id
        entry.edited_at = datetime.utcnow()
        entry.save()

        return jsonify({
            "message": "Entry updated",
            "status": 200,
            "entry": self._format_entry(entry),
        }), 200
