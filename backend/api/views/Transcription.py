#!/usr/bin/env python3
"""
Transcription API — async server-side Whisper transcription.

Upload flow:
1. Accept audio file upload
2. Store file in DO Spaces
3. Create TranscriptionJob row in DB (status=queued)
4. Return jobId immediately

The background worker picks up queued jobs, transcribes with
faster-whisper, and stores results back in the DB.

Frontend polls GET /result?jobId=X to check progress.
"""

import json
import os
import uuid
import tempfile
import boto3
from botocore.exceptions import ClientError
from flask.views import MethodView
from flask import request, current_app, g

from ..utils import requires_admin


def _get_s3_client():
    """Create a boto3 S3 client for DO Spaces."""
    return boto3.client(
        "s3",
        endpoint_url=current_app.config.get("DO_SPACES_ENDPOINT"),
        aws_access_key_id=current_app.config.get("DO_SPACES_KEY"),
        aws_secret_access_key=current_app.config.get("DO_SPACES_SECRET"),
        region_name=current_app.config.get("DO_SPACES_REGION"),
    )


# ──────────────────────────────────────────────────────────────────────
# TEMP: one-shot CORS bootstrap for the shared Kaart Spaces bucket.
#
# DO Spaces web UI does not expose "ExposeHeaders", which browsers
# require in order to read ETag from multipart chunk PUTs. This helper
# merges Mikro's CORS rules into the bucket policy on the first upload
# attempt per process. Idempotent and safe to re-run (existing rules
# from other Kaart apps are preserved).
#
# REMOVE AFTER VERIFYING CORS IS LIVE IN PROD (commit that adds the
# presigned-multipart flow should also drop this helper).
# ──────────────────────────────────────────────────────────────────────

_CORS_CONFIGURED = False

