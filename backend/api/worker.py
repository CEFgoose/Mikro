"""
Background Worker Process for Task Sync & Element Analysis

This module runs as a separate worker process, independent of the web process.
It handles task synchronization with TM4 and element type analysis from OSM
changesets, which can take minutes to complete due to hundreds of sequential
API calls.

The worker process is NOT bound by Gunicorn's timeout, so syncs can run
as long as needed without being killed.

Usage:
    python -m api.worker

Procfile:
    worker: python -m api.worker
"""

import logging
import signal
import sys
import time
import traceback
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone, timedelta, date

import requests as http_requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Also mirror worker logs to a file that operators can tail from inside the
# pod (`tail -f /tmp/worker.log`). File is recreated on each process start.
try:
    _worker_fh = logging.FileHandler("/tmp/worker.log", mode="w")
    _worker_fh.setFormatter(
        logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    )
    logger.addHandler(_worker_fh)
    # Also attach to root so logs from `api.*` dependencies go to the file.
    logging.getLogger().addHandler(_worker_fh)
except Exception as _e:
    # Don't fail worker startup if /tmp isn't writable for some reason.
    print(f"[worker] could not attach /tmp/worker.log handler: {_e}", file=sys.stderr)


def run_sync_job(app, job):
    """
    Execute a queued sync job.

    Runs the same sync logic as admin_update_all_user_tasks but in a
    separate process not bound by gunicorn timeout.

    Called from poll_for_jobs which already holds the app context —
    do NOT create a nested app context here (it causes session teardown
    to kill the session and lose status updates).

    Args:
        app: Flask application instance
        job: SyncJob model instance
    """
    from .database import db, SyncJob, User, Project, ProjectUser
    from .views.Tasks import TaskAPI
    from .views.MapRoulette import MapRouletteSync

    task_api = TaskAPI()

    try:
        # Mark job as running
        job.status = "running"
        job.started_at = datetime.now(timezone.utc)
        job.progress = "Starting sync..."
        db.session.commit()

        org_id = job.org_id
        org_users = User.query.filter_by(org_id=org_id).all()

        # Get all visible projects in org
        all_visible_projects = Project.query.filter(
            Project.org_id == org_id,
            Project.status == True,
            Project.visibility == True,
        ).all()
        visible_project_ids = [p.id for p in all_visible_projects]

        total_users = len(org_users)
        for i, user in enumerate(org_users, 1):
            # Update progress
            job.progress = f"Syncing user {i}/{total_users}: {user.osm_username or user.email or user.id}"
            db.session.commit()

            # Get user's assigned projects
            assigned_project_ids = [
                relation.project_id
                for relation in ProjectUser.query.filter_by(
                    user_id=user.id
                ).all()
            ]

            # Combine assigned + visible
            all_project_ids = list(
                set(assigned_project_ids + visible_project_ids)
            )

            user_projects = Project.query.filter(
                Project.org_id == user.org_id,
                Project.status == True,
                Project.id.in_(all_project_ids),
            ).all()

            for j, project in enumerate(user_projects, 1):
                job.progress = f"User {i}/{total_users} - Project {project.id} ({j}/{len(user_projects)})"
                db.session.commit()
                if project.source == "mr":
                    MapRouletteSync().sync_challenge_tasks(project, user)
                else:
                    task_api.TM4_payment_call(project.id, user)

        # Mark completed
        job.status = "completed"
        job.completed_at = datetime.now(timezone.utc)
        job.progress = f"Completed: synced {total_users} users"
        db.session.commit()

        logger.info(
            f"Sync job {job.id} completed for org {org_id} "
            f"({total_users} users)"
        )

    except Exception as e:
        logger.error(f"Sync job {job.id} failed: {e}")
        db.session.rollback()
        try:
            job.status = "failed"
            job.error = str(e)[:2000]
            job.completed_at = datetime.now(timezone.utc)
            db.session.commit()
        except Exception:
            logger.error(f"Failed to update job {job.id} error status")
            db.session.rollback()


