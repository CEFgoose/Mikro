#!/usr/bin/env python3
"""
Clear out stuck and errored transcription jobs + their Spaces audio.

Runnable from inside the backend pod:

    curl -sS https://raw.githubusercontent.com/CEFgoose/Mikro/master/scripts/transcribe_cleanup.py | python3

Actions:
  1. Marks any job still in status="transcribing" as error="Cleanup: hung job".
  2. DELETES the Spaces audio object for every to-be-cleaned job (stuck + error)
     so the bucket doesn't accumulate orphaned uploads.
  3. Hard-deletes all rows with status="error" from the TranscriptionJob table
     so they stop cluttering the recent-jobs list in the UI.

Spaces delete is best-effort: DB delete still proceeds even if S3 fails.
Uses the same boto3 config Flask uses (DO_SPACES_* env vars).

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


def _build_s3_client_and_bucket():
    """Return (s3_client, bucket_name, bucket_marker) or (None, None, None) if not configured."""
    with app.app_context():
        bucket = app.config.get("DO_SPACES_BUCKET")
        endpoint = app.config.get("DO_SPACES_ENDPOINT")
        key = app.config.get("DO_SPACES_KEY")
        secret = app.config.get("DO_SPACES_SECRET")
        region = app.config.get("DO_SPACES_REGION")
    if not all([bucket, endpoint, key, secret]):
        return None, None, None

    try:
        import boto3
        from botocore.config import Config as BotoConfig

        cfg = BotoConfig(
            connect_timeout=15,
            read_timeout=60,
            retries={"max_attempts": 3, "mode": "standard"},
        )
        s3 = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=key,
            aws_secret_access_key=secret,
            region_name=region,
            config=cfg,
        )
        return s3, bucket, f"/{bucket}/"
    except Exception as e:
        print(f"  ! Could not create S3 client: {e}", file=sys.stderr)
        return None, None, None


def _spaces_key_for(job, bucket_marker):
    """Parse the Spaces object key out of the stored file_url, if present."""
    if not job.file_url or not bucket_marker:
        return None
    if bucket_marker not in job.file_url:
        return None
    return job.file_url.split(bucket_marker, 1)[-1]


def _delete_from_spaces(s3, bucket, jobs, bucket_marker):
    """Best-effort: delete the Spaces audio for each job. Returns (ok_count, fail_count)."""
    if s3 is None or not bucket:
        print("  ! Skipping Spaces cleanup — DO_SPACES_* config missing.")
        return (0, 0)

    ok = 0
    fail = 0
    for j in jobs:
        spaces_key = _spaces_key_for(j, bucket_marker)
        if not spaces_key:
            # No usable file_url — skip silently, DB delete still proceeds.
            continue
        try:
            s3.delete_object(Bucket=bucket, Key=spaces_key)
            ok += 1
            print(f"    spaces: deleted {spaces_key}")
        except Exception as e:
            fail += 1
            print(f"    spaces: FAILED to delete {spaces_key}: {e}")
    return ok, fail


def main():
    s3, bucket, bucket_marker = _build_s3_client_and_bucket()
    with app.app_context():
        # 1. Collect everything we're going to clean (before mutating state)
        stuck = TranscriptionJob.query.filter_by(status="transcribing").all()
        existing_errored = TranscriptionJob.query.filter_by(status="error").all()

        # 2. Cancel anything still marked transcribing (these will also get
        #    their Spaces audio dropped below, then deleted from DB with the
        #    error rows).
        for j in stuck:
            j.status = "error"
            j.error = "Cleanup: hung job"
            j.completed_at = datetime.now(timezone.utc)
        if stuck:
            db.session.commit()
        print(f"Cancelled {len(stuck)} stuck 'transcribing' job(s):")
        for j in stuck:
            print(f"  - {j.id} ({j.file_name})")

        # 3. Best-effort Spaces cleanup for every job we're about to drop.
        #    Must happen BEFORE the DB delete so we still know the file_url.
        to_clean = stuck + existing_errored
        print(f"Cleaning up Spaces audio for {len(to_clean)} job(s):")
        spaces_ok, spaces_fail = _delete_from_spaces(s3, bucket, to_clean, bucket_marker)
        print(f"  Spaces summary: {spaces_ok} deleted, {spaces_fail} failed")

        # 4. Hard-delete every error row from the DB (including the jobs we
        #    just flipped from transcribing -> error).
        errored_now = TranscriptionJob.query.filter_by(status="error").all()
        count = len(errored_now)
        ids = [(j.id, j.file_name) for j in errored_now]
        for j in errored_now:
            db.session.delete(j)
        if errored_now:
            db.session.commit()
        print(f"Deleted {count} error row(s) from DB:")
        for jid, fname in ids:
            print(f"  - {jid} ({fname})")

        remaining = TranscriptionJob.query.count()
        print(f"Remaining jobs in table: {remaining}")


if __name__ == "__main__":
    main()