_MIKRO_CORS_RULES = [
    {
        "ID": "mikro-transcribe-prod",
        "AllowedOrigins": ["https://mikro.kaart.com"],
        "AllowedMethods": ["GET", "PUT", "HEAD"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000,
    },
    {
        "ID": "mikro-transcribe-dev",
        "AllowedOrigins": ["http://localhost:3000"],
        "AllowedMethods": ["GET", "PUT", "HEAD"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000,
    },
]

_MIKRO_CORS_ORIGINS = {o for rule in _MIKRO_CORS_RULES for o in rule["AllowedOrigins"]}


def _ensure_bucket_cors():
    """Merge Mikro CORS rules into the shared bucket. Runs once per process."""
    global _CORS_CONFIGURED
    if _CORS_CONFIGURED:
        return

    bucket = current_app.config.get("DO_SPACES_BUCKET")
    if not bucket:
        current_app.logger.warning("CORS bootstrap skipped: DO_SPACES_BUCKET unset")
        return

    s3 = _get_s3_client()

    try:
        resp = s3.get_bucket_cors(Bucket=bucket)
        existing = resp.get("CORSRules", [])
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code in ("NoSuchCORSConfiguration", "NoSuchCORSConfigurationError"):
            existing = []
        else:
            current_app.logger.error(f"CORS bootstrap: get_bucket_cors failed: {e}")
            return

    # Drop any rule whose origins overlap ours; keep everything else.
    preserved = [
        rule for rule in existing
        if not (set(rule.get("AllowedOrigins", [])) & _MIKRO_CORS_ORIGINS)
    ]
    merged = preserved + _MIKRO_CORS_RULES

    try:
        s3.put_bucket_cors(
            Bucket=bucket,
            CORSConfiguration={"CORSRules": merged},
        )
        _CORS_CONFIGURED = True
        current_app.logger.info(
            f"CORS bootstrap: applied {len(merged)} rule(s) to '{bucket}' "
            f"(preserved {len(preserved)}, added {len(_MIKRO_CORS_RULES)})"
        )
    except ClientError as e:
        current_app.logger.error(f"CORS bootstrap: put_bucket_cors failed: {e}")


def _upload_to_spaces(file_obj, key):
    """Upload a file object to DO Spaces and return the URL."""
    bucket = current_app.config.get("DO_SPACES_BUCKET")
    endpoint = current_app.config.get("DO_SPACES_ENDPOINT")

    s3 = _get_s3_client()
    s3.upload_fileobj(file_obj, bucket, key)

    return f"{endpoint}/{bucket}/{key}"


class TranscriptionAPI(MethodView):
    """Transcription API endpoints."""

    def post(self, path: str):
        if path == "upload":
            return self.upload()
        return {"message": "Unknown path", "status": 404}

    def get(self, path: str):
        if path == "status":
            return self.status()
        elif path == "result":
            return self.result()
        elif path == "recent":
            return self.recent()
        return {"message": "Unknown path", "status": 404}

    @requires_admin
    def upload(self):
        """Accept audio file upload, store in Spaces, queue transcription job."""
        from ..database import db, TranscriptionJob

        # TEMP: bootstrap CORS on the shared bucket before first upload of
        # each process lifetime. Remove once presigned-multipart flow lands.
        _ensure_bucket_cors()

        if not (request.files and "file" in request.files):
            return {"message": "No file provided. Send as multipart 'file'.", "status": 400}

        file = request.files["file"]
        file_name = file.filename or "audio.m4a"
        ext = os.path.splitext(file_name)[1] or ".m4a"

        # Generate job ID
        job_id = str(uuid.uuid4())[:8]
        spaces_key = f"transcriptions/{job_id}{ext}"

        try:
            # Upload to DO Spaces
            file_url = _upload_to_spaces(file, spaces_key)
        except Exception as e:
            current_app.logger.error(f"Failed to upload to Spaces: {e}")
            return {"message": f"File storage error: {str(e)}", "status": 500}

        # Create job in DB
        job = TranscriptionJob(
            id=job_id,
            user_id=g.user.id,
            org_id=getattr(g.user, "org_id", None),
            status="queued",
            file_name=file_name,
            file_url=file_url,
        )
        db.session.add(job)
        db.session.commit()

        current_app.logger.info(
            f"Transcription job {job_id} queued for {file_name} ({file_url})"
        )

        return {
            "message": "Transcription queued",
            "jobId": job_id,
            "status": 200,
        }

    @requires_admin
    def status(self):
        """Check transcription job status."""
        from ..database import TranscriptionJob

        job_id = request.args.get("jobId")
        if not job_id:
            return {"message": "jobId required", "status": 400}

        job = TranscriptionJob.query.get(job_id)
        if not job:
            return {"message": "Job not found", "status": 404}

        return {
            "jobId": job_id,
            "jobStatus": job.status,
            "progress": job.progress or 0,
            "status": 200,
        }

    @requires_admin
    def result(self):
        """Get transcription result."""
        from ..database import TranscriptionJob

        job_id = request.args.get("jobId")
        if not job_id:
            return {"message": "jobId required", "status": 400}

        job = TranscriptionJob.query.get(job_id)
        if not job:
            return {"message": "Job not found", "status": 404}

        if job.status == "error":
            return {
                "jobId": job_id,
                "jobStatus": "error",
                "error": job.error or "Unknown error",
                "status": 500,
            }

        # Parse segments from JSON string
        segments = []
        if job.segments:
            try:
                segments = json.loads(job.segments)
            except (json.JSONDecodeError, TypeError):
                pass

        return {
            "jobId": job_id,
            "jobStatus": job.status,
            "segments": segments,
            "text": job.text or "",
            "duration": job.duration or 0,
            "progress": job.progress or 0,
            "status": 200,
        }

    @requires_admin
    def recent(self):
        """Get recent transcription jobs for the current user."""
        from ..database import TranscriptionJob

        jobs = (
            TranscriptionJob.query
            .filter_by(user_id=g.user.id)
            .order_by(TranscriptionJob.created_at.desc())
            .limit(10)
            .all()
        )

        result = []
        for job in jobs:
            segments = []
            if job.segments:
                try:
                    segments = json.loads(job.segments)
                except (json.JSONDecodeError, TypeError):
                    pass

            result.append({
                "jobId": job.id,
                "jobStatus": job.status,
                "fileName": job.file_name,
                "segments": segments,
                "text": job.text or "",
                "duration": job.duration or 0,
                "progress": job.progress or 0,
                "error": job.error,
                "createdAt": job.created_at.isoformat() if job.created_at else None,
                "completedAt": job.completed_at.isoformat() if job.completed_at else None,
            })

        return {"jobs": result, "status": 200}