def run_project_sync_job(app, job):
    """
    Execute a project-scoped sync job.

    Syncs a single project for all assigned users (plus all org users
    if the project is visible). Runs in the background worker to avoid
    gunicorn timeout.
    """
    from .database import db, SyncJob, User, Project, ProjectUser
    from .views.Tasks import TaskAPI
    from .views.MapRoulette import MapRouletteSync

    task_api = TaskAPI()

    try:
        # Read target user BEFORE overwriting progress
        target_user_id = None
        if job.progress and job.progress.startswith("user:"):
            target_user_id = job.progress.split(":", 1)[1]

        job.status = "running"
        job.started_at = datetime.now(timezone.utc)
        job.progress = "Starting project sync..."
        db.session.commit()

        project = Project.query.filter_by(id=job.target_id).first()
        if not project:
            job.status = "failed"
            job.error = f"Project {job.target_id} not found"
            job.completed_at = datetime.now(timezone.utc)
            db.session.commit()
            return

        # If this job targets a specific user, sync only that user
        if target_user_id:
            target_user = User.query.get(target_user_id)
            users = [target_user] if target_user else []
        else:
            # Full project sync — assigned users (direct + team) + contributors
            from .database import ProjectTeam, TeamUser, Task

            # Direct assignments
            direct_ids = set(
                pu.user_id
                for pu in ProjectUser.query.filter_by(project_id=project.id).all()
            )

            # Team-based assignments
            team_ids = [
                pt.team_id
                for pt in ProjectTeam.query.filter_by(project_id=project.id).all()
            ]
            team_user_ids = set()
            if team_ids:
                team_user_ids = set(
                    tu.user_id
                    for tu in TeamUser.query.filter(TeamUser.team_id.in_(team_ids)).all()
                )

            # Contributors — users who have tasks on this project
            contributor_osm_names = set()
            for row in db.session.query(Task.mapped_by).filter(
                Task.project_id == project.id, Task.mapped_by != None
            ).distinct().all():
                if row[0]:
                    contributor_osm_names.add(row[0])
            for row in db.session.query(Task.validated_by).filter(
                Task.project_id == project.id, Task.validated_by != None
            ).distinct().all():
                if row[0]:
                    contributor_osm_names.add(row[0])

            contributor_user_ids = set()
            if contributor_osm_names:
                contributor_user_ids = set(
                    u.id for u in User.query.filter(
                        User.osm_username.in_(contributor_osm_names),
                        User.org_id == job.org_id,
                    ).all()
                )

            all_user_ids = direct_ids | team_user_ids | contributor_user_ids
            users = User.query.filter(User.id.in_(all_user_ids)).all() if all_user_ids else []

        total_users = len(users)
        synced = 0

        for i, user in enumerate(users, 1):
            job.progress = f"Syncing {project.name}: user {i}/{total_users}"
            db.session.commit()
            try:
                if project.source == "mr":
                    MapRouletteSync().sync_challenge_tasks(project, user)
                else:
                    task_api.TM4_payment_call(project.id, user)
                synced += 1
            except Exception as e:
                logger.error(
                    f"Project sync error - project {project.id}, user {user.id}: {e}"
                )

        job.status = "completed"
        job.completed_at = datetime.now(timezone.utc)
        job.progress = f"Completed: {project.name} synced for {synced} users"
        db.session.commit()

        logger.info(f"Project sync job {job.id} completed: {project.name} ({synced} users)")

    except Exception as e:
        logger.error(f"Project sync job {job.id} failed: {e}")
        db.session.rollback()
        try:
            job.status = "failed"
            job.error = str(e)[:2000]
            job.completed_at = datetime.now(timezone.utc)
            db.session.commit()
        except Exception:
            logger.error(f"Failed to update job {job.id} error status")
            db.session.rollback()


