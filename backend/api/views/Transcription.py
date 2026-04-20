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
# Spaces CORS configuration — permanent home.
#
# Runs once per Flask process on the first upload_init call. This IS
# the canonical place we manage Mikro's CORS rules on the shared
# `kaart` Spaces bucket — NOT a temporary shim.
#
# Why in-code instead of the DO dashboard: browsers need
# `ExposeHeaders: ETag` to read each multipart chunk's ETag out of the
# PUT response (required to finalise multipart uploads). The DO Spaces
# web UI has no field for ExposeHeaders — it can only be set via the
# S3 API. So we set it from here on cold start.
#
# Idempotent: preserves any existing rules owned by other Kaart apps
# (identified by non-overlapping AllowedOrigins), and only upserts
# rules whose origins match our own set.
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
        current_app.logger.warning("Spaces CORS config skipped: DO_SPACES_BUCKET unset")
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
            current_app.logger.error(f"Spaces CORS config: get_bucket_cors failed: {e}")
            return

    preserved = [
        rule for rule in existing
        if not (set(rule.get("AllowedOrigins", [])) & _MIKRO_CORS_ORIGINS)
    ]
    # Our rules MUST come first: S3 CORS evaluates rules top-down and the
    # first rule whose AllowedOrigins+AllowedMethods match wins. If another
    # app has a permissive wildcard rule, putting ours last means ours
    # never matches and ExposeHeaders: ETag is effectively ignored.
    merged = _MIKRO_CORS_RULES + preserved

    try:
        s3.put_bucket_cors(
            Bucket=bucket,
            CORSConfiguration={"CORSRules": merged},
        )
        _CORS_CONFIGURED = True
        current_app.logger.info(
            f"Spaces CORS config: applied {len(merged)} rule(s) to '{bucket}' "
            f"(mikro={len(_MIKRO_CORS_RULES)} first, preserved={len(preserved)})"
        )
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "<unknown>")
        current_app.logger.error(
            f"Spaces CORS config: put_bucket_cors FAILED code={code} err={e}"
        )


MAX_FILE_BYTES = 1024 * 1024 * 1024  # 1 GB hard cap
PART_SIZE = 10 * 1024 * 1024          # 10 MB per part


