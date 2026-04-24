#!/usr/bin/env python3
"""
Messenger API — DMs + team/region/org broadcasts.

Design notes:
  - No conversation/room table. A "conversation" is any set of messages
    matching a scope: DMs share (target_type='user', sender/target pair),
    team messages share (target_type='team', target_team_id), etc.
  - Unread counts are derived from a MessageRead watermark row per
    (user_id, scope_type, scope_key). No per-message read tracking.
  - Per-org siloing is enforced on every query: Message.org_id ==
    g.user.org_id on top of any target filter.
  - Authorization:
      * DMs (target_type='user'): any authenticated user in the same org.
      * team broadcast: sender must be a team member OR admin.
      * region / org broadcast: sender must be admin.
"""

from datetime import datetime
from typing import Optional

from flask import g, jsonify, request
from flask.views import MethodView
from sqlalchemy import or_, and_, func

from ..database import (
    Country,
    Message,
    MessageRead,
    Region,
    Team,
    TeamUser,
    User,
    db,
)
from ..notifications import create_notification, NotificationType
from ..targeting import org_users, region_users, team_member_users


VALID_SCOPES = ("user", "team", "region", "org")


class MessagesAPI(MethodView):
    """Messenger endpoints for DMs, team, region, and org broadcasts."""

    def post(self, path: str):
        if path == "conversations":
            return self.conversations()
        elif path == "thread":
            return self.thread()
        elif path == "send":
            return self.send()
        elif path == "mark_read":
            return self.mark_read()
        elif path == "unread_count":
            return self.unread_count()
        elif path == "contacts":
            return self.contacts()
        return jsonify({"message": "Endpoint not found", "status": 404}), 404

    @staticmethod
    def _require_user():
        if not hasattr(g, "user") or not g.user:
            return jsonify({"message": "Unauthorized", "status": 401}), 401
        return None

    # ─── helpers ──────────────────────────────────────────────

    @staticmethod
    def _user_teams(user_id: str) -> list[int]:
        rows = TeamUser.query.filter_by(user_id=user_id).all()
        return [r.team_id for r in rows]

    @staticmethod
    def _user_region_id(user: User) -> Optional[int]:
        if not user.country_id:
            return None
        country = Country.query.get(user.country_id)
        if not country:
            return None
        return country.region_id

    @staticmethod
    def _format_message(m: Message) -> dict:
        sender = User.query.get(m.sender_id) if m.sender_id else None
        return {
            "id": m.id,
            "sender_id": m.sender_id,
            "sender_name": (sender.full_name if sender else "Unknown"),
            "target_type": m.target_type,
            "target_user_id": m.target_user_id,
            "target_team_id": m.target_team_id,
            "target_region_id": m.target_region_id,
            "content": m.content,
            "created_at": m.created_at.isoformat() + "Z" if m.created_at else None,
        }

    def _scope_filter(self, scope_type: str, scope_key: str):
        """Return a SQLAlchemy filter expression matching messages in
        the given conversation scope for g.user's org."""
        base = Message.org_id == g.user.org_id
        if scope_type == "user":
            # DM between g.user and `scope_key` (the other user's id).
            # Messages in either direction count.
            return and_(
                base,
                Message.target_type == "user",
                or_(
                    and_(
                        Message.sender_id == g.user.id,
                        Message.target_user_id == scope_key,
                    ),
                    and_(
                        Message.sender_id == scope_key,
                        Message.target_user_id == g.user.id,
                    ),
                ),
            )
        elif scope_type == "team":
            try:
                team_id = int(scope_key)
            except ValueError:
                return False
            return and_(
                base,
                Message.target_type == "team",
                Message.target_team_id == team_id,
            )
        elif scope_type == "region":
            try:
                region_id = int(scope_key)
            except ValueError:
                return False
            return and_(
                base,
                Message.target_type == "region",
                Message.target_region_id == region_id,
            )
        elif scope_type == "org":
            return and_(base, Message.target_type == "org")
        return False

    def _user_can_read_scope(self, scope_type: str, scope_key: str) -> bool:
        """Authorization: can g.user see this conversation?"""
        if scope_type == "user":
            # Anyone in the same org can read their own DM threads.
            peer = User.query.get(scope_key)
            return peer is not None and peer.org_id == g.user.org_id
        elif scope_type == "team":
            try:
                team_id = int(scope_key)
            except ValueError:
                return False
            team = Team.query.get(team_id)
            if not team or team.org_id != g.user.org_id:
                return False
            # Admin sees all; others only their own teams.
            if g.user.role == "admin":
                return True
            return team_id in self._user_teams(g.user.id)
        elif scope_type == "region":
            try:
                region_id = int(scope_key)
            except ValueError:
                return False
            # Any org user in that region can read; admins see all regions
            # in their org.
            if g.user.role == "admin":
                region = Region.query.get(region_id)
                return region is not None and region.org_id == g.user.org_id
            return self._user_region_id(g.user) == region_id
        elif scope_type == "org":
            return scope_key == g.user.org_id
        return False

    def _user_can_send_to(
        self, target_type: str, target_id: Optional[str]
    ) -> bool:
        """Authorization: can g.user send to this target?"""
        if target_type == "user":
            # Same-org check only. No self-DMs.
            if not target_id or target_id == g.user.id:
                return False
            peer = User.query.get(target_id)
            return peer is not None and peer.org_id == g.user.org_id
        elif target_type == "team":
            try:
                team_id = int(target_id) if target_id is not None else None
            except ValueError:
                return False
            if team_id is None:
                return False
            team = Team.query.get(team_id)
            if not team or team.org_id != g.user.org_id:
                return False
            # Admin can broadcast to any team in the org; members can
            # broadcast to their own teams.
            if g.user.role == "admin":
                return True
            return team_id in self._user_teams(g.user.id)
        elif target_type == "region":
            # Region broadcasts are admin-only (per plan section 9).
            if g.user.role != "admin":
                return False
            try:
                region_id = int(target_id) if target_id is not None else None
            except ValueError:
                return False
            if region_id is None:
                return False
            region = Region.query.get(region_id)
            return region is not None and region.org_id == g.user.org_id
        elif target_type == "org":
            # Org broadcasts are admin-only.
            return g.user.role == "admin"
        return False

    def _recipients_for(
        self,
        target_type: str,
        target_user_id: Optional[str],
        target_team_id: Optional[int],
        target_region_id: Optional[int],
    ) -> list[User]:
        """Resolve a target to the list of recipient User rows (for
        fanning out notifications). Excludes the sender themselves."""
        org_id = g.user.org_id
        if target_type == "user" and target_user_id:
            peer = User.query.get(target_user_id)
            return [peer] if peer and peer.org_id == org_id else []
        if target_type == "team" and target_team_id is not None:
            return team_member_users(
                target_team_id, org_id, exclude_user_id=g.user.id
            )
        if target_type == "region" and target_region_id is not None:
            return region_users(
                target_region_id, org_id, exclude_user_id=g.user.id
            )
        if target_type == "org":
            return org_users(org_id, exclude_user_id=g.user.id)
        return []

    def _get_last_read(self, scope_type: str, scope_key: str) -> Optional[datetime]:
        row = MessageRead.query.filter_by(
            user_id=g.user.id, scope_type=scope_type, scope_key=scope_key
        ).first()
        return row.last_read_at if row else None

    def _unread_count_for_scope(
        self, scope_type: str, scope_key: str
    ) -> int:
        """Count messages in this scope newer than the user's watermark."""
        filter_expr = self._scope_filter(scope_type, scope_key)
        if filter_expr is False:
            return 0
        q = Message.query.filter(filter_expr)
        # Exclude messages the user sent themselves — they're implicitly
        # "read" by the sender.
        q = q.filter(Message.sender_id != g.user.id)
        last_read = self._get_last_read(scope_type, scope_key)
        if last_read is not None:
            q = q.filter(Message.created_at > last_read)
        return q.count()

    # ─── endpoints ────────────────────────────────────────────

    def conversations(self):
        """List all conversations the caller participates in.

        Returns grouped DM threads (one entry per peer), team
        conversations (one per team the user belongs to, or all teams in
        org if admin), region (one for the user's region, or all for
        admin), and one org conversation.
        """
        unauth = self._require_user()
        if unauth:
            return unauth

        org_id = g.user.org_id
        out: list[dict] = []

        # DMs — every peer the user has sent to or received from.
        # Collect distinct peer ids via two grouped selects.
        peer_ids_a = [
            r[0]
            for r in db.session.query(Message.target_user_id)
            .filter(
                Message.org_id == org_id,
                Message.target_type == "user",
                Message.sender_id == g.user.id,
            )
            .distinct()
            .all()
        ]
        peer_ids_b = [
            r[0]
            for r in db.session.query(Message.sender_id)
            .filter(
                Message.org_id == org_id,
                Message.target_type == "user",
                Message.target_user_id == g.user.id,
            )
            .distinct()
            .all()
        ]
        peer_ids = {p for p in (peer_ids_a + peer_ids_b) if p and p != g.user.id}
        for peer_id in peer_ids:
            peer = User.query.get(peer_id)
            if not peer or peer.org_id != org_id:
                continue
            last = (
                Message.query.filter(self._scope_filter("user", peer_id))
                .order_by(Message.created_at.desc())
                .first()
            )
            out.append(
                {
                    "scope_type": "user",
                    "scope_key": peer_id,
                    "label": peer.full_name or peer.email,
                    "subtitle": peer.email,
                    "last_message": self._format_message(last) if last else None,
                    "unread_count": self._unread_count_for_scope("user", peer_id),
                }
            )

        # Teams: user's own teams, or all teams in org if admin.
        if g.user.role == "admin":
            teams = Team.query.filter_by(org_id=org_id).all()
        else:
            my_ids = self._user_teams(g.user.id)
            teams = Team.query.filter(Team.id.in_(my_ids)).all() if my_ids else []
        for t in teams:
            last = (
                Message.query.filter(self._scope_filter("team", str(t.id)))
                .order_by(Message.created_at.desc())
                .first()
            )
            out.append(
                {
                    "scope_type": "team",
                    "scope_key": str(t.id),
                    "label": t.name,
                    "subtitle": "Team",
                    "last_message": self._format_message(last) if last else None,
                    "unread_count": self._unread_count_for_scope("team", str(t.id)),
                }
            )

        # Regions: user's own region, or all regions in org if admin.
        if g.user.role == "admin":
            regions = Region.query.filter_by(org_id=org_id).all()
        else:
            rid = self._user_region_id(g.user)
            regions = [Region.query.get(rid)] if rid else []
            regions = [r for r in regions if r is not None]
        for r in regions:
            last = (
                Message.query.filter(self._scope_filter("region", str(r.id)))
                .order_by(Message.created_at.desc())
                .first()
            )
            out.append(
                {
                    "scope_type": "region",
                    "scope_key": str(r.id),
                    "label": r.name,
                    "subtitle": "Region",
                    "last_message": self._format_message(last) if last else None,
                    "unread_count": self._unread_count_for_scope("region", str(r.id)),
                }
            )

        # Org (one per user).
        last_org = (
            Message.query.filter(self._scope_filter("org", org_id))
            .order_by(Message.created_at.desc())
            .first()
        )
        out.append(
            {
                "scope_type": "org",
                "scope_key": org_id,
                "label": "Organization",
                "subtitle": "Everyone in your org",
                "last_message": self._format_message(last_org) if last_org else None,
                "unread_count": self._unread_count_for_scope("org", org_id),
            }
        )

        # Order: most recent activity first (None lasts).
        def _key(row):
            lm = row.get("last_message") or {}
            return lm.get("created_at") or ""

        out.sort(key=_key, reverse=True)

        return jsonify({"status": 200, "conversations": out}), 200

    def thread(self):
        """Paginated messages for a conversation scope."""
        unauth = self._require_user()
        if unauth:
            return unauth

        data = request.get_json(silent=True) or {}
        scope_type = data.get("scope_type")
        scope_key = data.get("scope_key")
        limit = int(data.get("limit", 50))
        offset = int(data.get("offset", 0))

        if scope_type not in VALID_SCOPES or scope_key is None:
            return jsonify({"message": "scope_type and scope_key required", "status": 400}), 400
        if not self._user_can_read_scope(scope_type, str(scope_key)):
            return jsonify({"message": "Forbidden", "status": 403}), 403

        filter_expr = self._scope_filter(scope_type, str(scope_key))
        if filter_expr is False:
            return jsonify({"status": 200, "messages": [], "total": 0}), 200

        q = Message.query.filter(filter_expr).order_by(Message.created_at.desc())
        total = q.count()
        rows = q.limit(limit).offset(offset).all()
        # Return oldest first in the window so the client renders
        # top-to-bottom naturally.
        rows.reverse()
        return jsonify(
            {
                "status": 200,
                "messages": [self._format_message(m) for m in rows],
                "total": total,
            }
        ), 200

    def send(self):
        """Create a new message. Emits notifications to each recipient."""
        unauth = self._require_user()
        if unauth:
            return unauth

        data = request.get_json(silent=True) or {}
        target_type = data.get("target_type")
        content = (data.get("content") or "").strip()
        if target_type not in VALID_SCOPES:
            return jsonify({"message": "Invalid target_type", "status": 400}), 400
        if not content:
            return jsonify({"message": "content is required", "status": 400}), 400

        target_user_id: Optional[str] = None
        target_team_id: Optional[int] = None
        target_region_id: Optional[int] = None
        if target_type == "user":
            target_user_id = data.get("target_user_id")
            target_key = target_user_id
        elif target_type == "team":
            try:
                target_team_id = int(data.get("target_team_id"))
            except (TypeError, ValueError):
                return jsonify({"message": "target_team_id required", "status": 400}), 400
            target_key = str(target_team_id)
        elif target_type == "region":
            try:
                target_region_id = int(data.get("target_region_id"))
            except (TypeError, ValueError):
                return jsonify({"message": "target_region_id required", "status": 400}), 400
            target_key = str(target_region_id)
        else:  # org
            target_key = g.user.org_id

        if not self._user_can_send_to(target_type, target_key):
            return jsonify({"message": "Forbidden", "status": 403}), 403

        msg = Message(
            org_id=g.user.org_id,
            sender_id=g.user.id,
            target_type=target_type,
            target_user_id=target_user_id,
            target_team_id=target_team_id,
            target_region_id=target_region_id,
            content=content,
        )
        db.session.add(msg)
        db.session.flush()

        # Fan out notifications to recipients.
        recipients = self._recipients_for(
            target_type, target_user_id, target_team_id, target_region_id
        )
        sender_name = g.user.full_name or g.user.email or "Someone"
        scope_label = {
            "user": "a direct message",
            "team": "your team",
            "region": "your region",
            "org": "your organization",
        }.get(target_type, "Mikro")
        snippet = content[:140] + ("…" if len(content) > 140 else "")
        link = f"/messages?scope_type={target_type}&scope_key={target_key}"
        for r in recipients:
            try:
                create_notification(
                    user_id=r.id,
                    org_id=g.user.org_id,
                    type=NotificationType.MESSAGE_RECEIVED,
                    message=f"{sender_name} sent a message to {scope_label}: {snippet}",
                    link=link,
                    actor_id=g.user.id,
                    entity_type="message",
                    entity_id=msg.id,
                    commit=False,  # batch — commit once at the end
                )
            except Exception:
                # One bad recipient shouldn't block the send.
                pass

        db.session.commit()
        return jsonify({"status": 200, "message": self._format_message(msg)}), 200

    def mark_read(self):
        """Bump the user's last_read_at watermark for a conversation scope."""
        unauth = self._require_user()
        if unauth:
            return unauth

        data = request.get_json(silent=True) or {}
        scope_type = data.get("scope_type")
        scope_key = data.get("scope_key")
        if scope_type not in VALID_SCOPES or scope_key is None:
            return jsonify({"message": "scope_type and scope_key required", "status": 400}), 400
        if not self._user_can_read_scope(scope_type, str(scope_key)):
            return jsonify({"message": "Forbidden", "status": 403}), 403

        row = MessageRead.query.filter_by(
            user_id=g.user.id, scope_type=scope_type, scope_key=str(scope_key)
        ).first()
        now = datetime.utcnow()
        if row is None:
            row = MessageRead(
                user_id=g.user.id,
                scope_type=scope_type,
                scope_key=str(scope_key),
                last_read_at=now,
            )
            db.session.add(row)
        else:
            row.last_read_at = now
        db.session.commit()
        return jsonify({"status": 200}), 200

    def unread_count(self):
        """Single int across all the caller's conversations (sidebar badge)."""
        unauth = self._require_user()
        if unauth:
            return unauth

        total = 0
        # DMs
        dm_peer_ids: set[str] = set()
        for r in (
            db.session.query(Message.target_user_id)
            .filter(
                Message.org_id == g.user.org_id,
                Message.target_type == "user",
                Message.sender_id == g.user.id,
            )
            .distinct()
            .all()
        ):
            if r[0]:
                dm_peer_ids.add(r[0])
        for r in (
            db.session.query(Message.sender_id)
            .filter(
                Message.org_id == g.user.org_id,
                Message.target_type == "user",
                Message.target_user_id == g.user.id,
            )
            .distinct()
            .all()
        ):
            if r[0] and r[0] != g.user.id:
                dm_peer_ids.add(r[0])
        for peer_id in dm_peer_ids:
            total += self._unread_count_for_scope("user", peer_id)
        # Teams
        team_ids = (
            [t.id for t in Team.query.filter_by(org_id=g.user.org_id).all()]
            if g.user.role == "admin"
            else self._user_teams(g.user.id)
        )
        for tid in team_ids:
            total += self._unread_count_for_scope("team", str(tid))
        # Regions
        if g.user.role == "admin":
            region_ids = [r.id for r in Region.query.filter_by(org_id=g.user.org_id).all()]
        else:
            rid = self._user_region_id(g.user)
            region_ids = [rid] if rid else []
        for rid in region_ids:
            total += self._unread_count_for_scope("region", str(rid))
        # Org
        total += self._unread_count_for_scope("org", g.user.org_id)

        return jsonify({"status": 200, "unread_count": int(total)}), 200

    def contacts(self):
        """Return the list of potential DM recipients (all same-org
        users except the caller). Used by the 'new message' picker."""
        unauth = self._require_user()
        if unauth:
            return unauth

        rows = (
            User.query.filter(User.org_id == g.user.org_id, User.id != g.user.id)
            .order_by(User.first_name.asc(), User.last_name.asc())
            .all()
        )
        return jsonify(
            {
                "status": 200,
                "contacts": [
                    {
                        "id": u.id,
                        "name": u.full_name or u.email,
                        "email": u.email,
                        "role": u.role,
                    }
                    for u in rows
                ],
            }
        ), 200