def _classify_element(element):
    """Classify an OSM element into categories based on its tags.

    Returns a set of category names the element belongs to.
    """
    tags = {}
    for tag_el in element.findall("tag"):
        tags[tag_el.get("k", "")] = tag_el.get("v", "")

    categories = set()

    if "oneway" in tags:
        categories.add("Oneways")

    if "access" in tags or "barrier" in tags:
        categories.add("Access & Barriers")

    highway_val = tags.get("highway", "")
    if highway_val:
        categories.add("Highways")

    if "ref" in tags:
        categories.add("Refs")

    # Turn restrictions: relations with type=restriction
    if element.tag == "relation" and tags.get("type", "").startswith("restriction"):
        categories.add("Turn Restrictions")

    if "name" in tags:
        categories.add("Names")

    if "construction" in tags or highway_val == "construction":
        categories.add("Construction")

    road_hierarchy = {
        "primary", "secondary", "tertiary", "residential",
        "trunk", "motorway", "unclassified",
        "primary_link", "secondary_link", "tertiary_link",
        "trunk_link", "motorway_link",
    }
    if highway_val in road_hierarchy:
        categories.add("Classifications")

    return categories


def _get_week_start(dt):
    """Get the Monday of the week for a given date."""
    if isinstance(dt, datetime):
        dt = dt.date()
    days_since_monday = dt.weekday()
    return dt - timedelta(days=days_since_monday)


