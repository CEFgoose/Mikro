import json
import logging
import os
import tempfile
import traceback
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


def get_audio_duration_seconds(file_path):
    """Return the total audio duration in seconds using pyav metadata."""
    import av

    container = av.open(file_path)
    try:
        if container.duration:
            return float(container.duration) / av.time_base
        streams = container.streams.audio
        if streams and streams[0].duration:
            ts = streams[0].duration
            tb = streams[0].time_base
            return float(ts * tb) if ts and tb else 0.0
        return 0.0
    finally:
        container.close()


def stream_audio_chunks(file_path, chunk_seconds, sampling_rate=16000, skip_seconds=0.0):
    """
    Generator yielding (offset_seconds, mono_float32_numpy_array) tuples for
    consecutive audio chunks of up to chunk_seconds each, starting at
    skip_seconds into the file. Memory footprint stays bounded at roughly
    one chunk's worth of samples, NOT the whole audio file — critical for
    long recordings on constrained pods.

    Uses pyav (bundled with faster-whisper) to decode + resample + slice on
    the fly.
    """
    import av
    import numpy as np

    container = av.open(file_path)
    try:
        audio_stream = container.streams.audio[0]

        if skip_seconds > 0 and audio_stream.time_base:
            # pyav seeks to the nearest keyframe BEFORE the target, so we
            # filter post-seek to drop frames we don't want.
            target_pts = int(float(skip_seconds) / float(audio_stream.time_base))
            try:
                container.seek(target_pts, stream=audio_stream)
            except av.AVError:
                # Unseekable container — just iterate from start and skip.
                pass

        resampler = av.AudioResampler(
            format="flt",
            layout="mono",
            rate=sampling_rate,
        )

        chunk_samples = int(chunk_seconds * sampling_rate)
        buffer_arrays = []
        buffer_samples = 0
        current_offset = float(skip_seconds)

        for frame in container.decode(audio_stream):
            # Discard frames that end before our resume point (seek imprecise)
            if frame.pts is not None and audio_stream.time_base:
                frame_start = float(frame.pts * audio_stream.time_base)
                frame_dur = 0.0
                if frame.samples and frame.sample_rate:
                    frame_dur = float(frame.samples) / float(frame.sample_rate)
                if frame_start + frame_dur <= skip_seconds:
                    continue

            for out in resampler.resample(frame):
                arr = out.to_ndarray().reshape(-1).astype(np.float32)
                if arr.shape[0] > 0:
                    buffer_arrays.append(arr)
                    buffer_samples += arr.shape[0]

            while buffer_samples >= chunk_samples:
                combined = np.concatenate(buffer_arrays)
                yield (current_offset, combined[:chunk_samples].astype(np.float32))
                remainder = combined[chunk_samples:]
                buffer_arrays = [remainder] if remainder.shape[0] > 0 else []
                buffer_samples = remainder.shape[0]
                current_offset += chunk_seconds

        # Flush any frames the resampler is holding
        try:
            for out in resampler.resample(None):
                arr = out.to_ndarray().reshape(-1).astype(np.float32)
                if arr.shape[0] > 0:
                    buffer_arrays.append(arr)
                    buffer_samples += arr.shape[0]
        except (av.AVError, TypeError):
            pass

        if buffer_samples > 0:
            yield (current_offset, np.concatenate(buffer_arrays).astype(np.float32))
    finally:
        container.close()


