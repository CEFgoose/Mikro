#!/usr/bin/env python3
"""
Reports API endpoints for Mikro.

Handles editing statistics and timekeeping reports for admin dashboards.
"""

import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests as http_requests
from flask.views import MethodView
from flask import g, request, current_app
from datetime import datetime, timedelta
from sqlalchemy import func

from ..utils import requires_admin
from ..database import db, Task, Project, User, TimeEntry, TeamUser, SyncJob, ElementAnalysisCache
from ..filters import resolve_filtered_user_ids, resolve_filtered_osm_usernames


class ReportsAPI(MethodView):
    """Reports API endpoints."""

    def post(self, path: str):
        if path == "fetch_editing_stats":
            return self.fetch_editing_stats()
        elif path == "fetch_mr_stats":
            return self.fetch_editing_stats(source="mr")
        elif path == "fetch_timekeeping_stats":
            return self.fetch_timekeeping_stats()
        elif path == "fetch_changeset_heatmap":
            return self.fetch_changeset_heatmap()
        elif path == "fetch_element_analysis":
            return self.fetch_element_analysis()
        elif path == "queue_element_analysis":
            return self.queue_element_analysis()
        elif path == "check_element_analysis_status":
            return self.check_element_analysis_status()
        elif path == "fetch_mapillary_stats":
            return self.fetch_mapillary_stats()
        return {"message": "Unknown path", "status": 404}

    @requires_admin
    def fetch_editing_stats(self, source=None):
        """Fetch editing statistics: summary, tasks over time, projects, top contributors.

        Args:
            source: Optional source filter ("tm4" or "mr"). If None, uses
                    request body "source" param, defaulting to "tm4".
        """
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        # Determine source filter — default to "tm4" for backward compat
        if source is None:
            source = request.json.get("source", "tm4")

        start_date_str = request.json.get("startDate")
        end_date_str = request.json.get("endDate")
        team_id = request.json.get("teamId")
        user_id = request.json.get("userId")
        compare_start_str = request.json.get("compareStartDate")
        compare_end_str = request.json.get("compareEndDate")

        if not start_date_str or not end_date_str:
            return {"message": "startDate and endDate required", "status": 400}

        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%dT%H:%M:%S")
        except ValueError:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        try:
            end_date = datetime.strptime(end_date_str, "%Y-%m-%dT%H:%M:%S")
        except ValueError:
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d") + timedelta(days=1)

        # Universal filter system (backward compat with teamId/userId)
        filters = request.json.get("filters")
        osm_usernames = None
        if filters:
            osm_usernames = resolve_filtered_osm_usernames(filters, g.user.org_id)
        elif user_id:
            user_obj = User.query.get(user_id)
            if user_obj and user_obj.osm_username:
                osm_usernames = [user_obj.osm_username]
            else:
                osm_usernames = []  # no OSM username → match nothing
        elif team_id:
            member_users = (
                User.query.join(TeamUser, TeamUser.user_id == User.id)
                .filter(TeamUser.team_id == team_id)
                .all()
            )
            osm_usernames = [u.osm_username for u in member_users if u.osm_username]

        # --- Summary ---
        mapped_query = Task.query.filter(
            Task.org_id == g.user.org_id,
            Task.source == source,
            Task.mapped == True,
            Task.date_mapped >= start_date,
            Task.date_mapped < end_date,
        )
        if osm_usernames:
            mapped_query = mapped_query.filter(Task.mapped_by.in_(osm_usernames))
        total_mapped = mapped_query.count()

        validated_query = Task.query.filter(
            Task.org_id == g.user.org_id,
            Task.source == source,
            Task.validated == True,
            Task.date_validated >= start_date,
            Task.date_validated < end_date,
        )
        if osm_usernames:
            validated_query = validated_query.filter(
                Task.validated_by.in_(osm_usernames)
            )
        total_validated = validated_query.count()

        invalidated_query = Task.query.filter(
            Task.org_id == g.user.org_id,
            Task.source == source,
            Task.invalidated == True,
            Task.date_validated >= start_date,
            Task.date_validated < end_date,
        )
        if osm_usernames:
            invalidated_query = invalidated_query.filter(
                Task.validated_by.in_(osm_usernames)
            )
        total_invalidated = invalidated_query.count()

        # --- MR status breakdown (only for MapRoulette source) ---
        mr_status_summary = {}
        if source == "mr":
            status_counts = (
                db.session.query(Task.mr_status, func.count())
                .filter(
                    Task.org_id == g.user.org_id,
                    Task.source == "mr",
                    Task.mapped == True,
                    Task.date_mapped >= start_date,
                    Task.date_mapped < end_date,
                )
            )
            if osm_usernames:
                status_counts = status_counts.filter(
                    Task.mapped_by.in_(osm_usernames)
                )
            status_counts = status_counts.group_by(Task.mr_status).all()
            for row in status_counts:
                if row[0] is not None:
                    mr_status_summary[row[0]] = row[1]

        active_projects = Project.query.filter_by(
            org_id=g.user.org_id, source=source, status=True, completed=False
        ).count()
        completed_projects = Project.query.filter_by(
            org_id=g.user.org_id, source=source, completed=True
        ).count()

        # --- Tasks over time (weekly buckets) ---
        week_mapped = (
            db.session.query(
                func.date_trunc("week", Task.date_mapped).label("week"),
                func.count().label("count"),
            )
            .filter(
                Task.org_id == g.user.org_id,
                Task.source == source,
                Task.mapped == True,
                Task.date_mapped >= start_date,
                Task.date_mapped < end_date,
            )
        )
        if osm_usernames:
            week_mapped = week_mapped.filter(Task.mapped_by.in_(osm_usernames))
        week_mapped = week_mapped.group_by("week").all()

        week_validated = (
            db.session.query(
                func.date_trunc("week", Task.date_validated).label("week"),
                func.count().label("count"),
            )
            .filter(
                Task.org_id == g.user.org_id,
                Task.source == source,
                Task.validated == True,
                Task.date_validated >= start_date,
                Task.date_validated < end_date,
            )
        )
        if osm_usernames:
            week_validated = week_validated.filter(
                Task.validated_by.in_(osm_usernames)
            )
        week_validated = week_validated.group_by("week").all()

        week_invalidated = (
            db.session.query(
                func.date_trunc("week", Task.date_validated).label("week"),
                func.count().label("count"),
            )
            .filter(
                Task.org_id == g.user.org_id,
                Task.source == source,
                Task.invalidated == True,
                Task.date_validated >= start_date,
                Task.date_validated < end_date,
            )
        )
        if osm_usernames:
            week_invalidated = week_invalidated.filter(
                Task.validated_by.in_(osm_usernames)
            )
        week_invalidated = week_invalidated.group_by("week").all()

        # Merge into a single dict keyed by week
        weeks = {}
        for row in week_mapped:
            key = row.week.strftime("%Y-%m-%d")
            weeks.setdefault(
                key, {"week": key, "mapped": 0, "validated": 0, "invalidated": 0}
            )
            weeks[key]["mapped"] = row.count
        for row in week_validated:
            key = row.week.strftime("%Y-%m-%d")
            weeks.setdefault(
                key, {"week": key, "mapped": 0, "validated": 0, "invalidated": 0}
            )
            weeks[key]["validated"] = row.count
        for row in week_invalidated:
            key = row.week.strftime("%Y-%m-%d")
            weeks.setdefault(
                key, {"week": key, "mapped": 0, "validated": 0, "invalidated": 0}
            )
            weeks[key]["invalidated"] = row.count
        tasks_over_time = sorted(weeks.values(), key=lambda x: x["week"])

        # --- MR status over time (weekly, by mr_status) ---
        mr_status_over_time = []
        if source == "mr":
            week_by_status = (
                db.session.query(
                    func.date_trunc("week", Task.date_mapped).label("week"),
                    Task.mr_status,
                    func.count().label("count"),
                )
                .filter(
                    Task.org_id == g.user.org_id,
                    Task.source == "mr",
                    Task.mapped == True,
                    Task.mr_status != None,
                    Task.date_mapped >= start_date,
                    Task.date_mapped < end_date,
                )
            )
            if osm_usernames:
                week_by_status = week_by_status.filter(
                    Task.mapped_by.in_(osm_usernames)
                )
            week_by_status = week_by_status.group_by("week", Task.mr_status).all()

            weeks_mr = {}
            for row in week_by_status:
                key = row.week.strftime("%Y-%m-%d")
                weeks_mr.setdefault(
                    key,
                    {
                        "week": key,
                        "fixed": 0,
                        "already_fixed": 0,
                        "false_positive": 0,
                        "skipped": 0,
                        "cant_complete": 0,
                    },
                )
                status_key = {
                    1: "fixed",
                    2: "false_positive",
                    3: "skipped",
                    5: "already_fixed",
                    6: "cant_complete",
                }.get(row.mr_status)
                if status_key:
                    weeks_mr[key][status_key] = row.count
            mr_status_over_time = sorted(
                weeks_mr.values(), key=lambda x: x["week"]
            )

        # --- Projects table ---
        projects_list = []
        org_projects = Project.query.filter_by(
            org_id=g.user.org_id, source=source
        ).all()
        for proj in org_projects:
            total = proj.total_tasks or 0
            mapped = proj.tasks_mapped or 0
            validated = proj.tasks_validated or 0
            invalidated = proj.tasks_invalidated or 0
            proj_dict = {
                "id": proj.id,
                "name": proj.name,
                "url": proj.url or "",
                "source": proj.source,
                "total_tasks": total,
                "tasks_mapped": mapped,
                "tasks_validated": validated,
                "tasks_invalidated": invalidated,
                "percent_mapped": round(mapped / total * 100, 1) if total else 0,
                "percent_validated": (
                    round(validated / total * 100, 1) if total else 0
                ),
                "mapping_rate": proj.mapping_rate_per_task or 0,
                "validation_rate": proj.validation_rate_per_task or 0,
                "status": proj.status,
                "difficulty": proj.difficulty or "Unknown",
            }
            if source == "mr":
                mr_proj_status = (
                    db.session.query(Task.mr_status, func.count())
                    .filter(
                        Task.project_id == proj.id,
                        Task.mr_status != None,
                    )
                    .group_by(Task.mr_status)
                    .all()
                )
                proj_dict["mr_status_breakdown"] = {
                    s: c for s, c in mr_proj_status if s is not None
                }
            projects_list.append(proj_dict)

        # --- Top contributors ---
        contrib_query = (
            db.session.query(
                Task.mapped_by,
                func.count().label("mapped_count"),
            )
            .filter(
                Task.org_id == g.user.org_id,
                Task.source == source,
                Task.mapped == True,
                Task.date_mapped >= start_date,
                Task.date_mapped < end_date,
                Task.mapped_by != None,
            )
        )
        if osm_usernames:
            contrib_query = contrib_query.filter(Task.mapped_by.in_(osm_usernames))
        contrib_query = (
            contrib_query.group_by(Task.mapped_by)
            .order_by(func.count().desc())
            .limit(20)
            .all()
        )

        top_contributors = []
        for row in contrib_query:
            osm_un = row.mapped_by
            user = User.query.filter_by(
                osm_username=osm_un, org_id=g.user.org_id
            ).first()

            val_count = Task.query.filter(
                Task.org_id == g.user.org_id,
                Task.source == source,
                Task.validated_by == osm_un,
                Task.validated == True,
                Task.date_validated >= start_date,
                Task.date_validated < end_date,
            ).count()

            inv_count = Task.query.filter(
                Task.org_id == g.user.org_id,
                Task.source == source,
                Task.validated_by == osm_un,
                Task.invalidated == True,
                Task.date_validated >= start_date,
                Task.date_validated < end_date,
            ).count()

            # Get hours from TimeEntry
            hours = 0.0
            if user:
                hours_result = (
                    db.session.query(func.sum(TimeEntry.duration_seconds))
                    .filter(
                        TimeEntry.user_id == user.id,
                        TimeEntry.status == "completed",
                        TimeEntry.clock_in >= start_date,
                        TimeEntry.clock_in < end_date,
                    )
                    .scalar()
                )
                hours = round((hours_result or 0) / 3600, 1)

            contributor_dict = {
                "user_id": user.id if user else None,
                "user_name": (
                    f"{user.first_name} {user.last_name}".strip()
                    if user
                    else osm_un
                ),
                "osm_username": osm_un,
                "tasks_mapped": row.mapped_count,
                "tasks_validated": val_count,
                "tasks_invalidated": inv_count,
                "total_hours": hours,
            }
            if source == "mr":
                mr_contrib_status = (
                    db.session.query(Task.mr_status, func.count())
                    .filter(
                        Task.org_id == g.user.org_id,
                        Task.source == "mr",
                        Task.mapped_by == osm_un,
                        Task.mr_status != None,
                        Task.date_mapped >= start_date,
                        Task.date_mapped < end_date,
                    )
                    .group_by(Task.mr_status)
                    .all()
                )
                contributor_dict["mr_status_breakdown"] = {
                    s: c for s, c in mr_contrib_status if s is not None
                }
            top_contributors.append(contributor_dict)

        # --- Comparison period (optional) ---
        comparison = None
        if compare_start_str and compare_end_str:
            try:
                cmp_start = datetime.strptime(compare_start_str, "%Y-%m-%dT%H:%M:%S")
            except ValueError:
                cmp_start = datetime.strptime(compare_start_str, "%Y-%m-%d")
            try:
                cmp_end = datetime.strptime(compare_end_str, "%Y-%m-%dT%H:%M:%S")
            except ValueError:
                cmp_end = datetime.strptime(compare_end_str, "%Y-%m-%d") + timedelta(days=1)

            cmp_mapped_q = Task.query.filter(
                Task.org_id == g.user.org_id,
                Task.source == source,
                Task.mapped == True,
                Task.date_mapped >= cmp_start,
                Task.date_mapped < cmp_end,
            )
            if osm_usernames:
                cmp_mapped_q = cmp_mapped_q.filter(Task.mapped_by.in_(osm_usernames))
            cmp_total_mapped = cmp_mapped_q.count()

            cmp_validated_q = Task.query.filter(
                Task.org_id == g.user.org_id,
                Task.source == source,
                Task.validated == True,
                Task.date_validated >= cmp_start,
                Task.date_validated < cmp_end,
            )
            if osm_usernames:
                cmp_validated_q = cmp_validated_q.filter(Task.validated_by.in_(osm_usernames))
            cmp_total_validated = cmp_validated_q.count()

            cmp_invalidated_q = Task.query.filter(
                Task.org_id == g.user.org_id,
                Task.source == source,
                Task.invalidated == True,
                Task.date_validated >= cmp_start,
                Task.date_validated < cmp_end,
            )
            if osm_usernames:
                cmp_invalidated_q = cmp_invalidated_q.filter(Task.validated_by.in_(osm_usernames))
            cmp_total_invalidated = cmp_invalidated_q.count()

            comparison = {
                "summary": {
                    "total_mapped": cmp_total_mapped,
                    "total_validated": cmp_total_validated,
                    "total_invalidated": cmp_total_invalidated,
                },
            }

        return {
            "status": 200,
            "snapshot_timestamp": datetime.utcnow().isoformat() + "Z",
            "summary": {
                "total_mapped": total_mapped,
                "total_validated": total_validated,
                "total_invalidated": total_invalidated,
                "active_projects": active_projects,
                "completed_projects": completed_projects,
                "mr_status_summary": mr_status_summary if source == "mr" else None,
            },
            "tasks_over_time": tasks_over_time,
            "mr_status_over_time": mr_status_over_time if source == "mr" else None,
            "projects": projects_list,
            "top_contributors": top_contributors,
            "comparison": comparison,
        }

    @requires_admin
    def fetch_timekeeping_stats(self):
        """Fetch timekeeping statistics: summary, hours by category, weekly activity, user breakdown."""
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        start_date_str = request.json.get("startDate")
        end_date_str = request.json.get("endDate")
        team_id = request.json.get("teamId")
        user_id = request.json.get("userId")
        compare_start_str = request.json.get("compareStartDate")
        compare_end_str = request.json.get("compareEndDate")

        if not start_date_str or not end_date_str:
            return {"message": "startDate and endDate required", "status": 400}

        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%dT%H:%M:%S")
        except ValueError:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        try:
            end_date = datetime.strptime(end_date_str, "%Y-%m-%dT%H:%M:%S")
        except ValueError:
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d") + timedelta(days=1)

        # Build base filter — universal filter system (backward compat with teamId/userId)
        base_filter = [
            TimeEntry.org_id == g.user.org_id,
            TimeEntry.status == "completed",
            TimeEntry.clock_in >= start_date,
            TimeEntry.clock_in < end_date,
        ]
        filters = request.json.get("filters")
        member_ids = None
        if filters:
            filtered_ids = resolve_filtered_user_ids(filters, g.user.org_id)
            if filtered_ids is not None:
                member_ids = filtered_ids
                base_filter.append(TimeEntry.user_id.in_(member_ids))
        elif user_id:
            base_filter.append(TimeEntry.user_id == user_id)
        elif team_id:
            member_ids = [
                tu.user_id for tu in TeamUser.query.filter_by(team_id=team_id).all()
            ]
            base_filter.append(TimeEntry.user_id.in_(member_ids))

        # --- Summary ---
        summary_result = (
            db.session.query(
                func.sum(TimeEntry.duration_seconds).label("total_seconds"),
                func.count().label("total_entries"),
                func.sum(TimeEntry.changeset_count).label("total_changesets"),
                func.sum(TimeEntry.changes_count).label("total_changes"),
                func.count(func.distinct(TimeEntry.user_id)).label("active_users"),
            )
            .filter(*base_filter)
            .first()
        )

        total_seconds = summary_result.total_seconds or 0
        total_hours = round(total_seconds / 3600, 1)
        total_entries = summary_result.total_entries or 0
        total_changesets = summary_result.total_changesets or 0
        total_changes = summary_result.total_changes or 0
        active_users = summary_result.active_users or 0
        avg_hours = round(total_hours / active_users, 1) if active_users else 0

        # Weekly rate change: compare to prior period of same length
        period_length = (end_date - start_date).days
        prior_start = start_date - timedelta(days=period_length)
        prior_end = start_date
        prior_filter = [
            TimeEntry.org_id == g.user.org_id,
            TimeEntry.status == "completed",
            TimeEntry.clock_in >= prior_start,
            TimeEntry.clock_in < prior_end,
        ]
        if member_ids is not None:
            prior_filter.append(TimeEntry.user_id.in_(member_ids))
        elif user_id:
            prior_filter.append(TimeEntry.user_id == user_id)
        elif team_id:
            prior_member_ids = [
                tu.user_id for tu in TeamUser.query.filter_by(team_id=team_id).all()
            ]
            prior_filter.append(TimeEntry.user_id.in_(prior_member_ids))
        prior_seconds = (
            db.session.query(func.sum(TimeEntry.duration_seconds))
            .filter(*prior_filter)
            .scalar()
            or 0
        )
        prior_hours = prior_seconds / 3600
        weekly_change = (
            round((total_hours - prior_hours) / prior_hours * 100, 1)
            if prior_hours > 0
            else 0
        )

        # --- Hours by category ---
        cat_results = (
            db.session.query(
                TimeEntry.category,
                func.sum(TimeEntry.duration_seconds).label("seconds"),
            )
            .filter(*base_filter)
            .group_by(TimeEntry.category)
            .all()
        )

        hours_by_category = [
            {
                "category": row.category or "other",
                "hours": round((row.seconds or 0) / 3600, 1),
            }
            for row in cat_results
        ]

        # --- Weekly activity ---
        weekly_results = (
            db.session.query(
                func.date_trunc("week", TimeEntry.clock_in).label("week"),
                func.sum(TimeEntry.duration_seconds).label("seconds"),
                func.sum(TimeEntry.changeset_count).label("changesets"),
                func.sum(TimeEntry.changes_count).label("changes"),
            )
            .filter(*base_filter)
            .group_by("week")
            .order_by("week")
            .all()
        )

        weekly_activity = []
        for row in weekly_results:
            hours = round((row.seconds or 0) / 3600, 1)
            changesets = row.changesets or 0
            changes = row.changes or 0
            weekly_activity.append(
                {
                    "week": row.week.strftime("%Y-%m-%d"),
                    "hours": hours,
                    "changesets": changesets,
                    "changes": changes,
                    "changes_per_changeset": (
                        round(changes / changesets, 1) if changesets else 0
                    ),
                    "changes_per_hour": round(changes / hours, 1) if hours else 0,
                }
            )

        # --- Per-user breakdown ---
        user_results = (
            db.session.query(
                TimeEntry.user_id,
                func.sum(TimeEntry.duration_seconds).label("seconds"),
                func.count().label("entries"),
                func.sum(TimeEntry.changeset_count).label("changesets"),
                func.sum(TimeEntry.changes_count).label("changes"),
            )
            .filter(*base_filter)
            .group_by(TimeEntry.user_id)
            .order_by(func.sum(TimeEntry.duration_seconds).desc())
            .all()
        )

        user_breakdown = []
        for row in user_results:
            user = User.query.get(row.user_id)
            if not user:
                continue

            # Get per-category breakdown
            cat_detail = (
                db.session.query(
                    TimeEntry.category,
                    func.sum(TimeEntry.duration_seconds).label("seconds"),
                )
                .filter(
                    *base_filter,
                    TimeEntry.user_id == row.user_id,
                )
                .group_by(TimeEntry.category)
                .all()
            )

            category_hours = {}
            for cd in cat_detail:
                category_hours[cd.category or "other"] = round(
                    (cd.seconds or 0) / 3600, 1
                )

            user_breakdown.append(
                {
                    "user_id": row.user_id,
                    "user_name": (
                        f"{user.first_name} {user.last_name}".strip() or user.email
                    ),
                    "osm_username": user.osm_username or "",
                    "total_hours": round((row.seconds or 0) / 3600, 1),
                    "entries_count": row.entries or 0,
                    "changeset_count": row.changesets or 0,
                    "changes_count": row.changes or 0,
                    "category_hours": category_hours,
                }
            )

        # --- Comparison period (optional) ---
        comparison = None
        if compare_start_str and compare_end_str:
            try:
                cmp_start = datetime.strptime(compare_start_str, "%Y-%m-%dT%H:%M:%S")
            except ValueError:
                cmp_start = datetime.strptime(compare_start_str, "%Y-%m-%d")
            try:
                cmp_end = datetime.strptime(compare_end_str, "%Y-%m-%dT%H:%M:%S")
            except ValueError:
                cmp_end = datetime.strptime(compare_end_str, "%Y-%m-%d") + timedelta(days=1)

            cmp_filter = [
                TimeEntry.org_id == g.user.org_id,
                TimeEntry.status == "completed",
                TimeEntry.clock_in >= cmp_start,
                TimeEntry.clock_in < cmp_end,
            ]
            if member_ids is not None:
                cmp_filter.append(TimeEntry.user_id.in_(member_ids))
            elif user_id:
                cmp_filter.append(TimeEntry.user_id == user_id)
            elif team_id:
                cmp_member_ids = [
                    tu.user_id for tu in TeamUser.query.filter_by(team_id=team_id).all()
                ]
                cmp_filter.append(TimeEntry.user_id.in_(cmp_member_ids))

            cmp_summary = (
                db.session.query(
                    func.sum(TimeEntry.duration_seconds).label("total_seconds"),
                    func.count().label("total_entries"),
                    func.sum(TimeEntry.changeset_count).label("total_changesets"),
                    func.sum(TimeEntry.changes_count).label("total_changes"),
                    func.count(func.distinct(TimeEntry.user_id)).label("active_users"),
                )
                .filter(*cmp_filter)
                .first()
            )

            cmp_seconds = cmp_summary.total_seconds or 0
            cmp_hours = round(cmp_seconds / 3600, 1)
            cmp_active = cmp_summary.active_users or 0

            comparison = {
                "summary": {
                    "total_hours": cmp_hours,
                    "total_entries": cmp_summary.total_entries or 0,
                    "total_changesets": cmp_summary.total_changesets or 0,
                    "total_changes": cmp_summary.total_changes or 0,
                    "active_users": cmp_active,
                    "avg_hours_per_user": (
                        round(cmp_hours / cmp_active, 1) if cmp_active else 0
                    ),
                },
            }

        # --- Weekly hours by category (for stacked bar chart) ---
        weekly_cat_results = (
            db.session.query(
                func.date_trunc("week", TimeEntry.clock_in).label("week"),
                TimeEntry.category,
                func.sum(TimeEntry.duration_seconds).label("seconds"),
            )
            .filter(*base_filter)
            .group_by("week", TimeEntry.category)
            .order_by("week")
            .all()
        )

        # Pivot into [{week, Cat1: hours, Cat2: hours, ...}]
        weekly_cat_map = {}
        all_cats = set()
        for row in weekly_cat_results:
            week_key = row.week.strftime("%Y-%m-%d")
            cat = row.category or "other"
            all_cats.add(cat)
            if week_key not in weekly_cat_map:
                weekly_cat_map[week_key] = {"week": week_key}
            weekly_cat_map[week_key][cat] = round((row.seconds or 0) / 3600, 1)

        weekly_category_hours = sorted(
            weekly_cat_map.values(), key=lambda x: x["week"]
        )

        return {
            "status": 200,
            "snapshot_timestamp": datetime.utcnow().isoformat() + "Z",
            "summary": {
                "total_hours": total_hours,
                "total_entries": total_entries,
                "total_changesets": total_changesets,
                "total_changes": total_changes,
                "active_users": active_users,
                "avg_hours_per_user": avg_hours,
                "weekly_rate_change_percent": weekly_change,
            },
            "hours_by_category": hours_by_category,
            "weekly_activity": weekly_activity,
            "weekly_category_hours": weekly_category_hours,
            "weekly_category_names": sorted(all_cats),
            "user_breakdown": user_breakdown,
            "comparison": comparison,
        }

    @requires_admin
    def fetch_changeset_heatmap(self):
        """Fetch aggregated changeset centroids for the org heatmap."""
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        start_date_str = request.json.get("startDate")
        end_date_str = request.json.get("endDate")

        if not start_date_str or not end_date_str:
            return {"message": "startDate and endDate required", "status": 400}

        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%dT%H:%M:%S")
        except ValueError:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        try:
            end_date = datetime.strptime(end_date_str, "%Y-%m-%dT%H:%M:%S")
        except ValueError:
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d") + timedelta(days=1)

        # Get OSM usernames of mappers active in this period
        active_mappers_q = (
            db.session.query(Task.mapped_by)
            .filter(
                Task.org_id == g.user.org_id,
                Task.mapped == True,
                Task.date_mapped >= start_date,
                Task.date_mapped < end_date,
                Task.mapped_by != None,
            )
            .distinct()
        )

        # Apply filters if provided
        filters = request.json.get("filters")
        if filters:
            filtered_usernames = resolve_filtered_osm_usernames(
                filters, g.user.org_id
            )
            if filtered_usernames is not None:
                active_mappers_q = active_mappers_q.filter(
                    Task.mapped_by.in_(filtered_usernames)
                )

        osm_usernames = [row[0] for row in active_mappers_q.all()]

        if not osm_usernames:
            return {
                "status": 200,
                "heatmapPoints": [],
                "summary": {
                    "totalChangesets": 0,
                    "totalChanges": 0,
                    "usersWithData": 0,
                },
            }

        # Fetch changesets from OSM API for each username concurrently
        def _fetch_user_heatmap(username):
            """Fetch changeset list for one user and extract centroids."""
            osm_url = "https://api.openstreetmap.org/api/0.6/changesets"
            params = {
                "display_name": username,
                "time": f"{start_date_str},{end_date_str}",
                "closed": "true",
            }
            try:
                resp = http_requests.get(osm_url, params=params, timeout=30)
                if not resp.ok:
                    current_app.logger.warning(
                        f"OSM API error for {username}: {resp.status_code}"
                    )
                    return username, [], 0, 0
            except http_requests.RequestException as e:
                current_app.logger.warning(
                    f"OSM API request failed for {username}: {e}"
                )
                return username, [], 0, 0

            try:
                root = ET.fromstring(resp.text)
            except ET.ParseError:
                current_app.logger.warning(
                    f"Failed to parse OSM XML for {username}"
                )
                return username, [], 0, 0

            points = []
            cs_count = 0
            changes_total = 0
            for cs in root.findall("changeset"):
                cs_count += 1
                changes = int(cs.get("changes_count", 0))
                changes_total += changes

                min_lat = cs.get("min_lat")
                max_lat = cs.get("max_lat")
                min_lon = cs.get("min_lon")
                max_lon = cs.get("max_lon")
                if min_lat and max_lat and min_lon and max_lon:
                    lat = (float(min_lat) + float(max_lat)) / 2
                    lon = (float(min_lon) + float(max_lon)) / 2
                    points.append([lat, lon, max(changes, 1)])

            return username, points, cs_count, changes_total

        all_points = []
        total_changesets = 0
        total_changes = 0
        users_with_data = 0

        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {
                executor.submit(_fetch_user_heatmap, un): un
                for un in osm_usernames
            }
            for future in as_completed(futures):
                username, points, cs_count, changes = future.result()
                if points:
                    all_points.extend(points)
                    users_with_data += 1
                total_changesets += cs_count
                total_changes += changes

        return {
            "status": 200,
            "heatmapPoints": all_points,
            "summary": {
                "totalChangesets": total_changesets,
                "totalChanges": total_changes,
                "usersWithData": users_with_data,
            },
        }

    @requires_admin
    def fetch_element_analysis(self):
        """Fetch cached element analysis data for the org."""
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        start_date_str = request.json.get("startDate")
        end_date_str = request.json.get("endDate")

        if not start_date_str or not end_date_str:
            return {"message": "startDate and endDate required", "status": 400}

        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        except ValueError:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%dT%H:%M:%S").date()
        try:
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
        except ValueError:
            end_date = datetime.strptime(end_date_str, "%Y-%m-%dT%H:%M:%S").date()

        rows = ElementAnalysisCache.query.filter(
            ElementAnalysisCache.org_id == g.user.org_id,
            ElementAnalysisCache.week >= start_date,
            ElementAnalysisCache.week <= end_date,
        ).all()

        # Group by category, then by week
        cat_data = {}  # {category: {week_date: {week, added, modified, deleted}}}
        last_updated = None
        for row in rows:
            if row.category not in cat_data:
                cat_data[row.category] = {}
            week_str = f"{row.week.month}/{row.week.day}"
            cat_data[row.category][row.week] = {
                "week": week_str,
                "added": row.added,
                "modified": row.modified,
                "deleted": row.deleted,
            }
            if last_updated is None or (row.updated_at and row.updated_at > last_updated):
                last_updated = row.updated_at

        # Build ordered category list matching the 8 expected categories
        all_categories = [
            "Oneways", "Access & Barriers", "Highways", "Refs",
            "Turn Restrictions", "Names", "Construction", "Classifications",
        ]

        categories = []
        for cat_name in all_categories:
            week_data = cat_data.get(cat_name, {})
            # Sort by actual date key for correct chronological order
            sorted_data = [
                week_data[k] for k in sorted(week_data.keys())
            ]
            categories.append({
                "title": cat_name,
                "data": sorted_data,
            })

        return {
            "status": 200,
            "categories": categories,
            "lastUpdated": last_updated.isoformat() + "Z" if last_updated else None,
        }

    @requires_admin
    def queue_element_analysis(self):
        """Queue a background element analysis job."""
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        org_id = g.user.org_id

        # Check for already running/queued analysis job
        existing = SyncJob.query.filter(
            SyncJob.org_id == org_id,
            SyncJob.job_type == "element_analysis",
            SyncJob.status.in_(["queued", "running"]),
        ).first()
        if existing:
            return {
                "status": 200,
                "job_id": existing.id,
                "message": "Analysis job already in progress",
            }

        new_job = SyncJob(
            org_id=org_id,
            status="queued",
            job_type="element_analysis",
        )
        db.session.add(new_job)
        db.session.commit()

        return {
            "status": 200,
            "job_id": new_job.id,
        }

    @requires_admin
    def check_element_analysis_status(self):
        """Check status of the latest element analysis job."""
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        job = (
            SyncJob.query.filter_by(
                org_id=g.user.org_id,
                job_type="element_analysis",
            )
            .order_by(SyncJob.id.desc())
            .first()
        )

        if not job:
            return {"status": 200, "message": "No analysis jobs found"}

        return {
            "status": 200,
            "job_id": job.id,
            "sync_status": job.status,
            "progress": job.progress,
            "started_at": job.started_at.isoformat() + "Z" if job.started_at else None,
            "completed_at": job.completed_at.isoformat() + "Z" if job.completed_at else None,
            "error": job.error,
        }

    @requires_admin
    def fetch_mapillary_stats(self):
        """Fetch Mapillary imagery upload statistics."""
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        token = current_app.config.get("MAPILLARY_ACCESS_TOKEN")
        if not token:
            return {
                "status": 200,
                "summary": {
                    "total_images": 0,
                    "total_trips": 0,
                    "total_sequences": 0,
                    "active_contributors": 0,
                    "images_by_user": [],
                },
                "trips": [],
                "weekly_uploads": [],
                "message": "Mapillary API token not configured",
            }

        start_date_str = request.json.get("startDate")
        end_date_str = request.json.get("endDate")
        team_id = request.json.get("teamId")
        user_id = request.json.get("userId")

        # Get users with mapillary_username set
        users_query = User.query.filter(
            User.org_id == g.user.org_id,
            User.mapillary_username.isnot(None),
            User.mapillary_username != "",
        )

        # Apply filters
        if user_id:
            users_query = users_query.filter(User.id == user_id)
        elif team_id:
            from ..database import TeamUser as TU
            team_user_ids = [
                tu.user_id for tu in TU.query.filter_by(team_id=team_id).all()
            ]
            if team_user_ids:
                users_query = users_query.filter(User.id.in_(team_user_ids))
            else:
                users_query = users_query.filter(False)

        mapillary_users = users_query.all()

        if not mapillary_users:
            return {
                "status": 200,
                "summary": {
                    "total_images": 0,
                    "total_trips": 0,
                    "total_sequences": 0,
                    "active_contributors": 0,
                    "images_by_user": [],
                },
                "trips": [],
                "weekly_uploads": [],
                "message": "No users have Mapillary usernames linked",
            }

        # Build date range
        if start_date_str and end_date_str:
            start_dt = datetime.strptime(start_date_str, "%Y-%m-%d")
            end_dt = datetime.strptime(end_date_str, "%Y-%m-%d")
        else:
            end_dt = datetime.utcnow()
            start_dt = end_dt - timedelta(days=30)

        start_iso = start_dt.strftime("%Y-%m-%dT00:00:00Z")
        end_iso = end_dt.strftime("%Y-%m-%dT23:59:59Z")

        # Capture these before spawning threads (threads lack Flask app context)
        logger = current_app.logger

        def fetch_user_images(user):
            """Fetch all Mapillary images for a single user."""
            first_name = (user.first_name or "").title()
            last_name = (user.last_name or "").title()
            full_name = f"{first_name} {last_name}".strip() or user.mapillary_username
            all_images = []
            url = (
                f"https://graph.mapillary.com/images"
                f"?access_token={token}"
                f"&creator_username={user.mapillary_username}"
                f"&start_captured_at={start_iso}"
                f"&end_captured_at={end_iso}"
                f"&fields=id,captured_at,sequence"
                f"&limit=2000"
            )
            try:
                while url:
                    resp = http_requests.get(url, timeout=30)
                    if resp.status_code != 200:
                        logger.warning(
                            f"Mapillary API error for {user.mapillary_username}: {resp.status_code}"
                        )
                        break
                    data = resp.json()
                    images = data.get("data", [])
                    all_images.extend(images)
                    # Cursor-based pagination
                    paging = data.get("paging", {})
                    url = paging.get("next")
            except Exception as e:
                logger.error(
                    f"Mapillary fetch error for {user.mapillary_username}: {e}"
                )
            return {
                "user_id": user.id,
                "user_name": full_name,
                "mapillary_username": user.mapillary_username,
                "images": all_images,
            }

        # Fetch images concurrently
        all_user_results = []
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {
                executor.submit(fetch_user_images, u): u for u in mapillary_users
            }
            for future in as_completed(futures):
                try:
                    result = future.result()
                    all_user_results.append(result)
                except Exception as e:
                    logger.error(f"Mapillary fetch thread error: {e}")

        # Process results: build trips, weekly uploads, per-user counts
        total_images = 0
        total_sequences = set()
        images_by_user = []
        all_trips = []
        weekly_buckets = {}

        for user_result in all_user_results:
            images = user_result["images"]
            user_name = user_result["user_name"]
            mapillary_un = user_result["mapillary_username"]
            user_image_count = len(images)
            total_images += user_image_count

            if user_image_count > 0:
                images_by_user.append({
                    "username": mapillary_un,
                    "name": user_name,
                    "count": user_image_count,
                })

            # Group images by sequence
            sequences = {}
            for img in images:
                seq_id = img.get("sequence", "unknown")
                total_sequences.add(seq_id)
                if seq_id not in sequences:
                    sequences[seq_id] = []
                sequences[seq_id].append(img)

            # Derive trips: group sequences by date
            date_groups = {}
            for seq_id, seq_images in sequences.items():
                # Use first image's captured_at (epoch ms) for the date
                if seq_images:
                    cap_at = seq_images[0].get("captured_at")
                    if cap_at and isinstance(cap_at, (int, float)):
                        trip_date = datetime.utcfromtimestamp(cap_at / 1000).strftime("%Y-%m-%d")
                    else:
                        trip_date = "unknown"
                    if trip_date not in date_groups:
                        date_groups[trip_date] = {"images": 0, "sequences": set()}
                    date_groups[trip_date]["images"] += len(seq_images)
                    date_groups[trip_date]["sequences"].add(seq_id)

            for trip_date, trip_data in date_groups.items():
                all_trips.append({
                    "user_name": user_name,
                    "mapillary_username": mapillary_un,
                    "date": trip_date,
                    "image_count": trip_data["images"],
                    "sequence_count": len(trip_data["sequences"]),
                })

            # Weekly upload buckets
            for img in images:
                cap_at = img.get("captured_at")
                if cap_at and isinstance(cap_at, (int, float)):
                    img_date = datetime.utcfromtimestamp(cap_at / 1000)
                    # Get Monday of that week
                    week_start = img_date - timedelta(days=img_date.weekday())
                    week_key = week_start.date()
                    if week_key not in weekly_buckets:
                        weekly_buckets[week_key] = 0
                    weekly_buckets[week_key] += 1

        # Sort trips by date descending
        all_trips.sort(key=lambda t: t["date"], reverse=True)

        # Sort images_by_user by count descending
        images_by_user.sort(key=lambda u: u["count"], reverse=True)

        # Build weekly uploads (sorted chronologically)
        weekly_uploads = []
        for week_key in sorted(weekly_buckets.keys()):
            weekly_uploads.append({
                "week": f"{week_key.month}/{week_key.day}",
                "images": weekly_buckets[week_key],
            })

        active_contributors = len([u for u in images_by_user if u["count"] > 0])

        return {
            "status": 200,
            "summary": {
                "total_images": total_images,
                "total_trips": len(all_trips),
                "total_sequences": len(total_sequences),
                "active_contributors": active_contributors,
                "images_by_user": images_by_user,
            },
            "trips": all_trips,
            "weekly_uploads": weekly_uploads,
        }