def run_element_analysis_job(app, job):
    """
    Execute an element analysis job.

    Fetches OsmChange XML for all org mappers' changesets, classifies elements
    by OSM tags, and caches weekly aggregates by category.
    """
    from .database import db, SyncJob, User, Task, ElementAnalysisCache

    try:
        job.status = "running"
        job.started_at = datetime.now(timezone.utc)
        job.progress = "Starting element analysis..."
        db.session.commit()

        org_id = job.org_id

        # Get last 4 weeks of boundaries
        today = date.today()
        week_start = _get_week_start(today)
        analysis_start = week_start - timedelta(weeks=3)  # 4 weeks total
        start_str = analysis_start.isoformat()
        end_str = today.isoformat()

        # Get OSM usernames of mappers active in this period
        active_mappers = (
            db.session.query(Task.mapped_by)
            .filter(
                Task.org_id == org_id,
                Task.mapped == True,
                Task.date_mapped >= datetime.combine(analysis_start, datetime.min.time()),
                Task.mapped_by != None,
            )
            .distinct()
            .all()
        )
        osm_usernames = [row[0] for row in active_mappers if row[0]]

        if not osm_usernames:
            job.status = "completed"
            job.completed_at = datetime.now(timezone.utc)
            job.progress = "No active mappers found"
            db.session.commit()
            logger.info(f"Element analysis job {job.id}: no active mappers")
            return

        total_users = len(osm_usernames)
        job.progress = f"Fetching changesets for {total_users} mappers..."
        db.session.commit()

        # Step 1: Fetch changeset lists for all users concurrently
        all_changeset_ids = {}  # {changeset_id: (username, created_at)}

        def _fetch_user_changesets(username):
            osm_url = "https://api.openstreetmap.org/api/0.6/changesets"
            params = {
                "display_name": username,
                "time": f"{start_str},{end_str}",
                "closed": "true",
            }
            try:
                resp = http_requests.get(osm_url, params=params, timeout=30)
                if not resp.ok:
                    return username, []
            except http_requests.RequestException:
                return username, []

            try:
                root = ET.fromstring(resp.text)
            except ET.ParseError:
                return username, []

            changesets = []
            for cs in root.findall("changeset"):
                cs_id = cs.get("id")
                created = cs.get("created_at", "")
                if cs_id:
                    changesets.append((cs_id, created))
            return username, changesets

        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {
                executor.submit(_fetch_user_changesets, un): un
                for un in osm_usernames
            }
            for i, future in enumerate(as_completed(futures), 1):
                username, changesets = future.result()
                for cs_id, created in changesets:
                    all_changeset_ids[cs_id] = (username, created)
                job.progress = f"Fetched changeset lists: {i}/{total_users} users"
                db.session.commit()

        total_changesets = len(all_changeset_ids)
        if total_changesets == 0:
            job.status = "completed"
            job.completed_at = datetime.now(timezone.utc)
            job.progress = "No changesets found in period"
            db.session.commit()
            logger.info(f"Element analysis job {job.id}: no changesets found")
            return

        job.progress = f"Analyzing {total_changesets} changesets..."
        db.session.commit()

        # Step 2: Fetch OsmChange XML for each changeset and classify
        # Accumulate: {(week_date, category): {added: N, modified: N, deleted: N}}
        category_counts = {}

        def _analyze_changeset(cs_id, created_at_str):
            """Fetch OsmChange XML and classify elements."""
            url = f"https://api.openstreetmap.org/api/0.6/changeset/{cs_id}/download"
            try:
                resp = http_requests.get(url, timeout=30)
                if not resp.ok:
                    return cs_id, created_at_str, {}
            except http_requests.RequestException:
                return cs_id, created_at_str, {}

            try:
                root = ET.fromstring(resp.text)
            except ET.ParseError:
                return cs_id, created_at_str, {}

            local_counts = {}  # {category: {added: N, modified: N, deleted: N}}
            action_map = {"create": "added", "modify": "modified", "delete": "deleted"}

            for action_tag, action_key in action_map.items():
                action_el = root.find(action_tag)
                if action_el is None:
                    continue
                for element in action_el:
                    if element.tag not in ("node", "way", "relation"):
                        continue
                    cats = _classify_element(element)
                    for cat in cats:
                        if cat not in local_counts:
                            local_counts[cat] = {"added": 0, "modified": 0, "deleted": 0}
                        local_counts[cat][action_key] += 1

            return cs_id, created_at_str, local_counts

        cs_items = list(all_changeset_ids.items())
        processed = 0

        # Process in batches of 20 to avoid overwhelming the OSM API
        batch_size = 20
        for batch_start in range(0, len(cs_items), batch_size):
            batch = cs_items[batch_start:batch_start + batch_size]

            with ThreadPoolExecutor(max_workers=5) as executor:
                futures = {
                    executor.submit(_analyze_changeset, cs_id, info[1]): cs_id
                    for cs_id, info in batch
                }
                for future in as_completed(futures):
                    cs_id, created_at_str, local_counts = future.result()
                    processed += 1

                    # Determine week for this changeset
                    try:
                        cs_date = datetime.fromisoformat(
                            created_at_str.replace("Z", "+00:00")
                        ).date()
                    except (ValueError, AttributeError):
                        cs_date = today
                    week = _get_week_start(cs_date)

                    for cat, counts in local_counts.items():
                        key = (week, cat)
                        if key not in category_counts:
                            category_counts[key] = {"added": 0, "modified": 0, "deleted": 0}
                        category_counts[key]["added"] += counts["added"]
                        category_counts[key]["modified"] += counts["modified"]
                        category_counts[key]["deleted"] += counts["deleted"]

                    if processed % 10 == 0 or processed == total_changesets:
                        job.progress = f"Analyzed {processed}/{total_changesets} changesets"
                        db.session.commit()

            # Small delay between batches to be polite to OSM API
            time.sleep(0.5)

        # Step 3: Clear old cache for this org and write new rows
        job.progress = "Writing cache..."
        db.session.commit()

        ElementAnalysisCache.query.filter_by(org_id=org_id).delete()

        now = datetime.now(timezone.utc)
        for (week, category), counts in category_counts.items():
            cache_row = ElementAnalysisCache(
                org_id=org_id,
                week=week,
                category=category,
                added=counts["added"],
                modified=counts["modified"],
                deleted=counts["deleted"],
                updated_at=now,
            )
            db.session.add(cache_row)

        db.session.commit()

        job.status = "completed"
        job.completed_at = datetime.now(timezone.utc)
        job.progress = (
            f"Done: {total_changesets} changesets, "
            f"{len(category_counts)} category/week combos cached"
        )
        db.session.commit()

        logger.info(
            f"Element analysis job {job.id} completed for org {org_id} "
            f"({total_changesets} changesets analyzed)"
        )

    except Exception as e:
        logger.error(f"Element analysis job {job.id} failed: {e}")
        db.session.rollback()
        try:
            job.status = "failed"
            job.error = str(e)[:2000]
            job.completed_at = datetime.now(timezone.utc)
            db.session.commit()
        except Exception:
            logger.error(f"Failed to update job {job.id} error status")
            db.session.rollback()


