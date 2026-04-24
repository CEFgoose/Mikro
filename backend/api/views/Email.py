#!/usr/bin/env python3
"""
Email campaigns API — admin-only mass email composer + history.

A campaign sends the same HTML body to an audience (all org, a team,
or a region) via the Kaart SMTP mailer. Respects per-user
notify_announcement prefs unless is_forced is set (for critical
broadcasts like payroll deadlines).
"""

from datetime import datetime

from flask import g, jsonify, request
from flask.views import MethodView

from ..database import (
    EmailCampaign,
    User,
    db,
)
from ..email import mailer
from ..email.audience import parse_audience
from ..targeting import org_users, region_users, team_member_users
from ..utils import requires_admin


class EmailAPI(MethodView):
    """Admin-only email campaign endpoints."""

    def post(self, path: str):
        if path == "campaigns_create":
            return self.campaigns_create()
        elif path == "campaigns_list":
            return self.campaigns_list()
        elif path == "campaigns_preview":
            return self.campaigns_preview()
        return jsonify({"message": "Endpoint not found", "status": 404}), 404

    @staticmethod
    def _resolve_recipients(
        audience: str, org_id: str, is_forced: bool
    ) -> list[User]:
        """Resolve an audience identifier to a concrete list of User rows.

        See `api.email.audience` for the audience-string format.

        Filtered by notify_announcement = True unless `is_forced` is set.
        """
        require_pref = None if is_forced else "notify_announcement"
        kind, target_id = parse_audience(audience)

        if kind == "all_org":
            users = org_users(org_id, require_pref=require_pref)
        elif kind == "team" and target_id is not None:
            users = team_member_users(
                target_id, org_id, require_pref=require_pref
            )
        elif kind == "region" and target_id is not None:
            users = region_users(
                target_id, org_id, require_pref=require_pref
            )
        else:
            users = []

        # Filter to users with a real email set
        return [u for u in users if u.email]

    @requires_admin
    def campaigns_create(self):
        data = request.get_json(silent=True) or {}
        subject = (data.get("subject") or "").strip()
        body_html = data.get("body_html") or ""
        audience = (data.get("audience") or "").strip()
        is_forced = bool(data.get("is_forced", False))

        if not subject:
            return jsonify({"message": "subject is required", "status": 400}), 400
        if not body_html:
            return jsonify({"message": "body_html is required", "status": 400}), 400
        if not audience:
            return jsonify({"message": "audience is required", "status": 400}), 400

        recipients = self._resolve_recipients(audience, g.user.org_id, is_forced)
        recipient_emails = [u.email for u in recipients]

        campaign = EmailCampaign(
            org_id=g.user.org_id,
            subject=subject,
            body_html=body_html,
            sent_by=g.user.id,
            audience=audience,
            is_forced=is_forced,
            recipient_count=len(recipient_emails),
        )
        db.session.add(campaign)
        db.session.flush()

        if recipient_emails:
            # Fire-and-forget on a background thread so the admin doesn't
            # wait for SMTP round-trips. Failures are logged only.
            mailer.send_campaign_async(
                recipients=recipient_emails,
                subject=subject,
                body_html=body_html,
            )

        campaign.sent_at = datetime.utcnow()
        db.session.commit()

        return jsonify(
            {
                "status": 200,
                "campaign": self._format_campaign(campaign),
                "recipient_count": len(recipient_emails),
            }
        ), 200

    @requires_admin
    def campaigns_list(self):
        rows = (
            EmailCampaign.query.filter(EmailCampaign.org_id == g.user.org_id)
            .order_by(EmailCampaign.created_at.desc())
            .limit(50)
            .all()
        )
        return jsonify(
            {
                "status": 200,
                "campaigns": [self._format_campaign(c) for c in rows],
            }
        ), 200

    @requires_admin
    def campaigns_preview(self):
        """Return the recipient count for a given audience without
        actually sending. Helps admins sanity-check blast radius."""
        data = request.get_json(silent=True) or {}
        audience = (data.get("audience") or "").strip()
        is_forced = bool(data.get("is_forced", False))
        if not audience:
            return jsonify({"message": "audience is required", "status": 400}), 400
        recipients = self._resolve_recipients(audience, g.user.org_id, is_forced)
        return jsonify(
            {"status": 200, "recipient_count": len(recipients)}
        ), 200

    @staticmethod
    def _format_campaign(c: EmailCampaign) -> dict:
        sender = User.query.get(c.sent_by) if c.sent_by else None
        return {
            "id": c.id,
            "subject": c.subject,
            "audience": c.audience,
            "is_forced": bool(c.is_forced),
            "sent_by": c.sent_by,
            "sent_by_name": (sender.full_name if sender else None),
            "sent_at": c.sent_at.isoformat() + "Z" if c.sent_at else None,
            "recipient_count": c.recipient_count,
            "created_at": c.created_at.isoformat() + "Z" if c.created_at else None,
        }
