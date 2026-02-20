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
    logger.info("Nightly element analysis scheduled at midnight MST (07:00 UTC)")

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
                        # Check no element_analysis job already queued/running
                        existing = SyncJob.query.filter(
                            SyncJob.org_id == org_id,
                            SyncJob.job_type == "element_analysis",
                            SyncJob.status.in_(["queued", "running"]),
                        ).first()
                        if not existing:
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
                logger.error(f"Failed to auto-schedule nightly analysis: {e}")

        # Heartbeat every 10 minutes (120 * 5s)
        heartbeat_counter += 1
        if heartbeat_counter >= 120:
            heartbeat_counter = 0
            logger.info("Worker heartbeat — still running")

    logger.info("Worker process stopped")


if __name__ == "__main__":
    main()