def run_mr_metadata_backfill(app, job):
    """
    Backfill MapRoulette challenge metadata (name + task count) for a project
    that was created while the MR API was unavailable.

    Retries up to 3 times with increasing delays (10s, 30s, 60s).
    """
    from .database import db, SyncJob, Project
    from .views.MapRoulette import MapRouletteSync

    challenge_id = job.target_id
    max_retries = 3
    delays = [10, 30, 60]

    try:
        job.status = "running"
        job.started_at = datetime.now(timezone.utc)
        job.progress = f"Fetching metadata for MR challenge {challenge_id}..."
        db.session.commit()

        project = Project.query.filter_by(id=challenge_id).first()
        if not project:
            job.status = "failed"
            job.error = f"Project {challenge_id} not found"
            job.completed_at = datetime.now(timezone.utc)
            db.session.commit()
            return

        mr_data = None
        for attempt in range(max_retries):
            try:
                job.progress = f"Attempt {attempt + 1}/{max_retries} for challenge {challenge_id}"
                db.session.commit()
                mr_data = MapRouletteSync().fetch_challenge_metadata(challenge_id)
                if mr_data:
                    break
            except Exception as e:
                logger.warning(
                    f"MR metadata backfill attempt {attempt + 1} failed for "
                    f"{challenge_id}: {e}"
                )

            if attempt < max_retries - 1:
                time.sleep(delays[attempt])

        if not mr_data:
            job.status = "failed"
            job.error = (
                f"Could not fetch MR metadata for challenge {challenge_id} "
                f"after {max_retries} attempts"
            )
            job.completed_at = datetime.now(timezone.utc)
            db.session.commit()
            logger.error(f"MR metadata backfill failed for {challenge_id}")
            return

        # Update project with real metadata
        old_name = project.name
        project.name = mr_data.get("name", project.name)

        # Count ALL tasks by paginating the challenge tasks endpoint
        try:
            mr_sync = MapRouletteSync()
            mr_base = mr_sync._get_mr_base_url()
            mr_headers = mr_sync._get_mr_headers()
            total_count = 0
            count_page = 0
            while True:
                count_url = f"{mr_base}/challenge/{challenge_id}/tasks?limit=200&page={count_page}"
                count_resp = http_requests.get(count_url, headers=mr_headers, timeout=30)
                if not count_resp.ok:
                    break
                page_tasks = count_resp.json()
                if not isinstance(page_tasks, list) or len(page_tasks) == 0:
                    break
                total_count += len(page_tasks)
                if len(page_tasks) < 200:
                    break
                count_page += 1
            if total_count > 0:
                project.total_tasks = total_count
        except Exception as e:
            logger.warning(f"Could not count MR tasks for {challenge_id}: {e}")

        # Recalculate budget with real task count
        if project.total_tasks > 0:
            project.max_payment = (
                project.mapping_rate_per_task + project.validation_rate_per_task
            ) * project.total_tasks

        db.session.commit()

        job.status = "completed"
        job.completed_at = datetime.now(timezone.utc)
        job.progress = (
            f"Updated: '{old_name}' → '{project.name}' "
            f"({project.total_tasks} tasks)"
        )
        db.session.commit()

        logger.info(
            f"MR metadata backfill completed for {challenge_id}: "
            f"{project.name} ({project.total_tasks} tasks)"
        )

    except Exception as e:
        logger.error(f"MR metadata backfill job {job.id} failed: {e}")
        db.session.rollback()
        try:
            job.status = "failed"
            job.error = str(e)[:2000]
            job.completed_at = datetime.now(timezone.utc)
            db.session.commit()
        except Exception:
            logger.error(f"Failed to update job {job.id} error status")
            db.session.rollback()


