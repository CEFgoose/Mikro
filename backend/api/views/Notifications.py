#!/usr/bin/env python3
"""
Notifications API — bell menu + user preference management.

All endpoints are self-scoped to g.user: a caller can only fetch,
mark-read, or update prefs for themselves. Per-org siloing is enforced
by filtering Notification.org_id alongside user_id.
"""

from datetime import datetime, timedelta

from flask import g, jsonify, request
from flask.views import MethodView

from ..database import Notification, User, db
from ..notifications import NOTIFICATION_EMAIL_PREFS


# All notify_* columns on User, for the preferences endpoints.
PREFERENCE_FIELDS = list(dict.fromkeys(NOTIFICATION_EMAIL_PREFS.values()))


class NotificationsAPI(MethodView):
    """Self-scoped notification endpoints."""

    def post(self, path: str):
        if path == "fetch":
            return self.fetch()
        elif path == "unread_count":
            return self.unread_count()
        elif path == "mark_read":
            return self.mark_read()
        elif path == "preferences":
            return self.preferences()
        elif path == "update_preferences":
            return self.update_preferences()
        return jsonify({"message": "Endpoint not found", "status": 404}), 404

    @staticmethod
    def _require_user():
        if not hasattr(g, "user") or not g.user:
            return jsonify({"message": "Unauthorized", "status": 401}), 401
        return None

    @staticmethod
    def _format_notif(n: Notification) -> dict:
        return {
            "id": n.id,
            "type": n.type,
            "message": n.message,
            "link": n.link,
            "actor_id": n.actor_id,
            "entity_type": n.entity_type,
            "entity_id": n.entity_id,
            "is_read": bool(n.is_read),
            "created_at": n.created_at.isoformat() + "Z" if n.created_at else None,
        }

    def fetch(self):
        """Return paginated notifications + auto-cleanup of old rows."""
        unauth = self._require_user()
        if unauth:
            return unauth

        data = request.get_json(silent=True) or {}
        limit = int(data.get("limit", 20))
        offset = int(data.get("offset", 0))

        # Auto-cleanup: delete this user's notifications older than 90 days
        # on every fetch. Cheap and keeps the table lean.
        cutoff = datetime.utcnow() - timedelta(days=90)
        Notification.query.filter(
            Notification.user_id == g.user.id,
            Notification.org_id == g.user.org_id,
            Notification.created_at < cutoff,
        ).delete(synchronize_session=False)
        db.session.commit()

        query = Notification.query.filter(
            Notification.user_id == g.user.id,
            Notification.org_id == g.user.org_id,
        ).order_by(Notification.created_at.desc())

        total = query.count()
        rows = query.limit(limit).offset(offset).all()

        return jsonify(
            {
                "status": 200,
                "notifications": [self._format_notif(n) for n in rows],
                "total": total,
            }
        ), 200

    def unread_count(self):
        """Single int for the bell badge — cheap, called every 30s."""
        unauth = self._require_user()
        if unauth:
            return unauth

        count = (
            db.session.query(db.func.count(Notification.id))
            .filter(
                Notification.user_id == g.user.id,
                Notification.org_id == g.user.org_id,
                Notification.is_read.is_(False),
            )
            .scalar()
            or 0
        )
        return jsonify({"status": 200, "unread_count": int(count)}), 200

    def mark_read(self):
        """Mark notifications as read. If `ids` present → just those.
        Otherwise, mark ALL unread for the caller."""
        unauth = self._require_user()
        if unauth:
            return unauth

        data = request.get_json(silent=True) or {}
        ids = data.get("ids")

        query = Notification.query.filter(
            Notification.user_id == g.user.id,
            Notification.org_id == g.user.org_id,
            Notification.is_read.is_(False),
        )
        if ids:
            query = query.filter(Notification.id.in_(ids))

        updated = query.update(
            {Notification.is_read: True}, synchronize_session=False
        )
        db.session.commit()
        return jsonify({"status": 200, "updated": updated}), 200

    def preferences(self):
        """Return the caller's notify_* flags."""
        unauth = self._require_user()
        if unauth:
            return unauth

        prefs = {field: bool(getattr(g.user, field, True)) for field in PREFERENCE_FIELDS}
        return jsonify({"status": 200, "preferences": prefs}), 200

    def update_preferences(self):
        """Patch one or more notify_* flags. Unknown keys ignored."""
        unauth = self._require_user()
        if unauth:
            return unauth

        data = request.get_json(silent=True) or {}
        prefs = data.get("preferences") or {}

        user = User.query.get(g.user.id)
        if user is None:
            return jsonify({"message": "User not found", "status": 404}), 404

        for field in PREFERENCE_FIELDS:
            if field in prefs:
                setattr(user, field, bool(prefs[field]))

        db.session.commit()

        updated = {field: bool(getattr(user, field, True)) for field in PREFERENCE_FIELDS}
        return jsonify({"status": 200, "preferences": updated}), 200
