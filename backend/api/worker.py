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

        # Get assigned users
        assigned_user_ids = [
            pu.user_id
            for pu in ProjectUser.query.filter_by(project_id=project.id).all()
        ]
        users = User.query.filter(User.id.in_(assigned_user_ids)).all() if assigned_user_ids else []

        # Include all org users if project is visible
        if project.visibility:
            user_ids_set = set(assigned_user_ids)
            all_org_users = User.query.filter_by(org_id=job.org_id).all()
            for u in all_org_users:
                if u.id not in user_ids_set:
                    users.append(u)

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
        new_total = mr_data.get("task_count", 0)
        if new_total and new_total > 0:
            project.total_tasks = new_total
        else:
            # 100% complete — count synced task records
            from ..database import Task
            synced_count = Task.query.filter_by(project_id=project.id).count()
            if synced_count > 0:
                project.total_tasks = synced_count

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
    logger.info("MIKRO SYNC WORKER STARTING")
    logger.info("Handles background task synchronization with TM4")
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

    heartbeat_counter = 0
    last_nightly_date = None  # Track last auto-schedule date

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