def run_transcription_job(app, job):
    """
    Execute a transcription job.

    Downloads audio from DO Spaces, transcribes with faster-whisper,
    stores results in the TranscriptionJob row, then cleans up the
    audio file from Spaces.
    """
    import json
    import os
    import tempfile

    from .database import db, TranscriptionJob

    logger.info(
        f"[TRANSCRIBE] === START job={job.id} file={job.file_name} "
        f"url={job.file_url} status={job.status} ==="
    )

    try:
        job.status = "transcribing"
        job.started_at = datetime.now(timezone.utc)
        db.session.commit()
        logger.info(f"[TRANSCRIBE] job={job.id} status set to 'transcribing'")

        # Parse Spaces key from URL
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
            # silent connection stall to Spaces would hang the worker forever
            # (every one of our jobs died this way before we added these).
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

            # Load Whisper model
            logger.info(f"[TRANSCRIBE] job={job.id} importing faster_whisper...")
            try:
                from faster_whisper import WhisperModel
                logger.info(f"[TRANSCRIBE] job={job.id} faster_whisper imported OK")
            except ImportError as e:
                logger.error(
                    f"[TRANSCRIBE] job={job.id} FAILED to import faster_whisper: {e}"
                )
                raise

            # Use the MIKRO_-prefixed names so a stale WHISPER_MODEL env var
            # on the pod (pinned to medium.en) can't override our fast default.
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

            # ────────────────────────────────────────────────────────
            # Streaming chunked transcription with auto-resume.
            #
            # Key properties:
            #   - Never holds the whole audio file in memory; pyav decodes
            #     one 5-min chunk at a time via stream_audio_chunks(). This
            #     is the fix for the OOM kills that lost in-flight jobs.
            #   - If the job row already has segments (because a previous
            #     worker got partway through and the process was restarted),
            #     we RESUME from the last segment's end-timestamp instead of
            #     starting over. Existing segments are preserved verbatim.
            #
            # Commit cadence remains per-segment so UI progress is live.
            # ────────────────────────────────────────────────────────

            # Pick up any segments already captured from a prior lifetime.
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

                # Cancellation check at chunk boundary
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
                return  # Caller's finally block handles temp file cleanup

            full_text = " ".join(s["text"] for s in segments)

            job.status = "done"
            job.segments = json.dumps(segments)
            job.text = full_text
            job.duration = round(total_seconds, 1)
            job.progress = len(segments)
            job.completed_at = datetime.now(timezone.utc)
            # Clear any leftover resume message from a previous lifetime
            job.error = None
            db.session.commit()

            logger.info(
                f"[TRANSCRIBE] job={job.id} COMPLETED: "
                f"{len(segments)} segments from {chunk_idx} chunks, "
                f"{round(total_seconds, 1)}s audio, "
                f"text length={len(full_text)} chars"
            )

            # Clean up audio file from Spaces
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


