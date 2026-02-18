#!/usr/bin/env python3
"""
Reports API endpoints for Mikro.

Handles editing statistics and timekeeping reports for admin dashboards.
"""

from flask.views import MethodView
from flask import g, request
from datetime import datetime, timedelta
from sqlalchemy import func

from ..utils import requires_admin
from ..database import db, Task, Project, User, TimeEntry, TeamUser


class ReportsAPI(MethodView):
    """Reports API endpoints."""

    def post(self, path: str):
        if path == "fetch_editing_stats":
            return self.fetch_editing_stats()
        elif path == "fetch_timekeeping_stats":
            return self.fetch_timekeeping_stats()
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

        # User/team filter → resolve to OSM usernames
        osm_usernames = None
        if user_id:
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

        # Build base filter
        base_filter = [
            TimeEntry.org_id == g.user.org_id,
            TimeEntry.status == "completed",
            TimeEntry.clock_in >= start_date,
            TimeEntry.clock_in < end_date,
        ]
        member_ids = None
        if user_id:
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
        if user_id:
            prior_filter.append(TimeEntry.user_id == user_id)
        elif team_id and member_ids is not None:
            prior_filter.append(TimeEntry.user_id.in_(member_ids))
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
            if user_id:
                cmp_filter.append(TimeEntry.user_id == user_id)
            elif team_id and member_ids is not None:
                cmp_filter.append(TimeEntry.user_id.in_(member_ids))

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
