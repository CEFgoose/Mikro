#!/usr/bin/env python3
"""
Time Tracking API endpoints for Mikro.

Handles clock in/out, session management, and admin oversight
for contractor time tracking with OSM changeset correlation.
"""

import csv
import io
import logging
from datetime import datetime, timedelta

import requests as http_requests
from flask.views import MethodView
from flask import g, request, jsonify, Response

from ..utils import requires_admin
from ..database import TimeEntry, User, Project, TeamUser, CustomTopic, db
from ..filters import resolve_filtered_user_ids

logger = logging.getLogger(__name__)

VALID_CATEGORIES = {
    "editing", "validating", "training", "checklist",
    "qc_review", "meeting", "documentation", "imagery_capture", "other",
    # Legacy values — still accepted for backward compat
    "mapping", "validation", "review",
}

# Map stored category values to display labels
CATEGORY_DISPLAY_MAP = {
    "editing": "Editing",
    "validating": "Validating",
    "training": "Training",
    "checklist": "Checklist",
    "qc_review": "QC / Review",
    "meeting": "Meeting",
    "documentation": "Documentation",
    "imagery_capture": "Imagery Capture",
    "other": "Other",
    # Legacy mappings
    "mapping": "Editing",
    "validation": "Validating",
    "review": "QC / Review",
}


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
        elif path == "admin_add_entry":
            return self.admin_add_entry()
        elif path == "admin_add_test_entry":
            return self.admin_add_test_entry()
        elif path == "purge_all_time_entries":
            return self.purge_all_time_entries()
        elif path == "request_adjustment":
            return self.request_adjustment()
        elif path == "export":
            return self.admin_export()
        elif path == "fetch_custom_topics":
            return self.fetch_custom_topics()

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
            "firstName": (user.first_name or "") if user else "",
            "lastName": (user.last_name or "") if user else "",
            "projectId": entry.project_id,
            "projectName": project.name if project else "No Project",
            "projectShortName": (project.short_name or "") if project else "",
            "category": CATEGORY_DISPLAY_MAP.get(entry.category, entry.category.capitalize() if entry.category else ""),
            "taskName": entry.task_name,
            "taskRefType": entry.task_ref_type,
            "taskRefId": entry.task_ref_id,
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

    @staticmethod
    def _parse_date(date_str):
        """Parse an ISO date or datetime string. Returns naive datetime or None."""
        if not date_str:
            return None
        try:
            dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            return dt.replace(tzinfo=None)
        except (ValueError, AttributeError):
            try:
                return datetime.strptime(date_str, "%Y-%m-%d")
            except (ValueError, AttributeError):
                return None

    @staticmethod
    def _build_filtered_query(org_id, data, restrict_user_id=None):
        """
        Build a filtered TimeEntry query from request data.

        Args:
            org_id: Organization ID to scope entries
            data: Request JSON dict with optional filter params
            restrict_user_id: If set, always filter to this user only

        Returns:
            SQLAlchemy query object (not yet executed)
        """
        conditions = [
            TimeEntry.org_id == org_id,
            TimeEntry.status.in_(["completed", "voided"]),
        ]

        # Always restrict to a single user if specified
        if restrict_user_id:
            conditions.append(TimeEntry.user_id == restrict_user_id)
        else:
            # Admin-level filters
            filters = data.get("filters")
            user_id = data.get("userId")
            team_id = data.get("teamId")

            if filters:
                filtered_ids = resolve_filtered_user_ids(filters, org_id)
                if filtered_ids is not None:
                    conditions.append(TimeEntry.user_id.in_(filtered_ids))
            elif user_id:
                conditions.append(TimeEntry.user_id == user_id)
            elif team_id:
                member_ids = [
                    tu.user_id
                    for tu in TeamUser.query.filter_by(team_id=team_id).all()
                ]
                if member_ids:
                    conditions.append(TimeEntry.user_id.in_(member_ids))
                else:
                    # Team has no members — return empty result
                    conditions.append(TimeEntry.user_id == None)  # noqa: E711

        # Date filters
        start_date = TimeTrackingAPI._parse_date(data.get("startDate"))
        end_date = TimeTrackingAPI._parse_date(data.get("endDate"))
        if start_date:
            conditions.append(TimeEntry.clock_in >= start_date)
        if end_date:
            # If only a date (midnight), add a day for exclusive upper bound
            if end_date.hour == 0 and end_date.minute == 0 and end_date.second == 0:
                end_date = end_date + timedelta(days=1)
            conditions.append(TimeEntry.clock_in < end_date)

        # Category filter
        category = data.get("category")
        if category:
            conditions.append(TimeEntry.category == category.lower())

        return TimeEntry.query.filter(*conditions).order_by(TimeEntry.clock_in.desc())

    # ─── User Endpoints ───────────────────────────────────────

    def clock_in(self):
        """Clock in the current user."""
        if not hasattr(g, "user") or not g.user:
            return jsonify({"message": "Unauthorized", "status": 401}), 401

        data = request.get_json() or {}
        project_id = data.get("project_id")
        category = data.get("category", "").lower()

        logger.info(
            f"[CLOCK] clock_in called by user={g.user.id} "
            f"({g.user.osm_username or g.user.email}) "
            f"project_id={project_id} category={category}"
        )

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
            logger.info(
                f"[CLOCK] clock_in REJECTED — user={g.user.id} already has active session "
                f"id={active.id} clock_in={active.clock_in}"
            )
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
        entry.task_name = data.get("task_name")
        entry.task_ref_type = data.get("task_ref_type")
        entry.task_ref_id = data.get("task_ref_id")
        entry.clock_in = datetime.utcnow()
        entry.status = "active"
        entry.save()

        # If "other" with a custom task_name, upsert into custom_topics
        if category == "other" and entry.task_name:
            existing = CustomTopic.query.filter_by(
                name=entry.task_name, org_id=g.user.org_id
            ).first()
            if not existing:
                topic = CustomTopic()
                topic.name = entry.task_name
                topic.org_id = g.user.org_id
                topic.created_by = g.user.id
                topic.save()

        logger.info(
            f"[CLOCK] clock_in SUCCESS — user={g.user.id} session_id={entry.id} "
            f"clock_in={entry.clock_in} project={project_id} category={category}"
        )

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

        logger.info(
            f"[CLOCK] clock_out called by user={g.user.id} "
            f"({g.user.osm_username or g.user.email}) session_id={session_id}"
        )

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
            logger.warning(
                f"[CLOCK] clock_out FAILED — no active session found for user={g.user.id} "
                f"session_id_requested={session_id}"
            )
            return jsonify({
                "message": "No active session found",
                "status": 404,
            }), 404

        logger.info(
            f"[CLOCK] clock_out PROCESSING — user={g.user.id} session_id={entry.id} "
            f"clock_in={entry.clock_in} project={entry.project_id} category={entry.category}"
        )

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

        logger.info(
            f"[CLOCK] clock_out SUCCESS — user={g.user.id} session_id={entry.id} "
            f"duration={entry.duration_seconds}s changesets={entry.changeset_count} "
            f"changes={entry.changes_count}"
        )

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

        if entry:
            logger.debug(
                f"[CLOCK] active_session CHECK — user={g.user.id} "
                f"found session_id={entry.id} clock_in={entry.clock_in}"
            )
        else:
            logger.debug(
                f"[CLOCK] active_session CHECK — user={g.user.id} NO active session"
            )

        return jsonify({
            "status": 200,
            "session": self._format_entry(entry) if entry else None,
        }), 200

    def my_history(self):
        """Get the current user's time entry history with optional filters."""
        if not hasattr(g, "user") or not g.user:
            return jsonify({"message": "Unauthorized", "status": 401}), 401

        data = request.get_json() or {}
        limit = data.get("limit", 500)
        offset = data.get("offset", 0)

        query = self._build_filtered_query(
            g.user.org_id, data, restrict_user_id=g.user.id
        )

        total = query.count()
        entries = query.limit(limit).offset(offset).all()

        return jsonify({
            "status": 200,
            "entries": [self._format_entry(e) for e in entries],
            "total": total,
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

    def fetch_custom_topics(self):
        """Fetch all custom topics for the user's org."""
        if not hasattr(g, "user") or not g.user:
            return jsonify({"message": "Unauthorized", "status": 401}), 401

        topics = (
            CustomTopic.query
            .filter_by(org_id=g.user.org_id)
            .order_by(CustomTopic.name)
            .all()
        )

        return jsonify({
            "status": 200,
            "topics": [
                {
                    "id": t.id,
                    "name": t.name,
                    "createdBy": t.created_by,
                }
                for t in topics
            ],
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
        """Get time entry history for the admin's org with optional filters."""
        data = request.get_json() or {}
        limit = data.get("limit", 500)
        offset = data.get("offset", 0)

        query = self._build_filtered_query(g.user.org_id, data)

        total = query.count()
        entries = query.limit(limit).offset(offset).all()

        return jsonify({
            "status": 200,
            "entries": [self._format_entry(e) for e in entries],
            "total": total,
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

        logger.warning(
            f"[CLOCK] FORCE clock_out — admin={g.user.id} ({g.user.osm_username or g.user.email}) "
            f"forcing clock_out on session_id={entry.id} owned by user={entry.user_id} "
            f"clock_in={entry.clock_in}"
        )

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

        logger.warning(
            f"[CLOCK] VOID entry — admin={g.user.id} voiding entry_id={entry.id} "
            f"owned by user={entry.user_id} status_was={entry.status}"
        )
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

        if "taskName" in data:
            entry.task_name = data["taskName"]
        if "taskRefType" in data:
            entry.task_ref_type = data["taskRefType"]
        if "taskRefId" in data:
            entry.task_ref_id = data["taskRefId"]

        # Recalculate duration if both times present
        if entry.clock_in and entry.clock_out:
            entry.duration_seconds = int(
                (entry.clock_out - entry.clock_in).total_seconds()
            )

        # Mark adjustment requests as fulfilled
        if entry.notes and entry.notes.startswith("[ADJUSTMENT REQUESTED]"):
            entry.notes = entry.notes.replace(
                "[ADJUSTMENT REQUESTED]", "[ADJUSTED]", 1
            )

        entry.edited_by = g.user.id
        entry.edited_at = datetime.utcnow()
        entry.save()

        return jsonify({
            "message": "Entry updated",
            "status": 200,
            "entry": self._format_entry(entry),
        }), 200

    @requires_admin
    def admin_add_entry(self):
        """Manually create a time entry for a user."""
        data = request.get_json() or {}
        user_id = data.get("userId")
        clock_in_str = data.get("clockIn")
        clock_out_str = data.get("clockOut")
        category = (data.get("category") or "").lower()
        project_id = data.get("projectId")
        notes = data.get("notes", "")

        if not user_id or not clock_in_str or not clock_out_str or not category:
            return jsonify({
                "message": "userId, clockIn, clockOut, and category are required",
                "status": 400,
            }), 400

        if category not in VALID_CATEGORIES:
            return jsonify({
                "message": f"Invalid category. Must be one of: {', '.join(VALID_CATEGORIES)}",
                "status": 400,
            }), 400

        # Validate user exists in same org
        user = User.query.get(user_id)
        if not user or user.org_id != g.user.org_id:
            return jsonify({
                "message": "User not found in your organization",
                "status": 404,
            }), 404

        # Parse times
        try:
            clock_in = datetime.fromisoformat(
                clock_in_str.replace("Z", "+00:00")
            ).replace(tzinfo=None)
        except (ValueError, AttributeError):
            return jsonify({
                "message": "Invalid clockIn format. Use ISO 8601.",
                "status": 400,
            }), 400

        try:
            clock_out = datetime.fromisoformat(
                clock_out_str.replace("Z", "+00:00")
            ).replace(tzinfo=None)
        except (ValueError, AttributeError):
            return jsonify({
                "message": "Invalid clockOut format. Use ISO 8601.",
                "status": 400,
            }), 400

        if clock_out <= clock_in:
            return jsonify({
                "message": "Clock out must be after clock in",
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

        entry = TimeEntry()
        entry.user_id = user_id
        entry.org_id = g.user.org_id
        entry.project_id = project_id
        entry.category = category
        entry.task_name = data.get("taskName")
        entry.task_ref_type = data.get("taskRefType")
        entry.task_ref_id = data.get("taskRefId")
        entry.clock_in = clock_in
        entry.clock_out = clock_out
        entry.duration_seconds = int((clock_out - clock_in).total_seconds())
        entry.status = "completed"
        entry.notes = f"[ADMIN CREATED] {notes}".strip()
        entry.edited_by = g.user.id
        entry.edited_at = datetime.utcnow()
        entry.save()

        # If "other" with a custom task_name, upsert into custom_topics
        if category == "other" and entry.task_name:
            existing = CustomTopic.query.filter_by(
                name=entry.task_name, org_id=g.user.org_id
            ).first()
            if not existing:
                topic = CustomTopic()
                topic.name = entry.task_name
                topic.org_id = g.user.org_id
                topic.created_by = g.user.id
                topic.save()

        return jsonify({
            "message": "Entry created",
            "status": 200,
            "entry": self._format_entry(entry),
        }), 200

    @requires_admin
    def admin_add_test_entry(self):
        """Create an 8-hour test entry for a user (dev tool)."""
        data = request.get_json() or {}
        user_id = data.get("userId")
        project_id = data.get("projectId")
        category = (data.get("category") or "mapping").lower()

        if not user_id:
            return jsonify({
                "message": "userId is required",
                "status": 400,
            }), 400

        if category not in VALID_CATEGORIES:
            category = "mapping"

        # Validate user exists in same org
        user = User.query.get(user_id)
        if not user or user.org_id != g.user.org_id:
            return jsonify({
                "message": "User not found in your organization",
                "status": 404,
            }), 404

        now = datetime.utcnow()
        entry = TimeEntry()
        entry.user_id = user_id
        entry.org_id = g.user.org_id
        entry.project_id = project_id
        entry.category = category
        entry.clock_in = now - timedelta(hours=8)
        entry.clock_out = now
        entry.duration_seconds = 28800
        entry.status = "completed"
        entry.notes = "[DEV TEST ENTRY]"
        entry.edited_by = g.user.id
        entry.edited_at = now
        entry.save()

        return jsonify({
            "message": "Test entry created",
            "status": 200,
            "entry": self._format_entry(entry),
        }), 200

    @requires_admin
    def admin_export(self):
        """Export time entries as CSV, JSON, or PDF with the same filters as history."""
        data = request.get_json() or {}
        export_format = (data.get("format") or "csv").lower()

        if export_format not in ("csv", "json", "pdf"):
            return jsonify({
                "message": "Invalid format. Must be csv, json, or pdf.",
                "status": 400,
            }), 400

        # Build filtered query (no limit/offset for export — get all matching)
        query = self._build_filtered_query(g.user.org_id, data)
        entries = query.all()

        today_str = datetime.utcnow().strftime("%Y-%m-%d")

        if export_format == "csv":
            return self._export_csv(entries, today_str)
        elif export_format == "json":
            return self._export_json(entries, today_str)
        elif export_format == "pdf":
            return self._export_pdf(entries, data, today_str)

    @staticmethod
    def _format_duration_hours(duration_seconds):
        """Format duration in seconds to a human-readable hours string."""
        if duration_seconds is None:
            return ""
        hours = duration_seconds / 3600
        return f"{hours:.2f}"

    def _export_csv(self, entries, today_str):
        """Generate a CSV export of time entries."""
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "User", "OSM Username", "Project", "Category", "Task",
            "Clock In", "Clock Out", "Duration (hours)", "Status",
            "Changesets", "Changes", "Notes",
        ])

        for entry in entries:
            user = User.query.get(entry.user_id)
            project = Project.query.get(entry.project_id) if entry.project_id else None
            writer.writerow([
                user.full_name if user else "Unknown",
                user.osm_username if user else "",
                project.name if project else "",
                CATEGORY_DISPLAY_MAP.get(entry.category, entry.category.capitalize() if entry.category else ""),
                entry.task_name or "",
                entry.clock_in.isoformat() + "Z" if entry.clock_in else "",
                entry.clock_out.isoformat() + "Z" if entry.clock_out else "",
                self._format_duration_hours(entry.duration_seconds),
                entry.status or "",
                entry.changeset_count or 0,
                entry.changes_count or 0,
                entry.notes or "",
            ])

        csv_data = output.getvalue()
        output.close()

        return Response(
            csv_data,
            mimetype="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="time-report-{today_str}.csv"'
            },
        )

    def _export_json(self, entries, today_str):
        """Generate a JSON export of time entries."""
        formatted = [self._format_entry(e) for e in entries]
        resp = jsonify(formatted)
        resp.headers["Content-Disposition"] = (
            f'attachment; filename="time-report-{today_str}.json"'
        )
        return resp

    def _export_pdf(self, entries, data, today_str):
        """Generate a PDF export of time entries."""
        try:
            from reportlab.lib.pagesizes import letter, landscape
            from reportlab.lib import colors
            from reportlab.platypus import (
                SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
            )
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.lib.units import inch
        except ImportError:
            return jsonify({
                "message": "PDF export requires the reportlab library. Install with: pip install reportlab",
                "status": 500,
            }), 500

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=landscape(letter),
            leftMargin=0.5 * inch, rightMargin=0.5 * inch,
            topMargin=0.5 * inch, bottomMargin=0.5 * inch,
        )
        styles = getSampleStyleSheet()
        elements = []

        # Title
        elements.append(Paragraph("Mikro Time Report", styles["Title"]))

        # Filter summary
        summary_parts = []
        if data.get("startDate"):
            summary_parts.append(f"From: {data['startDate']}")
        if data.get("endDate"):
            summary_parts.append(f"To: {data['endDate']}")
        if data.get("category"):
            summary_parts.append(f"Category: {data['category']}")
        if data.get("teamId"):
            summary_parts.append(f"Team ID: {data['teamId']}")
        if data.get("userId"):
            summary_parts.append(f"User ID: {data['userId']}")
        if summary_parts:
            elements.append(Paragraph(
                " | ".join(summary_parts), styles["Normal"]
            ))
        elements.append(Spacer(1, 12))

        # Build table data
        headers = [
            "User", "OSM Username", "Project", "Category", "Task",
            "Clock In", "Clock Out", "Duration (h)", "Status",
            "Changesets", "Changes",
        ]
        table_data = [headers]

        total_seconds = 0
        total_changesets = 0
        total_changes = 0

        for entry in entries:
            user = User.query.get(entry.user_id)
            project = (
                Project.query.get(entry.project_id) if entry.project_id else None
            )
            dur_secs = entry.duration_seconds or 0
            total_seconds += dur_secs
            total_changesets += entry.changeset_count or 0
            total_changes += entry.changes_count or 0

            table_data.append([
                (user.full_name if user else "Unknown")[:20],
                (user.osm_username if user else "")[:20],
                (project.name if project else "")[:20],
                CATEGORY_DISPLAY_MAP.get(entry.category, entry.category.capitalize() if entry.category else ""),
                (entry.task_name or "")[:20],
                (entry.clock_in.strftime("%Y-%m-%d %H:%M") if entry.clock_in else ""),
                (entry.clock_out.strftime("%Y-%m-%d %H:%M") if entry.clock_out else ""),
                self._format_duration_hours(dur_secs),
                entry.status or "",
                str(entry.changeset_count or 0),
                str(entry.changes_count or 0),
            ])

        # Totals row
        table_data.append([
            "TOTALS", "", "", "", "", "", "",
            self._format_duration_hours(total_seconds),
            f"{len(entries)} entries",
            str(total_changesets),
            str(total_changes),
        ])

        # Create and style table
        col_widths = [
            1.0 * inch, 1.0 * inch, 1.0 * inch, 0.8 * inch, 0.8 * inch,
            1.1 * inch, 1.1 * inch, 0.7 * inch, 0.6 * inch,
            0.6 * inch, 0.6 * inch,
        ]
        table = Table(table_data, colWidths=col_widths, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563eb")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 7),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#f0f4ff")]),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#e2e8f0")),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        elements.append(table)

        # Footer
        elements.append(Spacer(1, 12))
        elements.append(Paragraph(
            f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
            styles["Normal"],
        ))

        doc.build(elements)
        pdf_data = buffer.getvalue()
        buffer.close()

        return Response(
            pdf_data,
            mimetype="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="time-report-{today_str}.pdf"'
            },
        )

    @requires_admin
    def purge_all_time_entries(self):
        """DEV ONLY: Delete all time entries for the admin's org."""
        entries = TimeEntry.query.filter_by(org_id=g.user.org_id).all()
        count = len(entries)
        for entry in entries:
            db.session.delete(entry)
        db.session.commit()

        return jsonify({
            "message": f"Purged {count} time entries",
            "entries_deleted": count,
            "status": 200,
        }), 200