def abandon_orphan_transcriptions(app):
    """
    On worker startup, any TranscriptionJob in status='transcribing' is a
    zombie — the worker process that was running it is dead (restart,
    redeploy, OOM, etc.).

    Strategy:
      - progress > 0: REQUEUE the job. The Spaces audio file is still
        available (we only delete it on successful completion), the
        existing segments are stored in job.segments, so the worker's
        run_transcription_job() will notice the existing segments on
        pickup and RESUME from the timestamp of the last segment.
        No work is discarded, no user intervention needed.
      - progress == 0: mark as error (nothing useful to resume from).
        Frontend auto-drop cleans it out of the library.

    Unlike the previous version of this function, preserved jobs do NOT
    get promoted to 'done' — they go back to 'queued' so the worker
    will finish them. The user only sees 'done' when the transcription
    is actually complete end-to-end (possibly after several restarts).
    """
    import json
    with app.app_context():
        from .database import db, TranscriptionJob
        try:
            orphans = TranscriptionJob.query.filter_by(
                status="transcribing"
            ).all()
            if not orphans:
                return

            requeued = 0
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
                    # Requeue for auto-resume. Keep segments + progress
                    # intact; worker pickup will read them and continue
                    # from the last segment's timestamp.
                    job.status = "queued"
                    job.started_at = None
                    logger.warning(
                        f"[TRANSCRIBE-ORPHAN] Requeued job {job.id} for "
                        f"auto-resume ({progress} segments, "
                        f"{round(last_end, 1)}s covered) — worker restart "
                        f"interrupted, will pick up where it left off."
                    )
                    requeued += 1
                else:
                    job.status = "error"
                    job.error = (
                        "Worker restart interrupted transcription before any "
                        "segments were captured. Please re-upload."
                    )
                    job.completed_at = datetime.now(timezone.utc)
                    logger.warning(
                        f"[TRANSCRIBE-ORPHAN] Discarded job {job.id} "
                        f"(progress=0) — killed before first segment."
                    )
                    discarded += 1

            db.session.commit()
            logger.info(
                f"[TRANSCRIBE-ORPHAN] Processed {len(orphans)} orphan job(s): "
                f"{requeued} requeued for auto-resume, "
                f"{discarded} discarded (nothing captured)."
            )
        except Exception as e:
            logger.error(f"[TRANSCRIBE-ORPHAN] Failed to scan/abandon: {e}")
            db.session.rollback()


def preload_whisper_model():
    """
    Pre-load the Whisper model at worker startup so the first transcription
    job doesn't pay the HuggingFace download cost (~74MB for base.en on
    unauthenticated connections = can take minutes). Without this, the
    model load happens inside run_transcription_job and eats into the
    progress=0 stale-job timer.

    Runs once per worker process. Failure is logged but non-fatal — the
    first job will retry the download via the existing code path.
    """
    import os
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


def poll_for_transcription_jobs(app):
    """
    Check for queued transcription jobs and process them.
    Runs independently from sync job polling.
    """
    with app.app_context():
        from .database import db, TranscriptionJob

        try:
            # Check if already running a transcription (one at a time)
            running = TranscriptionJob.query.filter_by(status="transcribing").first()
            if running:
                if running.started_at:
                    age = datetime.now(timezone.utc) - running.started_at.replace(
                        tzinfo=timezone.utc
                    )
                    # Two-tier staleness:
                    #  - progress == 0 (no segments emitted yet): stuck before
                    #    transcribe() started streaming. 30 min is plenty.
                    #  - progress > 0 (actively emitting): genuinely slow run on
                    #    a long audio. Allow up to 6 hours of wall time.
                    progress = running.progress or 0
                    # 60 min covers worst-case cold-start: model download +
                    # audio download + first-segment latency. Worker now also
                    # pre-loads the model on startup, so this should rarely
                    # fire in practice — it's a fallback for truly stuck jobs.
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
                        # Job is still running, don't pick up another
                        return
                else:
                    # Running but no started_at — shouldn't happen, but skip
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
            # No else log — would spam every 5 seconds

        except Exception as e:
            logger.error(
                f"[TRANSCRIBE-POLL] Error polling: {e}\n"
                f"{traceback.format_exc()}"
            )
            db.session.rollback()


def poll_for_jobs(app):
    """
    Check for queued sync jobs and process them.

    Args:
        app: Flask application instance
    """
    with app.app_context():
        from .database import db, SyncJob

        try:
            job = (
                SyncJob.query.filter_by(status="queued")
                .order_by(SyncJob.id.asc())
                .first()
            )

            if job:
                # Check no other job is running for this org
                running = SyncJob.query.filter_by(
                    org_id=job.org_id, status="running"
                ).first()
                if running:
                    # If running job is stale (>15 min), mark it failed
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


