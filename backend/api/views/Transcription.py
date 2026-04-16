#!/usr/bin/env python3
"""
Transcription API — server-side Whisper transcription.

Accepts audio file uploads, transcribes with faster-whisper, returns
timestamped segments. Runs in a background thread to avoid blocking
the Flask request handler.
"""

import os
import uuid
import tempfile
import threading
import time
from flask.views import MethodView
from flask import request, current_app, g

from ..utils import requires_admin

# In-memory job store (fine for single-server internal tool)
_jobs = {}


def _get_whisper_model():
    """Lazy-load the Whisper model on first use."""
    from faster_whisper import WhisperModel

    model_size = os.environ.get("WHISPER_MODEL", "medium.en")
    cpu_threads = int(os.environ.get("WHISPER_THREADS", "4"))

    current_app.logger.info(f"Loading Whisper model: {model_size}")
    model = WhisperModel(
        model_size,
        device="cpu",
        compute_type="int8",
        cpu_threads=cpu_threads,
    )
    current_app.logger.info("Whisper model loaded")
    return model


# Module-level model cache
_model = None
_model_lock = threading.Lock()


def get_model():
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                from faster_whisper import WhisperModel

                model_size = os.environ.get("WHISPER_MODEL", "medium.en")
                cpu_threads = int(os.environ.get("WHISPER_THREADS", "4"))
                _model = WhisperModel(
                    model_size,
                    device="cpu",
                    compute_type="int8",
                    cpu_threads=cpu_threads,
                )
    return _model


def _transcribe_worker(job_id, file_path, app):
    """Background worker that runs transcription."""
    with app.app_context():
        try:
            _jobs[job_id]["status"] = "transcribing"

            model = get_model()
            segments_iter, info = model.transcribe(
                file_path,
                language="en",
                beam_size=5,
                vad_filter=True,  # Skip silence for speed
            )

            segments = []
            for segment in segments_iter:
                seg = {
                    "timeStart": round(segment.start, 2),
                    "timeEnd": round(segment.end, 2),
                    "text": segment.text.strip(),
                }
                segments.append(seg)
                _jobs[job_id]["segments"] = segments
                _jobs[job_id]["progress"] = len(segments)

            full_text = " ".join(s["text"] for s in segments)

            _jobs[job_id].update({
                "status": "done",
                "segments": segments,
                "text": full_text,
                "duration": round(info.duration, 1),
            })

        except Exception as e:
            _jobs[job_id].update({
                "status": "error",
                "error": str(e),
            })
        finally:
            # Clean up temp file
            try:
                os.unlink(file_path)
            except OSError:
                pass


class TranscriptionAPI(MethodView):
    """Transcription API endpoints."""

    def post(self, path: str):
        if path == "upload":
            return self.upload()
        elif path == "status":
            return self.status()
        elif path == "result":
            return self.result()
        return {"message": "Unknown path", "status": 404}

    def get(self, path: str):
        if path == "status":
            return self.status()
        elif path == "result":
            return self.result()
        return {"message": "Unknown path", "status": 404}

    @requires_admin
    def upload(self):
        """Accept an audio file upload and start transcription."""
        if "file" not in request.files:
            return {"message": "No file provided", "status": 400}

        file = request.files["file"]
        if not file.filename:
            return {"message": "No filename", "status": 400}

        # Save to temp file
        ext = os.path.splitext(file.filename)[1] or ".m4a"
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
        file.save(tmp.name)
        tmp.close()

        # Create job
        job_id = str(uuid.uuid4())[:8]
        _jobs[job_id] = {
            "status": "queued",
            "segments": [],
            "progress": 0,
            "text": "",
            "created": time.time(),
        }

        # Start background transcription
        app = current_app._get_current_object()
        thread = threading.Thread(
            target=_transcribe_worker,
            args=(job_id, tmp.name, app),
            daemon=True,
        )
        thread.start()

        return {
            "message": "Transcription started",
            "jobId": job_id,
            "status": 200,
        }

    @requires_admin
    def status(self):
        """Check transcription job status."""
        job_id = request.json.get("jobId") if request.json else request.args.get("jobId")
        if not job_id or job_id not in _jobs:
            return {"message": "Job not found", "status": 404}

        job = _jobs[job_id]
        return {
            "jobId": job_id,
            "jobStatus": job["status"],
            "progress": job.get("progress", 0),
            "status": 200,
        }

    @requires_admin
    def result(self):
        """Get transcription result."""
        job_id = request.json.get("jobId") if request.json else request.args.get("jobId")
        if not job_id or job_id not in _jobs:
            return {"message": "Job not found", "status": 404}

        job = _jobs[job_id]
        if job["status"] == "error":
            return {
                "jobId": job_id,
                "jobStatus": "error",
                "error": job.get("error", "Unknown error"),
                "status": 500,
            }

        return {
            "jobId": job_id,
            "jobStatus": job["status"],
            "segments": job.get("segments", []),
            "text": job.get("text", ""),
            "duration": job.get("duration", 0),
            "progress": job.get("progress", 0),
            "status": 200,
        }