class TranscriptionAPI(MethodView):
    """Transcription API endpoints."""

    def post(self, path: str):
        if path == "upload-init":
            return self.upload_init()
        if path == "upload-complete":
            return self.upload_complete()
        if path == "upload-abort":
            return self.upload_abort()
        if path == "cancel":
            return self.cancel()
        if path == "cors-apply":
            return self.cors_apply()
        return {"message": "Unknown path", "status": 404}

    def get(self, path: str):
        if path == "status":
            return self.status()
        elif path == "result":
            return self.result()
        elif path == "recent":
            return self.recent()
        elif path == "cors-status":
            return self.cors_status()
        return {"message": "Unknown path", "status": 404}

    @requires_admin
    def upload_init(self):
        """
        Start a multipart upload direct to DO Spaces.
        Returns uploadId + presigned PUT URLs, one per part.
        """
        _ensure_bucket_cors()

        body = request.get_json(silent=True) or {}
        file_name = body.get("fileName") or "audio.m4a"
        file_size = body.get("fileSize")
        content_type = body.get("contentType") or "application/octet-stream"

        if not isinstance(file_size, int) or file_size <= 0:
            return {"message": "fileSize (positive integer) required", "status": 400}
        if file_size > MAX_FILE_BYTES:
            return {
                "message": f"File exceeds {MAX_FILE_BYTES // (1024 * 1024)} MB limit",
                "status": 413,
            }

        ext = os.path.splitext(file_name)[1] or ".m4a"
        job_id = str(uuid.uuid4())[:8]
        spaces_key = f"mikro/transcriptions/{job_id}{ext}"
        bucket = current_app.config.get("DO_SPACES_BUCKET")

        s3 = _get_s3_client()

        try:
            resp = s3.create_multipart_upload(
                Bucket=bucket,
                Key=spaces_key,
                ContentType=content_type,
            )
            upload_id = resp["UploadId"]
        except Exception as e:
            current_app.logger.error(f"create_multipart_upload failed: {e}")
            return {"message": f"Failed to start upload: {str(e)}", "status": 500}

        part_count = (file_size + PART_SIZE - 1) // PART_SIZE
        try:
            part_urls = [
                s3.generate_presigned_url(
                    "upload_part",
                    Params={
                        "Bucket": bucket,
                        "Key": spaces_key,
                        "UploadId": upload_id,
                        "PartNumber": n,
                    },
                    ExpiresIn=3600,
                )
                for n in range(1, part_count + 1)
            ]
        except Exception as e:
            current_app.logger.error(f"generate_presigned_url failed: {e}")
            # Best-effort abort so we don't leak an orphan upload
            try:
                s3.abort_multipart_upload(Bucket=bucket, Key=spaces_key, UploadId=upload_id)
            except Exception:
                pass
            return {"message": f"Failed to sign upload URLs: {str(e)}", "status": 500}

        current_app.logger.info(
            f"[transcribe-upload] init job_id={job_id} parts={part_count} "
            f"size={file_size} key={spaces_key}"
        )

        return {
            "jobId": job_id,
            "uploadId": upload_id,
            "spacesKey": spaces_key,
            "partSize": PART_SIZE,
            "partCount": part_count,
            "partUrls": part_urls,
            "status": 200,
        }

    @requires_admin
    def upload_complete(self):
        """Finalise the multipart upload and queue a transcription job."""
        from ..database import db, TranscriptionJob

        body = request.get_json(silent=True) or {}
        upload_id = body.get("uploadId")
        spaces_key = body.get("spacesKey")
        job_id = body.get("jobId")
        file_name = body.get("fileName") or "audio.m4a"
        parts = body.get("parts") or []

        if not all([upload_id, spaces_key, job_id]) or not parts:
            return {"message": "uploadId, spacesKey, jobId, parts required", "status": 400}

        bucket = current_app.config.get("DO_SPACES_BUCKET")
        endpoint = current_app.config.get("DO_SPACES_ENDPOINT")

        s3 = _get_s3_client()

        normalised_parts = sorted(
            ({"PartNumber": int(p["PartNumber"]), "ETag": p["ETag"]} for p in parts),
            key=lambda p: p["PartNumber"],
        )

        try:
            s3.complete_multipart_upload(
                Bucket=bucket,
                Key=spaces_key,
                UploadId=upload_id,
                MultipartUpload={"Parts": normalised_parts},
            )
        except Exception as e:
            current_app.logger.error(f"complete_multipart_upload failed: {e}")
            return {"message": f"Failed to finalise upload: {str(e)}", "status": 500}

        file_url = f"{endpoint}/{bucket}/{spaces_key}"

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
            f"[transcribe-upload] complete job_id={job_id} parts={len(normalised_parts)} "
            f"url={file_url}"
        )

        return {
            "message": "Transcription queued",
            "jobId": job_id,
            "status": 200,
        }

    @requires_admin
    def upload_abort(self):
        """Abort an in-flight multipart upload so Spaces doesn't retain partial data."""
        body = request.get_json(silent=True) or {}
        upload_id = body.get("uploadId")
        spaces_key = body.get("spacesKey")

        if not upload_id or not spaces_key:
            return {"message": "uploadId and spacesKey required", "status": 400}

        bucket = current_app.config.get("DO_SPACES_BUCKET")
        s3 = _get_s3_client()

        try:
            s3.abort_multipart_upload(Bucket=bucket, Key=spaces_key, UploadId=upload_id)
        except Exception as e:
            current_app.logger.warning(f"abort_multipart_upload failed (non-fatal): {e}")

        current_app.logger.info(
            f"[transcribe-upload] abort upload_id={upload_id} key={spaces_key}"
        )

        return {"status": 200}

    @requires_admin
    def cancel(self):
        """
        Mark a queued/transcribing job as cancelled so the frontend can move
        on and the worker's one-at-a-time lock is released.

        Does not kill an in-flight faster-whisper call — the worker checks
        the job status between segments and bails out. Worst case: the
        worker finishes the current segment, sees status=error, exits.
        """
        from ..database import db, TranscriptionJob

        from datetime import datetime, timezone

        body = request.get_json(silent=True) or {}
        job_id = body.get("jobId")
        if not job_id:
            return {"message": "jobId required", "status": 400}

        job = TranscriptionJob.query.get(job_id)
        if not job:
            return {"message": "Job not found", "status": 404}

        if job.status in ("done", "error"):
            return {"message": f"Job already {job.status}", "jobStatus": job.status, "status": 200}

        job.status = "error"
        job.error = "Cancelled by user"
        job.completed_at = datetime.now(timezone.utc)
        db.session.commit()

        current_app.logger.info(f"[transcribe] job {job_id} cancelled by user {g.user.id}")

        return {"jobId": job_id, "jobStatus": "error", "status": 200}

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

    @requires_admin
    def cors_status(self):
        """
        Diagnostic: fetch the CURRENT CORS rules on the Spaces bucket and
        report whether our expected rules are in place.
        Useful when uploads fail with 'Missing ETag' and we need to find
        out whether the in-process config actually stuck.
        """
        bucket = current_app.config.get("DO_SPACES_BUCKET")
        if not bucket:
            return {"status": 500, "error": "DO_SPACES_BUCKET not configured"}

        s3 = _get_s3_client()
        try:
            resp = s3.get_bucket_cors(Bucket=bucket)
            rules = resp.get("CORSRules", [])
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "<unknown>")
            if code in ("NoSuchCORSConfiguration", "NoSuchCORSConfigurationError"):
                return {
                    "status": 200,
                    "bucket": bucket,
                    "rules": [],
                    "mikroRulesPresent": [],
                    "mikroRulesExpected": sorted(r["ID"] for r in _MIKRO_CORS_RULES),
                    "bootstrapRanFlag": _CORS_CONFIGURED,
                    "note": "Bucket has NO CORS configuration at all.",
                }
            return {
                "status": 500,
                "error": f"get_bucket_cors failed: code={code} err={str(e)}",
                "bootstrapRanFlag": _CORS_CONFIGURED,
            }

        mikro_ids = {r["ID"] for r in _MIKRO_CORS_RULES}
        present = [r.get("ID") for r in rules if r.get("ID") in mikro_ids]

        return {
            "status": 200,
            "bucket": bucket,
            "ruleCount": len(rules),
            "rules": rules,
            "mikroRulesPresent": sorted(present),
            "mikroRulesExpected": sorted(mikro_ids),
            "bootstrapRanFlag": _CORS_CONFIGURED,
        }

    @requires_admin
    def cors_apply(self):
        """
        Diagnostic: force-run the CORS config (resets the once-per-process
        flag) and return detailed before/after/error info. This is the
        endpoint to hit if a deploy doesn't come up clean.
        """
        global _CORS_CONFIGURED

        bucket = current_app.config.get("DO_SPACES_BUCKET")
        if not bucket:
            return {"status": 500, "error": "DO_SPACES_BUCKET not configured"}

        s3 = _get_s3_client()

        try:
            resp = s3.get_bucket_cors(Bucket=bucket)
            before = resp.get("CORSRules", [])
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "<unknown>")
            if code in ("NoSuchCORSConfiguration", "NoSuchCORSConfigurationError"):
                before = []
            else:
                return {
                    "status": 500,
                    "error": f"get_bucket_cors failed: code={code} err={str(e)}",
                }

        preserved = [
            rule for rule in before
            if not (set(rule.get("AllowedOrigins", [])) & _MIKRO_CORS_ORIGINS)
        ]
        merged = _MIKRO_CORS_RULES + preserved

        try:
            s3.put_bucket_cors(
                Bucket=bucket,
                CORSConfiguration={"CORSRules": merged},
            )
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "<unknown>")
            return {
                "status": 500,
                "error": f"put_bucket_cors failed: code={code} err={str(e)}",
                "beforeRuleCount": len(before),
                "attemptedMikroCount": len(_MIKRO_CORS_RULES),
                "attemptedPreservedCount": len(preserved),
            }

        _CORS_CONFIGURED = True
        return {
            "status": 200,
            "bucket": bucket,
            "beforeRuleCount": len(before),
            "afterRuleCount": len(merged),
            "mikroAdded": len(_MIKRO_CORS_RULES),
            "preservedFromOtherApps": len(preserved),
            "rules": merged,
        }
