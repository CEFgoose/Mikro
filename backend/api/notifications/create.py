"""
create_notification — single SSOT entry point for emitting a bell
notification (and optionally an email) to a user.

Why this exists:
  - Every view that wants to emit a notification calls this one helper
    instead of constructing Notification rows ad-hoc. When the policy
    changes (rate-limit tuning, per-type email rules, adding a
    push-notification backend), there's one place to edit.
  - Pairs the bell row with an opt-in email based on the user's
    notify_* preference columns. In-app rows are ALWAYS created.
  - Rate-limits email to at most one per (user, type) per hour to
    prevent runaway fanout (e.g., when a mass-adjust script touches
    100 entries in a minute the admin still only gets one email).
"""

from datetime import datetime, timedelta
from typing import Optional

from flask import current_app

from ..database import Notification, User, db
from .types import NotificationType


# Notification type → the User.notify_* column that controls email
# delivery for it. Types not in this map get no email by default
# (kept quiet). Admin campaigns check notify_announcement via their own
# path — they don't flow through this helper.
NOTIFICATION_EMAIL_PREFS: dict[str, str] = {
    NotificationType.ENTRY_ADJUSTED: "notify_entry_adjusted",
    NotificationType.ENTRY_FORCE_CLOSED: "notify_entry_force_closed",
    NotificationType.ADJUSTMENT_REQUESTED: "notify_adjustment_requested",
    NotificationType.ASSIGNED_TO_PROJECT: "notify_assigned_to_project",
    NotificationType.PAYMENT_SENT: "notify_payment_sent",
    NotificationType.BANK_INFO_CHANGED: "notify_bank_info_changed",
    NotificationType.ANNOUNCEMENT: "notify_announcement",
    NotificationType.MESSAGE_RECEIVED: "notify_message_received",
}


def _recent_email_sent(user_id: str, type_: str, within_minutes: int = 60) -> bool:
    """True if we sent an email-eligible notification of this type to
    this user within `within_minutes`. Uses the notifications table as
    the delivery log (any row with matching type counts — we can't tell
    from here whether it actually sent an email, so treat every recent
    notif as potentially having sent one)."""
    cutoff = datetime.utcnow() - timedelta(minutes=within_minutes)
    return (
        db.session.query(Notification.id)
        .filter(
            Notification.user_id == user_id,
            Notification.type == type_,
            Notification.created_at >= cutoff,
        )
        .first()
        is not None
    )


def create_notification(
    *,
    user_id: str,
    org_id: str,
    type: str,
    message: str,
    link: Optional[str] = None,
    actor_id: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    send_email: Optional[bool] = None,
    commit: bool = True,
) -> Notification:
    """Create a bell notification and (optionally) email the user.

    Args:
        user_id: Recipient's users.id (Auth0 sub).
        org_id: Same org_id the user belongs to. Stamped on the row for
            per-org siloing.
        type: Short string identifier matching NOTIFICATION_EMAIL_PREFS.
            Unknown types still create the bell row, just no email.
        message: Human-readable text shown in the bell panel (≤500 chars).
        link: Optional frontend route for click-through.
        actor_id: User whose action triggered this notif (null for
            system-generated).
        entity_type, entity_id: Optional context pointer to the source
            object (e.g. "time_entry", 12345).
        send_email: Force the email decision. True = always send, False
            = never send, None = let the user's prefs + rate-limit decide.
        commit: If True (default), commits the session before returning.
            Pass False when the caller is batching multiple notifications
            inside a larger transaction and will commit once at the end
            (e.g. fanout-to-team in Messages.send).

    Returns:
        The persisted Notification row.
    """
    # Check if we should email BEFORE rate-limit check — need user's prefs.
    # Rate-limit check happens AFTER the new notif is created so this
    # notif counts as the "recent" one for the next caller.
    notification = Notification(
        user_id=user_id,
        org_id=org_id,
        actor_id=actor_id,
        type=type,
        message=message,
        link=link,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    db.session.add(notification)
    db.session.flush()  # give it an id without committing

    # Decide about email
    email_wanted = send_email
    if email_wanted is None:
        pref_field = NOTIFICATION_EMAIL_PREFS.get(type)
        if pref_field is None:
            email_wanted = False  # unknown type — silent
        else:
            user = User.query.get(user_id)
            if user is None:
                email_wanted = False
            else:
                email_wanted = bool(getattr(user, pref_field, True))
    # Rate limit — we just created the current one; check if a SECOND
    # notif existed before this one within the window.
    if email_wanted:
        # Look for another notif of the same type within the last hour
        # OTHER than the one we just inserted.
        cutoff = datetime.utcnow() - timedelta(minutes=60)
        has_prior = (
            db.session.query(Notification.id)
            .filter(
                Notification.user_id == user_id,
                Notification.type == type,
                Notification.created_at >= cutoff,
                Notification.id != notification.id,
            )
            .first()
            is not None
        )
        if has_prior:
            email_wanted = False  # rate-limit skip

    if email_wanted:
        # Import locally to avoid circular imports with email → database.
        try:
            from ..email import mailer
            user = User.query.get(user_id)
            if user and user.email:
                mailer.send_notification_email(
                    to=user.email,
                    user_display_name=user.full_name or user.email,
                    title=type.replace("_", " ").title(),
                    body=message,
                    action_url=link,
                )
        except Exception as e:
            # Fire-and-forget — never let email problems block the bell
            # row. Log and move on.
            try:
                current_app.logger.warning(
                    f"[NOTIF-EMAIL] send failed user={user_id} type={type}: {e}"
                )
            except Exception:
                pass

    if commit:
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            try:
                current_app.logger.warning(
                    f"[NOTIF] commit failed user={user_id} type={type}: {e}"
                )
            except Exception:
                pass

    return notification
