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
from ..database import db, Task, Project, User, TimeEntry, TeamUser
from ..filters import resolve_filtered_user_ids, resolve_filtered_osm_usernames


class ReportsAPI(MethodView):
    """Reports API endpoints."""

    def post(self, path: str):
        if path == "fetch_editing_stats":
            return self.fetch_editing_stats()
        elif path == "fetch_timekeeping_stats":
            return self.fetch_timekeeping_stats()
        elif path == "fetch_changeset_heatmap":
            return self.fetch_changeset_heatmap()
        return {"message": "Unknown path", "status": 404}

    @requires_admin
    def fetch_editing_stats(self):
        """Fetch editing statistics: summary, tasks over time, projects, top contributors."""
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
            Task.mapped == True,
            Task.date_mapped >= start_date,
            Task.date_mapped < end_date,
        )
        if osm_usernames:
            mapped_query = mapped_query.filter(Task.mapped_by.in_(osm_usernames))
        total_mapped = mapped_query.count()

        validated_query = Task.query.filter(
            Task.org_id == g.user.org_id,
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
            Task.invalidated == True,
            Task.date_validated >= start_date,
            Task.date_validated < end_date,
        )
        if osm_usernames:
            invalidated_query = invalidated_query.filter(
                Task.validated_by.in_(osm_usernames)
            )
        total_invalidated = invalidated_query.count()

        active_projects = Project.query.filter_by(
            org_id=g.user.org_id, status=True, completed=False
        ).count()
        completed_projects = Project.query.filter_by(
            org_id=g.user.org_id, completed=True
        ).count()

        # --- Tasks over time (weekly buckets) ---
        week_mapped = (
            db.session.query(
                func.date_trunc("week", Task.date_mapped).label("week"),
                func.count().label("count"),
            )
            .filter(
                Task.org_id == g.user.org_id,
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

        # --- Projects table ---
        projects_list = []
        org_projects = Project.query.filter_by(org_id=g.user.org_id).all()
        for proj in org_projects:
            total = proj.total_tasks or 0
            mapped = proj.tasks_mapped or 0
            validated = proj.tasks_validated or 0
            invalidated = proj.tasks_invalidated or 0
            projects_list.append(
                {
                    "id": proj.id,
                    "name": proj.name,
                    "url": proj.url or "",
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
            )

        # --- Top contributors ---
        contrib_query = (
            db.session.query(
                Task.mapped_by,
                func.count().label("mapped_count"),
            )
            .filter(
                Task.org_id == g.user.org_id,
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
                Task.validated_by == osm_un,
                Task.validated == True,
                Task.date_validated >= start_date,
                Task.date_validated < end_date,
            ).count()

            inv_count = Task.query.filter(
                Task.org_id == g.user.org_id,
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

            top_contributors.append(
                {
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

            cmp_mapped_q = Task.query.filter(
                Task.org_id == g.user.org_id,
                Task.mapped == True,
                Task.date_mapped >= cmp_start,
                Task.date_mapped < cmp_end,
            )
            if osm_usernames:
                cmp_mapped_q = cmp_mapped_q.filter(Task.mapped_by.in_(osm_usernames))
            cmp_total_mapped = cmp_mapped_q.count()

            cmp_validated_q = Task.query.filter(
                Task.org_id == g.user.org_id,
                Task.validated == True,
                Task.date_validated >= cmp_start,
                Task.date_validated < cmp_end,
            )
            if osm_usernames:
                cmp_validated_q = cmp_validated_q.filter(Task.validated_by.in_(osm_usernames))
            cmp_total_validated = cmp_validated_q.count()

            cmp_invalidated_q = Task.query.filter(
                Task.org_id == g.user.org_id,
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
            },
            "tasks_over_time": tasks_over_time,
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