def _spaces_audio_exists(app, job):
    """
    HEAD the Spaces object for a TranscriptionJob to check whether the
    audio is still available. Returns True/False, or None if we couldn't
    even attempt the check (missing config, bad URL) — caller should
    treat None as "unknown, don't discard the job on that basis".
    """
    bucket = app.config.get("DO_SPACES_BUCKET")
    endpoint = app.config.get("DO_SPACES_ENDPOINT")
    key = app.config.get("DO_SPACES_KEY")
    secret = app.config.get("DO_SPACES_SECRET")
    region = app.config.get("DO_SPACES_REGION")
    if not all([bucket, endpoint, key, secret]):
        return None
    if not job.file_url:
        return None
    bucket_marker = f"/{bucket}/"
    if bucket_marker not in job.file_url:
        return None
    spaces_key = job.file_url.split(bucket_marker, 1)[-1]
    try:
        import boto3
        from botocore.config import Config as BotoConfig
        from botocore.exceptions import ClientError
        cfg = BotoConfig(
            connect_timeout=10,
            read_timeout=15,
            retries={"max_attempts": 2, "mode": "standard"},
        )
        s3 = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=key,
            aws_secret_access_key=secret,
            region_name=region,
            config=cfg,
        )
        try:
            s3.head_object(Bucket=bucket, Key=spaces_key)
            return True
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "")
            if code in ("404", "NoSuchKey", "NotFound"):
                return False
            logger.warning(
                f"[TRANSCRIBE-ORPHAN] head_object({spaces_key}) "
                f"returned {code}; treating as unknown."
            )
            return None
    except Exception as e:
        logger.warning(
            f"[TRANSCRIBE-ORPHAN] Could not HEAD Spaces object for "
            f"job {job.id}: {e}"
        )
        return None


def abandon_orphan_transcriptions(app):
    """
    On worker startup, any TranscriptionJob in status='transcribing' is a
    zombie — the worker process that was running it is dead (restart,
    redeploy, OOM, etc.).

    Strategy: requeue whenever we can, error only when we truly can't.
      - progress > 0: REQUEUE. Existing segments stay intact; the worker
        will RESUME from the last segment's end-timestamp.
      - progress == 0 and audio still in Spaces: REQUEUE for a full retry.
      - progress == 0 and audio missing: mark error.
      - Spaces reachability unknown: REQUEUE optimistically.
    """
    with app.app_context():
        from ...database import db, TranscriptionJob
        try:
            orphans = TranscriptionJob.query.filter_by(status="transcribing").all()
            if not orphans:
                return

            requeued_resume = 0
            requeued_restart = 0
            discarded = 0
            for job in orphans:
                progress = job.progress or 0
                has_segments = False
                last_end = 0.0
                if job.segments:
                    try:
                        parsed = json.loads(job.segments)
                        if isinstance(parsed, list) and parsed:
                            has_segments = True
                            last = parsed[-1]
                            if isinstance(last, dict):
                                last_end = float(last.get("timeEnd", 0) or 0)
                    except (json.JSONDecodeError, TypeError):
                        pass

                if has_segments:
                    job.status = "queued"
                    job.started_at = None
                    logger.warning(
                        f"[TRANSCRIBE-ORPHAN] Requeued job {job.id} for "
                        f"auto-resume ({progress} segments, "
                        f"{round(last_end, 1)}s covered) — worker restart "
                        f"interrupted, will pick up where it left off."
                    )
                    requeued_resume += 1
                    continue

                audio_present = _spaces_audio_exists(app, job)
                if audio_present is False:
                    job.status = "error"
                    job.error = (
                        "Worker restart interrupted transcription and the "
                        "uploaded audio is no longer available. Please "
                        "re-upload."
                    )
                    job.completed_at = datetime.now(timezone.utc)
                    logger.warning(
                        f"[TRANSCRIBE-ORPHAN] Discarded job {job.id} "
                        f"(progress=0, audio missing from Spaces)."
                    )
                    discarded += 1
                else:
                    job.status = "queued"
                    job.started_at = None
                    job.progress = 0
                    job.segments = None
                    logger.warning(
                        f"[TRANSCRIBE-ORPHAN] Requeued job {job.id} for "
                        f"full retry (progress=0, audio "
                        f"{'present' if audio_present else 'reachability unknown'})."
                    )
                    requeued_restart += 1

            db.session.commit()
            logger.info(
                f"[TRANSCRIBE-ORPHAN] Processed {len(orphans)} orphan job(s): "
                f"{requeued_resume} resume, {requeued_restart} retry-from-scratch, "
                f"{discarded} discarded (audio gone)."
            )
        except Exception as e:
            logger.error(f"[TRANSCRIBE-ORPHAN] Failed to scan/abandon: {e}")
            db.session.rollback()


