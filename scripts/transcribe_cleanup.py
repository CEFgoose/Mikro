#!/usr/bin/env python3
"""
Clear out stuck and errored transcription jobs.

Runnable from inside the backend pod:

    curl -sS https://raw.githubusercontent.com/CEFgoose/Mikro/master/scripts/transcribe_cleanup.py | python3

Actions:
  1. Marks any job still in status="transcribing" as error="Cleanup: hung job".
     (The previous pod's worker will be gone after deploy anyway.)
  2. DELETES all rows with status="error" from the TranscriptionJob table so
     they stop cluttering the recent-jobs list in the UI.

Both steps are org-wide (not scoped to one user). Intended for admin
cleanup only.
"""

import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.getcwd())

try:
    from app import app
    from api.database.core import db, TranscriptionJob
except Exception as e:
    print(f"Could not import Flask app: {e}", file=sys.stderr)
    sys.exit(1)


def main():
    with app.app_context():
        # 1. Cancel anything still marked transcribing
        stuck = TranscriptionJob.query.filter_by(status="transcribing").all()
        for j in stuck:
            j.status = "error"
            j.error = "Cleanup: hung job"
            j.completed_at = datetime.now(timezone.utc)
        if stuck:
            db.session.commit()
        print(f"Cancelled {len(stuck)} stuck 'transcribing' job(s).")
        for j in stuck:
            print(f"  - {j.id} ({j.file_name})")

        # 2. Hard-delete all error rows
        errored = TranscriptionJob.query.filter_by(status="error").all()
        count = len(errored)
        ids = [(j.id, j.file_name) for j in errored]
        for j in errored:
            db.session.delete(j)
        if errored:
            db.session.commit()
        print(f"Deleted {count} error job(s).")
        for jid, fname in ids:
            print(f"  - {jid} ({fname})")

        remaining = TranscriptionJob.query.count()
        print(f"Remaining jobs in table: {remaining}")


if __name__ == "__main__":
    main()
