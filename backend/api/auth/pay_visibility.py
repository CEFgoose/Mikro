"""
Pay-field visibility policy — single source of truth.

Who can see a user's hourly_rate, payment_email, or running-balance
fields (payable_total, paid_total, etc.) on any API response?

Today's policy:
  - The target user themselves — always.
  - Any caller with role == "admin" — always.
  - Everyone else — never.

When F3 lands (Super Admin vs Team Admin split), `can_view_pay_for` is
the ONLY place the rule changes. New rule sketch:
  - Target user themselves — always.
  - role == "super_admin" — always.
  - role == "team_admin" — only when target is in viewer's managed teams
    AND they share an org_id.
  - role == "admin" — keep working as-is during migration so nothing
    breaks; retire once every admin has been re-classed.
  - role == "validator" / "user" — never.

Endpoints: existing ones are already audited and gated correctly via
`@requires_admin` / self-scoped queries (see F11 audit in
`.claude/clock-tz-bulletproofing-plan.md` sibling doc for the audit
log). This module exists so that *future* endpoints that return User
data — new surfaces we haven't built yet — can't accidentally leak pay
fields by grepping past the decorator. Call `redact_pay_fields(dict,
viewer, target)` on any response dict that might include pay fields and
the policy is enforced centrally.
"""

from typing import Iterable


# Any response field whose presence exposes pay/contact-for-pay data.
# Adding a new column to User that carries money/PII? Add it here AND
# check that every existing endpoint returning User data either uses
# redact_pay_fields or is explicitly admin/self-gated.
PAY_FIELDS: frozenset[str] = frozenset({
    "hourly_rate",
    "hourlyRate",               # camelCase variant used by a few serializers
    "payment_email",
    "paymentEmail",
    "payable_total",
    "mapping_payable_total",
    "validation_payable_total",
    "checklist_payable_total",
    "requested_total",
    "paid_total",
    "total_payout",             # alias used in fetch_user_details response
    "awaiting_payment",         # alias for requested_total in fetch_users
    "validated_tasks_amounts",  # computed earnings-like field
    "mapping_earnings",
    "validation_earnings",
    "checklist_earnings",
    "earnings",
    "amount_due",
    "amount_paid",
    "amount_requested",
})


def can_view_pay_for(viewer, target) -> bool:
    """True if `viewer` is authorized to see `target`'s pay fields.

    `viewer` and `target` are `User` records (or anything with `id` and
    `role` attributes). Either being None returns False — fail closed.
    """
    if viewer is None or target is None:
        return False
    # Self is always allowed — a contractor can see their own rate.
    if getattr(viewer, "id", None) == getattr(target, "id", None):
        return True
    # Admin gate — today's stand-in for Super Admin until F3 lands.
    if getattr(viewer, "role", None) == "admin":
        return True
    return False


def redact_pay_fields(data: dict, viewer, target, *, fields: Iterable[str] = PAY_FIELDS) -> dict:
    """Strip pay fields from `data` unless `viewer` may see `target`'s pay.

    Mutates and returns `data`. Unauthorized callers get a dict with the
    same shape minus the sensitive keys — no None placeholders, so the
    absence is loud to anyone inspecting the response.

    Endpoints already gated by `@requires_admin` with no non-admin code
    path don't need this helper (admins always pass the check). It's
    meant for mixed-audience endpoints: anything that serves both a user
    viewing their own record and an admin viewing someone else's.
    """
    if can_view_pay_for(viewer, target):
        return data
    for field in fields:
        data.pop(field, None)
    return data