def preload_whisper_model():
    """
    Pre-load the Whisper model at worker startup so the first transcription
    job doesn't pay the HuggingFace download cost. Failure is non-fatal.
    """
    model_size = os.environ.get("MIKRO_WHISPER_MODEL", "base.en")
    cpu_threads = int(os.environ.get("MIKRO_WHISPER_THREADS", "4"))
    logger.info(
        f"[TRANSCRIBE-PRELOAD] Loading Whisper model size={model_size} "
        f"threads={cpu_threads} (downloads from HF on first run)..."
    )
    try:
        from faster_whisper import WhisperModel
        run_transcription_job._model = WhisperModel(
            model_size,
            device="cpu",
            compute_type="int8",
            cpu_threads=cpu_threads,
        )
        logger.info("[TRANSCRIBE-PRELOAD] Model loaded OK, ready for jobs.")
    except Exception as e:
        logger.error(
            f"[TRANSCRIBE-PRELOAD] Failed to pre-load model: {e}. "
            f"First job will retry the download."
        )


def run_transcription_job(app, job):
    """
    Execute a transcription job.

    Downloads audio from DO Spaces, transcribes with faster-whisper,
    stores results in the TranscriptionJob row, then cleans up the
    audio file from Spaces.
    """
    from ...database import db, TranscriptionJob

    logger.info(
        f"[TRANSCRIBE] === START job={job.id} file={job.file_name} "
        f"url={job.file_url} status={job.status} ==="
    )

    try:
        job.status = "transcribing"
        job.started_at = datetime.now(timezone.utc)
        db.session.commit()
        logger.info(f"[TRANSCRIBE] job={job.id} status set to 'transcribing'")

        bucket = app.config.get("DO_SPACES_BUCKET")
        endpoint = app.config.get("DO_SPACES_ENDPOINT")
        key = app.config.get("DO_SPACES_KEY")
        secret = app.config.get("DO_SPACES_SECRET")
        region = app.config.get("DO_SPACES_REGION")

        logger.info(
            f"[TRANSCRIBE] job={job.id} Spaces config: "
            f"bucket={bucket} endpoint={endpoint} region={region} "
            f"key={'SET' if key else 'MISSING'} secret={'SET' if secret else 'MISSING'}"
        )

        if not all([bucket, endpoint, key, secret]):
            raise ValueError(
                f"Missing DO Spaces config: bucket={bucket} endpoint={endpoint} "
                f"key={'SET' if key else 'MISSING'} secret={'SET' if secret else 'MISSING'}"
            )

        bucket_marker = f"/{bucket}/"
        spaces_key = job.file_url.split(bucket_marker, 1)[-1] if bucket_marker in job.file_url else None
        logger.info(
            f"[TRANSCRIBE] job={job.id} URL parsing: "
            f"file_url={job.file_url} bucket_marker={bucket_marker} "
            f"parsed_key={spaces_key}"
        )
        if not spaces_key:
            raise ValueError(
                f"Cannot parse Spaces key from URL: {job.file_url} "
                f"(bucket={bucket}, marker={bucket_marker})"
            )

        ext = os.path.splitext(job.file_name or "audio.m4a")[1] or ".m4a"
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
        tmp_path = tmp.name
        logger.info(f"[TRANSCRIBE] job={job.id} temp file: {tmp_path}")

        try:
            import boto3
            from botocore.config import Config as BotoConfig

            logger.info(f"[TRANSCRIBE] job={job.id} creating S3 client...")
            # Hard timeouts on the HTTP layer — default is None, which means a
            # silent connection stall to Spaces would hang the worker forever.
            _boto_cfg = BotoConfig(
                connect_timeout=15,
                read_timeout=120,
                retries={"max_attempts": 3, "mode": "standard"},
            )
            s3 = boto3.client(
                "s3",
                endpoint_url=endpoint,
                aws_access_key_id=key,
                aws_secret_access_key=secret,
                region_name=region,
                config=_boto_cfg,
            )

            logger.info(
                f"[TRANSCRIBE] job={job.id} downloading from Spaces: "
                f"bucket={bucket} key={spaces_key}"
            )
            s3.download_fileobj(bucket, spaces_key, tmp)
            tmp.close()

            file_size = os.path.getsize(tmp_path)
            logger.info(
                f"[TRANSCRIBE] job={job.id} download complete: "
                f"{tmp_path} ({file_size} bytes)"
            )

            try:
                import av
                _probe = av.open(tmp_path)
                try:
                    _fmt = getattr(_probe.format, "name", "?")
                    _streams = _probe.streams.audio
                    if _streams:
                        _s = _streams[0]
                        _codec_ctx = getattr(_s, "codec_context", None)
                        _codec = getattr(_codec_ctx, "name", "?") if _codec_ctx else "?"
                        _sr = getattr(_s, "sample_rate", "?")
                        _ch = getattr(_s, "channels", "?")
                        _dur = getattr(_probe, "duration", None)
                        _dur_s = (_dur / 1_000_000.0) if _dur else None
                        logger.info(
                            f"[TRANSCRIBE] job={job.id} probe: "
                            f"container={_fmt} codec={_codec} "
                            f"sr={_sr} ch={_ch} "
                            f"duration={round(_dur_s, 1) if _dur_s else '?'}s "
                            f"file_ext={ext}"
                        )
                    else:
                        logger.warning(
                            f"[TRANSCRIBE] job={job.id} probe: "
                            f"container={_fmt} NO audio streams"
                        )
                finally:
                    _probe.close()
            except Exception as _probe_err:
                logger.warning(
                    f"[TRANSCRIBE] job={job.id} probe failed: {_probe_err} "
                    f"(continuing — streaming decode will surface the real error)"
                )

            logger.info(f"[TRANSCRIBE] job={job.id} importing faster_whisper...")
            try:
                from faster_whisper import WhisperModel
                logger.info(f"[TRANSCRIBE] job={job.id} faster_whisper imported OK")
            except ImportError as e:
                logger.error(
                    f"[TRANSCRIBE] job={job.id} FAILED to import faster_whisper: {e}"
                )
                raise

            model_size = os.environ.get("MIKRO_WHISPER_MODEL", "base.en")
            cpu_threads = int(os.environ.get("MIKRO_WHISPER_THREADS", "4"))
            beam_size = int(os.environ.get("MIKRO_WHISPER_BEAM_SIZE", "1"))
            logger.info(
                f"[TRANSCRIBE] job={job.id} model config: "
                f"size={model_size} threads={cpu_threads}"
            )

            if not hasattr(run_transcription_job, "_model"):
                logger.info(
                    f"[TRANSCRIBE] job={job.id} loading Whisper model "
                    f"(first time, this may take a while)..."
                )
                run_transcription_job._model = WhisperModel(
                    model_size,
                    device="cpu",
                    compute_type="int8",
                    cpu_threads=cpu_threads,
                )
                logger.info(f"[TRANSCRIBE] job={job.id} Whisper model loaded OK")
            else:
                logger.info(f"[TRANSCRIBE] job={job.id} using cached Whisper model")

            model = run_transcription_job._model

            segments = []
            if job.segments:
                try:
                    parsed = json.loads(job.segments)
                    if isinstance(parsed, list):
                        segments = [s for s in parsed if isinstance(s, dict)]
                except (json.JSONDecodeError, TypeError):
                    segments = []

            resume_from_seconds = 0.0
            if segments:
                last_end = segments[-1].get("timeEnd", 0) or 0
                resume_from_seconds = float(last_end)
                logger.info(
                    f"[TRANSCRIBE] job={job.id} RESUMING: "
                    f"{len(segments)} segments already captured, "
                    f"continuing from {round(resume_from_seconds, 1)}s"
                )

            total_seconds = get_audio_duration_seconds(tmp_path)
            logger.info(
                f"[TRANSCRIBE] job={job.id} audio total duration: "
                f"{round(total_seconds, 1)}s "
                f"(remaining after resume: "
                f"{round(max(0, total_seconds - resume_from_seconds), 1)}s)"
            )

            chunk_minutes = int(os.environ.get("MIKRO_TRANSCRIBE_CHUNK_MINUTES", "5"))
            chunk_seconds = chunk_minutes * 60
            logger.info(
                f"[TRANSCRIBE] job={job.id} streaming "
                f"{chunk_minutes}-min chunks "
                f"(vad_filter=False, beam_size={beam_size})"
            )

            cancelled = False
            chunk_idx = 0

            for chunk_offset, chunk_audio in stream_audio_chunks(
                tmp_path,
                chunk_seconds=chunk_seconds,
                sampling_rate=16000,
                skip_seconds=resume_from_seconds,
            ):
                chunk_idx += 1

                db.session.refresh(job)
                if job.status != "transcribing":
                    logger.info(
                        f"[TRANSCRIBE] job={job.id} status changed to "
                        f"'{job.status}' before chunk {chunk_idx} — bailing"
                    )
                    cancelled = True
                    break

                chunk_len_sec = float(len(chunk_audio)) / 16000.0
                chunk_start_time = datetime.now(timezone.utc)
                logger.info(
                    f"[TRANSCRIBE] job={job.id} chunk {chunk_idx} starting "
                    f"(offset {round(chunk_offset, 1)}s, length "
                    f"{round(chunk_len_sec, 1)}s)"
                )

                seg_iter, _info = model.transcribe(
                    chunk_audio,
                    language="en",
                    beam_size=beam_size,
                    vad_filter=False,
                )

                chunk_segment_count = 0
                for seg in seg_iter:
                    if chunk_segment_count % 10 == 0:
                        db.session.refresh(job)
                        if job.status != "transcribing":
                            logger.info(
                                f"[TRANSCRIBE] job={job.id} status changed to "
                                f"'{job.status}' mid-chunk — bailing out"
                            )
                            cancelled = True
                            break
                    segments.append({
                        "timeStart": round(seg.start + chunk_offset, 2),
                        "timeEnd": round(seg.end + chunk_offset, 2),
                        "text": seg.text.strip(),
                    })
                    chunk_segment_count += 1
                    job.progress = len(segments)
                    job.segments = json.dumps(segments)
                    db.session.commit()

                if cancelled:
                    break

                chunk_elapsed = (
                    datetime.now(timezone.utc) - chunk_start_time
                ).total_seconds()
                logger.info(
                    f"[TRANSCRIBE] job={job.id} chunk {chunk_idx} done: "
                    f"{chunk_segment_count} segments in "
                    f"{round(chunk_elapsed, 1)}s "
                    f"(running total: {len(segments)} segments)"
                )

            if cancelled:
                return

            full_text = " ".join(s["text"] for s in segments)

            job.status = "done"
            job.segments = json.dumps(segments)
            job.text = full_text
            job.duration = round(total_seconds, 1)
            job.progress = len(segments)
            job.completed_at = datetime.now(timezone.utc)
            job.error = None
            db.session.commit()

            logger.info(
                f"[TRANSCRIBE] job={job.id} COMPLETED: "
                f"{len(segments)} segments from {chunk_idx} chunks, "
                f"{round(total_seconds, 1)}s audio, "
                f"text length={len(full_text)} chars"
            )

            try:
                s3.delete_object(Bucket=bucket, Key=spaces_key)
                logger.info(f"[TRANSCRIBE] job={job.id} deleted {spaces_key} from Spaces")
            except Exception as e:
                logger.warning(
                    f"[TRANSCRIBE] job={job.id} failed to delete "
                    f"{spaces_key} from Spaces: {e}"
                )

        finally:
            try:
                os.unlink(tmp_path)
                logger.info(f"[TRANSCRIBE] job={job.id} cleaned up temp file {tmp_path}")
            except OSError:
                pass

    except Exception as e:
        logger.error(
            f"[TRANSCRIBE] job={job.id} FAILED: {e}\n"
            f"{traceback.format_exc()}"
        )
        db.session.rollback()
        try:
            job.status = "error"
            job.error = str(e)[:2000]
            job.completed_at = datetime.now(timezone.utc)
            db.session.commit()
            logger.info(f"[TRANSCRIBE] job={job.id} status set to 'error'")
        except Exception as e2:
            logger.error(
                f"[TRANSCRIBE] job={job.id} failed to update error status: {e2}"
            )
            db.session.rollback()