def main():
    """
    Main entry point for the worker process.

    Creates a Flask app and polls for sync jobs every 5 seconds.
    """
    logger.info("=" * 60)
    logger.info("MIKRO BACKGROUND WORKER STARTING")
    logger.info("Handles task sync, element analysis, and transcription")
    logger.info("NOT bound by Gunicorn timeout")
    logger.info("=" * 60)

    from app import create_app

    app = create_app()

    # Graceful shutdown
    running = True

    def shutdown_handler(signum, frame):
        nonlocal running
        logger.info("Shutdown signal received — worker exiting")
        running = False

    signal.signal(signal.SIGTERM, shutdown_handler)
    signal.signal(signal.SIGINT, shutdown_handler)

    logger.info("Worker running — polling for sync jobs every 5 seconds")
    logger.info("Nightly task sync + element analysis scheduled at midnight MST (07:00 UTC)")

    # Any transcription in 'transcribing' status when we start was being
    # processed by the previous worker lifetime — there's no way to resume
    # it mid-chunk so mark it errored with a clear message. Runs before
    # the poll loop so users get an honest error instead of a silent hang.
    abandon_orphan_transcriptions(app)

    # Pre-load Whisper model so first transcription job doesn't wait on
    # the 74MB HuggingFace download. Runs in background so we don't block
    # the worker loop; sync jobs can run while the model downloads.
    import threading
    preload_thread = threading.Thread(target=preload_whisper_model, daemon=True)
    preload_thread.start()

    heartbeat_counter = 0
    last_nightly_date = None  # Track last auto-schedule date

    # Run transcription polling in its own thread so sync jobs don't block it

    def transcription_loop():
        logger.info("[TRANSCRIBE-THREAD] Transcription polling thread started")
        poll_count = 0
        while running:
            time.sleep(5)
            try:
                poll_for_transcription_jobs(app)
                poll_count += 1
                # Log every 60 polls (5 minutes) as a heartbeat
                if poll_count % 60 == 0:
                    logger.info(f"[TRANSCRIBE-THREAD] heartbeat — {poll_count} polls completed")
            except Exception as e:
                logger.error(f"[TRANSCRIBE-THREAD] uncaught error: {e}\n{traceback.format_exc()}")
        logger.info("[TRANSCRIBE-THREAD] Transcription polling thread stopped")

    transcription_thread = threading.Thread(target=transcription_loop, daemon=True)
    transcription_thread.start()

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
                    from .database import db, SyncJob, User

                    # Get distinct org_ids that have users
                    orgs = (
                        db.session.query(User.org_id)
                        .filter(User.org_id != None)
                        .distinct()
                        .all()
                    )
                    for (org_id,) in orgs:
                        # Auto-schedule nightly task sync
                        existing_sync = SyncJob.query.filter(
                            SyncJob.org_id == org_id,
                            SyncJob.job_type == "task_sync",
                            SyncJob.status.in_(["queued", "running"]),
                        ).first()
                        if not existing_sync:
                            new_job = SyncJob(
                                org_id=org_id,
                                status="queued",
                                job_type="task_sync",
                            )
                            db.session.add(new_job)
                            logger.info(
                                f"Auto-scheduled nightly task sync for org {org_id}"
                            )

                        # Auto-schedule nightly element analysis
                        existing_ea = SyncJob.query.filter(
                            SyncJob.org_id == org_id,
                            SyncJob.job_type == "element_analysis",
                            SyncJob.status.in_(["queued", "running"]),
                        ).first()
                        if not existing_ea:
                            new_job = SyncJob(
                                org_id=org_id,
                                status="queued",
                                job_type="element_analysis",
                            )
                            db.session.add(new_job)
                            logger.info(
                                f"Auto-scheduled nightly element analysis for org {org_id}"
                            )
                    db.session.commit()
            except Exception as e:
                logger.error(f"Failed to auto-schedule nightly jobs: {e}")

        # Heartbeat every 10 minutes (120 * 5s)
        heartbeat_counter += 1
        if heartbeat_counter >= 120:
            heartbeat_counter = 0
            logger.info("Worker heartbeat — still running")

    logger.info("Worker process stopped")


if __name__ == "__main__":
    main()
