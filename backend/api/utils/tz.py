"""
Timezone helpers — single source of truth for org-anchored date math.

The DB stores all timestamps as naive UTC (via datetime.utcnow()). That's
fine for storage but wrong for aggregation windows: a session worked March
31 at 9pm Manila (= April 1 01:00 UTC) would otherwise get bucketed into
April for payroll, and a user in any non-UTC timezone would see the wrong
"today" window.

Two domains, two rules:

  - Per-user display ("today", "this week", "this month" on their own
    sidebar / widget / time page): use the user's browser-local TZ. The
    frontend sends ISO UTC instants aligned to their local midnights; the
    backend just filters clock_in >= X AND clock_in < Y. No helper needed
    — this module is only for the second case.

  - Org-wide aggregates run by Kaart admins (monthly payroll summary,
    "mark month paid" snapshots): anchor to America/Denver. Kaart HQ runs
    one monthly close; contractors all over the world get paid against
    that single clock.

If Kaart ever signs a second org with a different HQ timezone, move
ORG_TIMEZONE to a per-org DB column and thread the org_id → tz lookup
through the helpers below.
"""

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

ORG_TIMEZONE = ZoneInfo("America/Denver")


def parse_filter_datetime(value):
    """Parse an ISO date or datetime from a filter body. Returns
    (naive_utc_datetime_or_None, was_date_only).

    Inputs we accept:
      - None / empty → (None, False)
      - "2026-04-23"                  → (2026-04-23 00:00 naive, True)
      - "2026-04-23T06:00:00Z"        → (2026-04-23 06:00 naive, False)
      - "2026-04-23T00:00:00-06:00"   → (2026-04-23 06:00 naive, False)
      - "2026-04-23T06:00:00"         → (2026-04-23 06:00 naive, False)  # tz-naive, assumed UTC

    Date-only callers should add timedelta(days=1) to the upper bound for
    an exclusive "[start, end+1d)" window (preserves legacy behavior).
    ISO-datetime callers should NOT add a day — the frontend already sent
    the user-local-midnight aligned exclusive bound.
    """
    if not value:
        return None, False
    is_date_only = "T" not in value
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt, is_date_only
    except (ValueError, AttributeError):
        try:
            return datetime.strptime(value, "%Y-%m-%d"), True
        except (ValueError, AttributeError):
            return None, False


def apply_date_range_filter(conditions, column, start_value, end_value):
    """Append start/end conditions against `column` to `conditions` list.

    Shared helper: parses the frontend-supplied start/end values via
    `parse_filter_datetime` and appends `column >= start`, `column < end`.
    Adds a day to the upper bound only when `end_value` was a date-only
    string (legacy input).
    """
    start_dt, _ = parse_filter_datetime(start_value)
    end_dt, end_was_date_only = parse_filter_datetime(end_value)
    if start_dt is not None:
        conditions.append(column >= start_dt)
    if end_dt is not None:
        if end_was_date_only:
            end_dt = end_dt + timedelta(days=1)
        conditions.append(column < end_dt)
    return start_dt, end_dt


def org_month_bounds_utc(year: int, month: int) -> tuple[datetime, datetime]:
    """Return [start, end_exclusive) for the given org-TZ month, as naive UTC."""
    start_local = datetime(year, month, 1, tzinfo=ORG_TIMEZONE)
    if month == 12:
        end_local = datetime(year + 1, 1, 1, tzinfo=ORG_TIMEZONE)
    else:
        end_local = datetime(year, month + 1, 1, tzinfo=ORG_TIMEZONE)
    return (
        start_local.astimezone(timezone.utc).replace(tzinfo=None),
        end_local.astimezone(timezone.utc).replace(tzinfo=None),
    )


def org_year_bounds_utc(year: int) -> tuple[datetime, datetime]:
    """Return [start, end_exclusive) for the given org-TZ year, as naive UTC."""
    start_local = datetime(year, 1, 1, tzinfo=ORG_TIMEZONE)
    end_local = datetime(year + 1, 1, 1, tzinfo=ORG_TIMEZONE)
    return (
        start_local.astimezone(timezone.utc).replace(tzinfo=None),
        end_local.astimezone(timezone.utc).replace(tzinfo=None),
    )
