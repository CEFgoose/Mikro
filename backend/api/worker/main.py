import logging
import os
import signal
import sys
import threading
import time
import traceback
from datetime import datetime, timezone, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Mirror worker logs to a file operators can tail from inside the pod.
# File is recreated on each process start.
try:
    _worker_fh = logging.FileHandler("/tmp/worker.log", mode="w")
    _worker_fh.setFormatter(
        logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    )
    logger.addHandler(_worker_fh)
    logging.getLogger().addHandler(_worker_fh)
except Exception as _e:
    print(f"[worker] could not attach /tmp/worker.log handler: {_e}", file=sys.stderr)

from .jobs.sync import run_sync_job
from .jobs.project_sync import run_project_sync_job
from .jobs.element_analysis import run_element_analysis_job
from .jobs.mr_backfill import run_mr_metadata_backfill
from .jobs.transcription import (
    run_transcription_job,
    abandon_orphan_transcriptions,
    preload_whisper_model,
)


def poll_for_jobs(app):
    """Check for queued sync jobs and process them."""
    with app.app_context():
        from ..database import db, SyncJob

        try:
            job = (
                SyncJob.query.filter_by(status="queued")
                .order_by(SyncJob.id.asc())
                .first()
            )

            if job:
                running = SyncJob.query.filter_by(
                    org_id=job.org_id, status="running"
                ).first()
                if running:
                    if running.started_at:
                        age = datetime.now(timezone.utc) - running.started_at.replace(
                            tzinfo=timezone.utc
                        )
                        if age > timedelta(minutes=15):
                            logger.warning(
                                f"Marking stale job {running.id} as failed "
                                f"(running for {age})"
                            )
                            running.status = "failed"
                            running.error = "Timed out (stale after 15 minutes)"
                            running.completed_at = datetime.now(timezone.utc)
                            db.session.commit()
                            # Fall through to process the queued job
                        else:
                            logger.info(
                                f"Skipping job {job.id} — job {running.id} already "
                                f"running for org {job.org_id}"
                            )
                            return
                    else:
                        logger.info(
                            f"Skipping job {job.id} — job {running.id} already "
                            f"running for org {job.org_id}"
                        )
                        return

                logger.info(
                    f"Processing job {job.id} (type={job.job_type}) "
                    f"for org {job.org_id}"
                )
                if job.job_type == "element_analysis":
                    run_element_analysis_job(app, job)
                elif job.job_type == "project_sync":
                    run_project_sync_job(app, job)
                elif job.job_type == "mr_metadata_backfill":
                    run_mr_metadata_backfill(app, job)
                else:
                    run_sync_job(app, job)

        except Exception as e:
            logger.error(f"Error polling for jobs: {e}")
            db.session.rollback()


def poll_for_transcription_jobs(app):
    """Check for queued transcription jobs and process them."""
    with app.app_context():
        from ..database import db, TranscriptionJob

        try:
            running = TranscriptionJob.query.filter_by(status="transcribing").first()
            if running:
                if running.started_at:
                    age = datetime.now(timezone.utc) - running.started_at.replace(
                        tzinfo=timezone.utc
                    )
                    progress = running.progress or 0
                    # 60 min covers worst-case cold-start: model download +
                    # audio download + first-segment latency.
                    stuck_limit = timedelta(minutes=60)
                    progressing_limit = timedelta(hours=6)
                    is_stale = (
                        (progress == 0 and age > stuck_limit)
                        or age > progressing_limit
                    )
                    if is_stale:
                        reason = (
                            f"Stuck at progress=0 after {stuck_limit}"
                            if progress == 0
                            else f"Exceeded {progressing_limit} wall time"
                        )
                        logger.warning(
                            f"[TRANSCRIBE-POLL] Marking stale job {running.id} as failed "
                            f"(running for {age}, progress={progress}) — {reason}"
                        )
                        running.status = "error"
                        running.error = f"Timed out ({reason})"
                        running.completed_at = datetime.now(timezone.utc)
                        db.session.commit()
                    else:
                        return
                else:
                    logger.warning(
                        f"[TRANSCRIBE-POLL] Job {running.id} has status=transcribing "
                        f"but no started_at timestamp"
                    )
                    return

            job = (
                TranscriptionJob.query.filter_by(status="queued")
                .order_by(TranscriptionJob.created_at.asc())
                .first()
            )

            if job:
                logger.info(
                    f"[TRANSCRIBE-POLL] Found queued job {job.id} "
                    f"({job.file_name}), starting processing..."
                )
                run_transcription_job(app, job)

        except Exception as e:
            logger.error(
                f"[TRANSCRIBE-POLL] Error polling: {e}\n"
                f"{traceback.format_exc()}"
            )
            db.session.rollback()


