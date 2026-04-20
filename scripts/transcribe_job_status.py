#!/usr/bin/env python3
"""
Inspect the most recent transcription job(s) directly from the database.
Runnable from inside the backend pod (the Flask app context gives us DB).

Usage (from the Mikro backend pod):

    curl -sS https://raw.githubusercontent.com/CEFgoose/Mikro/master/scripts/transcribe_job_status.py | python3
"""

import os
import sys
from datetime import datetime, timezone

# Load the Flask app so we get DB bindings + config
sys.path.insert(0, os.getcwd())

try:
    from app import app
    from api.database.core import TranscriptionJob
except Exception as e:
    print(f"Could not import Flask app: {e}", file=sys.stderr)
    print("Make sure you're running this from /app (or wherever app.py lives).", file=sys.stderr)
    sys.exit(1)


def fmt_duration(start, end):
    if not start:
        return "n/a"
    end = end or datetime.now(timezone.utc)
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    delta = end - start
    total = int(delta.total_seconds())
    return f"{total // 60}m {total % 60}s"


def main():
    with app.app_context():
        jobs = (
            TranscriptionJob.query
            .order_by(TranscriptionJob.created_at.desc())
            .limit(5)
            .all()
        )

        if not jobs:
            print("No transcription jobs found.")
            return

        print(f"Most recent {len(jobs)} transcription job(s):")
        print()

        for j in jobs:
            age = fmt_duration(j.created_at, None)
            print(f"═══ job {j.id} ({j.file_name}) ═══")
            print(f"  status      : {j.status}")
            print(f"  progress    : {j.progress}")
            print(f"  user_id     : {j.user_id}")
            print(f"  created_at  : {j.created_at} ({age} ago)")
            print(f"  completed   : {j.completed_at}")
            print(f"  duration    : {j.duration}s (audio)")
            print(f"  file_url    : {j.file_url}")
            print(f"  segment#    : {len(j.segments.split('}, {')) if j.segments else 0}")
            if j.error:
                print(f"  error       : {j.error}")
            print()


if __name__ == "__main__":
    main()
