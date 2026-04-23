"""
Unit tests for the pay-field visibility policy. Pure-function tests —
no Flask app, no DB. When F3 (Super Admin vs Team Admin) lands, add
cases here BEFORE changing `can_view_pay_for` so the new rule is
codified.
"""

from ..api.auth.pay_visibility import (
    PAY_FIELDS,
    can_view_pay_for,
    redact_pay_fields,
)


class _FakeUser:
    """Minimal stand-in for the SQLAlchemy User — just the attributes
    `can_view_pay_for` reads. Keeps these tests independent of the DB."""

    def __init__(self, id: str, role: str):
        self.id = id
        self.role = role


def test_self_can_view_own_pay():
    u = _FakeUser("auth0|abc", "user")
    assert can_view_pay_for(u, u)


def test_admin_can_view_any_user_pay():
    admin = _FakeUser("auth0|admin", "admin")
    target = _FakeUser("auth0|other", "user")
    assert can_view_pay_for(admin, target)


def test_plain_user_cannot_view_other_user_pay():
    user = _FakeUser("auth0|a", "user")
    target = _FakeUser("auth0|b", "user")
    assert not can_view_pay_for(user, target)


def test_validator_cannot_view_other_user_pay():
    validator = _FakeUser("auth0|v", "validator")
    target = _FakeUser("auth0|b", "user")
    assert not can_view_pay_for(validator, target)


def test_none_viewer_fails_closed():
    target = _FakeUser("auth0|b", "user")
    assert not can_view_pay_for(None, target)


def test_none_target_fails_closed():
    viewer = _FakeUser("auth0|a", "admin")
    assert not can_view_pay_for(viewer, None)


def test_redact_strips_every_pay_field_for_unauthorized():
    viewer = _FakeUser("auth0|a", "user")
    target = _FakeUser("auth0|b", "user")
    # Include every PAY_FIELDS key plus a benign one that must survive.
    data = {f: "sensitive" for f in PAY_FIELDS}
    data["full_name"] = "Some User"
    data["osm_username"] = "somemapper"

    redact_pay_fields(data, viewer, target)

    for field in PAY_FIELDS:
        assert field not in data, f"{field!r} leaked to unauthorized viewer"
    assert data["full_name"] == "Some User"
    assert data["osm_username"] == "somemapper"


def test_redact_preserves_pay_fields_for_self():
    user = _FakeUser("auth0|a", "user")
    data = {"hourly_rate": 25.0, "payment_email": "x@y.z", "full_name": "Me"}

    redact_pay_fields(data, user, user)

    assert data["hourly_rate"] == 25.0
    assert data["payment_email"] == "x@y.z"
    assert data["full_name"] == "Me"


def test_redact_preserves_pay_fields_for_admin():
    admin = _FakeUser("auth0|admin", "admin")
    target = _FakeUser("auth0|b", "user")
    data = {"hourly_rate": 25.0, "payment_email": "x@y.z"}

    redact_pay_fields(data, admin, target)

    assert data["hourly_rate"] == 25.0
    assert data["payment_email"] == "x@y.z"


def test_redact_is_noop_when_no_pay_fields_present():
    viewer = _FakeUser("auth0|a", "user")
    target = _FakeUser("auth0|b", "user")
    data = {"id": target.id, "full_name": "Some User"}
    original = dict(data)

    redact_pay_fields(data, viewer, target)

    assert data == original


def test_redact_returns_the_same_dict_for_chaining():
    viewer = _FakeUser("auth0|a", "user")
    target = _FakeUser("auth0|b", "user")
    data = {"hourly_rate": 25.0}

    result = redact_pay_fields(data, viewer, target)

    assert result is data
