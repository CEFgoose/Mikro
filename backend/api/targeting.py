"""
User-targeting helpers — single source of truth for resolving
"everyone in team X" / "everyone in region Y" / "everyone in org Z"
to a list of User rows, scoped to a specific org.

Callers:
  - api/views/Messages.py  — who gets the message
  - api/views/Email.py     — who gets the campaign
Add any new fan-out caller here so the policy stays in one place.
"""

from typing import Optional

from .database import Country, Team, TeamUser, User


def team_member_users(
    team_id: int,
    org_id: str,
    *,
    exclude_user_id: Optional[str] = None,
    require_pref: Optional[str] = None,
) -> list[User]:
    """All users in the given team, scoped to `org_id`. Returns [] if
    the team doesn't exist or isn't in this org.

    `exclude_user_id` drops one user (usually the sender).
    `require_pref` is the name of a User.notify_* column; if set, only
    users with that column = True are returned.
    """
    team = Team.query.get(team_id)
    if not team or team.org_id != org_id:
        return []
    member_rows = TeamUser.query.filter_by(team_id=team_id).all()
    ids = [m.user_id for m in member_rows if m.user_id != exclude_user_id]
    if not ids:
        return []
    q = User.query.filter(User.org_id == org_id, User.id.in_(ids))
    if require_pref:
        q = q.filter(getattr(User, require_pref).is_(True))
    return q.all()


def region_users(
    region_id: int,
    org_id: str,
    *,
    exclude_user_id: Optional[str] = None,
    require_pref: Optional[str] = None,
) -> list[User]:
    """All users whose country belongs to the given region, in this org."""
    q = (
        User.query.join(Country, User.country_id == Country.id)
        .filter(User.org_id == org_id, Country.region_id == region_id)
    )
    if exclude_user_id:
        q = q.filter(User.id != exclude_user_id)
    if require_pref:
        q = q.filter(getattr(User, require_pref).is_(True))
    return q.all()


def org_users(
    org_id: str,
    *,
    exclude_user_id: Optional[str] = None,
    require_pref: Optional[str] = None,
) -> list[User]:
    """Every user in the given org."""
    q = User.query.filter(User.org_id == org_id)
    if exclude_user_id:
        q = q.filter(User.id != exclude_user_id)
    if require_pref:
        q = q.filter(getattr(User, require_pref).is_(True))
    return q.all()