def main():
    """
    Main entry point for the worker process.

    Creates a Flask app and polls for sync and transcription jobs every 5
    seconds. Transcription runs in its own thread so long audio jobs don't
    block task syncs.
    """
    logger.info("=" * 60)
    logger.info("MIKRO BACKGROUND WORKER STARTING")
    logger.info("Handles task sync, element analysis, and transcription")
    logger.info("NOT bound by Gunicorn timeout")
    logger.info("=" * 60)

    from app import create_app

    app = create_app()

    # Crash-detection marker. On clean shutdown we write this file; on startup
    # we check for it. Missing = previous lifetime ended ungracefully.
    _shutdown_marker = "/tmp/mikro_worker_clean_shutdown"
    if os.path.exists(_shutdown_marker):
        logger.info(
            "[LIFECYCLE] Previous worker exited cleanly (shutdown marker "
            "present). Removing marker for this lifetime."
        )
        try:
            os.remove(_shutdown_marker)
        except OSError:
            pass
    else:
        logger.warning(
            "[LIFECYCLE] No clean-shutdown marker found — previous worker "
            "lifetime ended UNGRACEFULLY (OOM, crash, or platform restart). "
            "Any orphan transcriptions requeued below are a consequence of "
            "that ungraceful exit, not a code push."
        )

    running = True

    def shutdown_handler(signum, frame):
        nonlocal running
        logger.info(
            f"[LIFECYCLE] Shutdown signal {signum} received — "
            f"worker exiting cleanly"
        )
        try:
            with open(_shutdown_marker, "w") as f:
                f.write(str(signum))
        except OSError as e:
            logger.warning(f"[LIFECYCLE] Could not write shutdown marker: {e}")
        running = False

    signal.signal(signal.SIGTERM, shutdown_handler)
    signal.signal(signal.SIGINT, shutdown_handler)

    logger.info("Worker running — polling for sync jobs every 5 seconds")
    logger.info("Nightly task sync + element analysis scheduled at midnight MST (07:00 UTC)")

    abandon_orphan_transcriptions(app)

    preload_thread = threading.Thread(target=preload_whisper_model, daemon=True)
    preload_thread.start()

    def transcription_loop():
        logger.info("[TRANSCRIBE-THREAD] Transcription polling thread started")
        poll_count = 0
        while running:
            time.sleep(5)
            try:
                poll_for_transcription_jobs(app)
                poll_count += 1
                if poll_count % 60 == 0:
                    logger.info(f"[TRANSCRIBE-THREAD] heartbeat — {poll_count} polls completed")
            except Exception as e:
                logger.error(f"[TRANSCRIBE-THREAD] uncaught error: {e}\n{traceback.format_exc()}")
        logger.info("[TRANSCRIBE-THREAD] Transcription polling thread stopped")

    transcription_thread = threading.Thread(target=transcription_loop, daemon=True)
    transcription_thread.start()

    heartbeat_counter = 0
    last_nightly_date = None

    while running:
        time.sleep(5)
        poll_for_jobs(app)

        # Nightly element analysis auto-scheduling (midnight MST = 07:00 UTC)
        now_utc = datetime.now(timezone.utc)
        mst_hour = (now_utc.hour - 7) % 24
        today_date = now_utc.date()

        if mst_hour == 0 and now_utc.minute < 5 and last_nightly_date != today_date:
            last_nightly_date = today_date
            try:
                with app.app_context():
                    from ..database import db, SyncJob, User

                    orgs = (
                        db.session.query(User.org_id)
                        .filter(User.org_id != None)
                        .distinct()
                        .all()
                    )
                    for (org_id,) in orgs:
                        existing_sync = SyncJob.query.filter(
                            SyncJob.org_id == org_id,
                            SyncJob.job_type == "task_sync",
                            SyncJob.status.in_(["queued", "running"]),
                        ).first()
                        if not existing_sync:
                            db.session.add(SyncJob(
                                org_id=org_id,
                                status="queued",
                                job_type="task_sync",
                            ))
                            logger.info(f"Auto-scheduled nightly task sync for org {org_id}")

                        existing_ea = SyncJob.query.filter(
                            SyncJob.org_id == org_id,
                            SyncJob.job_type == "element_analysis",
                            SyncJob.status.in_(["queued", "running"]),
                        ).first()
                        if not existing_ea:
                            db.session.add(SyncJob(
                                org_id=org_id,
                                status="queued",
                                job_type="element_analysis",
                            ))
                            logger.info(f"Auto-scheduled nightly element analysis for org {org_id}")

                    db.session.commit()
            except Exception as e:
                logger.error(f"Failed to auto-schedule nightly jobs: {e}")

        heartbeat_counter += 1
        if heartbeat_counter >= 120:
            heartbeat_counter = 0
            logger.info("Worker heartbeat — still running")

    logger.info("Worker process stopped")
