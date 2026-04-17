#!/usr/bin/env python3
"""
Transcription API — server-side Whisper transcription.

Accepts audio file uploads, transcribes with faster-whisper, returns
timestamped segments synchronously in the upload response.
"""

import os
import tempfile
import threading
import base64
from flask.views import MethodView
from flask import request, current_app, g

from ..utils import requires_admin

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
                current_app.logger.info(f"Loading Whisper model: {model_size}")
                _model = WhisperModel(
                    model_size,
                    device="cpu",
                    compute_type="int8",
                    cpu_threads=cpu_threads,
                )
                current_app.logger.info("Whisper model loaded")
    return _model


class TranscriptionAPI(MethodView):
    """Transcription API endpoints."""

    def post(self, path: str):
        if path == "upload":
            return self.upload()
        return {"message": "Unknown path", "status": 404}

    @requires_admin
    def upload(self):
        """Accept audio file upload, transcribe synchronously, return result."""
        # Support both multipart file upload and base64 JSON
        if request.files and "file" in request.files:
            file = request.files["file"]
            file_name = file.filename or "audio.m4a"
            ext = os.path.splitext(file_name)[1] or ".m4a"
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
            file.save(tmp.name)
            tmp.close()
        elif request.get_json(silent=True) and request.get_json(silent=True).get("file"):
            data = request.get_json(silent=True)
            file_b64 = data["file"]
            file_name = data.get("fileName", "audio.m4a")
            try:
                file_bytes = base64.b64decode(file_b64)
            except Exception:
                return {"message": "Invalid base64 data", "status": 400}
            ext = os.path.splitext(file_name)[1] or ".m4a"
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
            tmp.write(file_bytes)
            tmp.close()
        else:
            return {"message": "No file provided. Send as multipart 'file' or JSON {file: base64, fileName: name}", "status": 400}

        try:
            model = get_model()
            segments_iter, info = model.transcribe(
                tmp.name,
                language="en",
                beam_size=5,
                vad_filter=True,
            )

            segments = []
            for segment in segments_iter:
                segments.append({
                    "timeStart": round(segment.start, 2),
                    "timeEnd": round(segment.end, 2),
                    "text": segment.text.strip(),
                })

            full_text = " ".join(s["text"] for s in segments)

            return {
                "jobStatus": "done",
                "segments": segments,
                "text": full_text,
                "duration": round(info.duration, 1),
                "status": 200,
            }

        except Exception as e:
            current_app.logger.error(f"Transcription error: {e}")
            return {
                "jobStatus": "error",
                "error": str(e),
                "status": 500,
            }
        finally:
            try:
                os.unlink(tmp.name)
            except OSError:
                pass
