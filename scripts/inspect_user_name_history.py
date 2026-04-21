#!/usr/bin/env python3
"""
Inspect the name-change audit history for one user. Temporary diagnostic
tool — drop alongside the user_name_audits table when the name-revert
regression is confirmed fixed.

Usable from inside the Mikro backend pod:

    curl -sS https://raw.githubusercontent.com/CEFgoose/Mikro/master/scripts/inspect_user_name_history.py | python3 - <user_id_or_email>

Or with a stdin-friendly invocation:

    python3 scripts/inspect_user_name_history.py "auth0|abc123..."
    python3 scripts/inspect_user_name_history.py "someone@kaart.com"

Prints:
  - The user's current first/last/email/osm_username
  - The most-recent audit rows, newest-first, with source + actor + details

Requires the user_name_audits table migration to have been applied.
"""

import os
import sys

sys.path.insert(0, os.getcwd())


def _usage():
    print(
        "Usage: inspect_user_name_history.py <user_id_or_email>",
        file=sys.stderr,
    )
    sys.exit(2)


try:
    from app import app
    from api.database.core import db, User, UserNameAudit
except Exception as e:
    print(f"Could not import Flask app: {e}", file=sys.stderr)
    sys.exit(1)


def main():
    if len(sys.argv) < 2:
        _usage()
    lookup = sys.argv[1].strip()
    if not lookup:
        _usage()

    with app.app_context():
        user = (
            User.query.filter_by(id=lookup).first()
            or User.query.filter_by(email=lookup).first()
            or User.query.filter_by(osm_username=lookup).first()
        )
        if not user:
            print(f"No user found matching {lookup!r}.", file=sys.stderr)
            sys.exit(3)

        print("=" * 72)
        print(f"User: {user.id}")
        print(f"  email:         {user.email}")
        print(f"  osm_username:  {user.osm_username}")
        print(f"  first_name:    {user.first_name!r}")
        print(f"  last_name:     {user.last_name!r}")
        print(f"  full_name:     {user.full_name!r}")
        print(f"  role:          {user.role}")
        print(f"  org_id:        {user.org_id}")
        print(f"  is_tracked:    {getattr(user, 'is_tracked_only', False)}")
        print("=" * 72)

        audits = (
            UserNameAudit.query
            .filter_by(user_id=user.id)
            .order_by(UserNameAudit.changed_at.desc())
            .all()
        )
        if not audits:
            print("No name-change audit rows recorded for this user.")
            print(
                "(If you expected entries, the user_name_audits table was "
                "added in migration z6e7f8a9b0c1 — any name changes from "
                "BEFORE that migration are not recorded.)"
            )
            return

        print(f"Name-change audit history ({len(audits)} row(s), newest first):")
        print()
        for a in audits:
            ts = a.changed_at.isoformat() if a.changed_at else "?"
            old = f"{a.old_first_name or ''} {a.old_last_name or ''}".strip() or "(empty)"
            new = f"{a.new_first_name or ''} {a.new_last_name or ''}".strip() or "(empty)"
            actor = a.changed_by or "system"
            print(f"  [{ts}]  source={a.source}")
            print(f"    {old!r}  ->  {new!r}")
            print(f"    by: {actor}")
            if a.details:
                print(f"    details: {a.details}")
            print()


if __name__ == "__main__":
    main()
