#!/usr/bin/env python3
"""
Punks List API endpoints for Mikro.

Manages a watchlist of problematic OSM editors ("punks"),
caches their changeset activity from the OSM API, and provides
detail/heatmap data for analysis.
"""

from flask.views import MethodView
from flask import g, request, current_app
from datetime import datetime
from ..utils import requires_admin
from ..database import db, Punk, PunkChangeset
import requests as http_requests
import xml.etree.ElementTree as ET


OSM_API_BASE = "https://api.openstreetmap.org/api/0.6"
OSM_HEADERS = {"User-Agent": "Mikro/1.0 (https://mikro.kaart.com)"}
OSM_TIMEOUT = 30


class PunkAPI(MethodView):
    """Punks watchlist management API."""

    def post(self, path: str):
        if path == "fetch_punks":
            return self.fetch_punks()
        elif path == "create_punk":
            return self.create_punk()
        elif path == "update_punk":
            return self.update_punk()
        elif path == "delete_punk":
            return self.delete_punk()
        elif path == "fetch_punk_detail":
            return self.fetch_punk_detail()
        elif path == "refresh_punk_activity":
            return self.refresh_punk_activity()
        return {"message": "Unknown path", "status": 404}

    # ─── List all punks ──────────────────────────────────

    @requires_admin
    def fetch_punks(self):
        """Return all punks for the org with cached stats."""
        org_id = g.user.org_id
        punks = (
            Punk.query.filter_by(org_id=org_id)
            .order_by(Punk.created_at.desc())
            .all()
        )

        result = []
        for p in punks:
            result.append({
                "id": p.id,
                "osm_username": p.osm_username,
                "osm_uid": p.osm_uid,
                "notes": p.notes,
                "tags": p.tags or [],
                "added_by": p.added_by,
                "added_by_name": p.added_by_name,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "cached_total_changesets": p.cached_total_changesets,
                "cached_last_active": (
                    p.cached_last_active.isoformat() if p.cached_last_active else None
                ),
                "cached_account_created": (
                    p.cached_account_created.isoformat()
                    if p.cached_account_created
                    else None
                ),
                "cache_updated_at": (
                    p.cache_updated_at.isoformat() if p.cache_updated_at else None
                ),
            })

        return {"status": 200, "punks": result}

    # ─── Create punk ─────────────────────────────────────

    @requires_admin
    def create_punk(self):
        """Add a new punk to the watchlist."""
        data = request.json or {}
        osm_username = (data.get("osm_username") or "").strip()
        if not osm_username:
            return {"message": "osm_username is required", "status": 400}

        # Check for duplicate
        existing = Punk.query.filter_by(osm_username=osm_username).first()
        if existing:
            return {"message": f"'{osm_username}' is already on the watchlist", "status": 400}

        # Build added_by_name from the current user
        first = g.user.first_name or ""
        last = g.user.last_name or ""
        added_by_name = f"{first} {last}".strip() or g.user.email or str(g.user.id)

        punk = Punk.create(
            osm_username=osm_username,
            notes=data.get("notes"),
            tags=data.get("tags"),
            added_by=g.user.id,
            added_by_name=added_by_name,
            org_id=g.user.org_id,
        )

        # Populate initial data from OSM
        try:
            self._refresh_punk(punk)
        except Exception as e:
            current_app.logger.warning(
                f"Failed to fetch initial OSM data for punk '{osm_username}': {e}"
            )

        return {
            "status": 200,
            "message": f"'{osm_username}' added to watchlist",
            "punk": {"id": punk.id, "osm_username": punk.osm_username},
        }

    # ─── Update punk ─────────────────────────────────────

    @requires_admin
    def update_punk(self):
        """Update notes and/or tags for a punk."""
        data = request.json or {}
        punk_id = data.get("punk_id")
        if not punk_id:
            return {"message": "punk_id is required", "status": 400}

        punk = Punk.query.get(punk_id)
        if not punk:
            return {"message": "Punk not found", "status": 404}

        updates = {}
        if "notes" in data:
            updates["notes"] = data["notes"]
        if "tags" in data:
            updates["tags"] = data["tags"]

        if updates:
            punk.update(**updates)

        return {"status": 200, "message": "Punk updated"}

    # ─── Delete punk ─────────────────────────────────────

    @requires_admin
    def delete_punk(self):
        """Hard delete a punk and its cached changesets."""
        data = request.json or {}
        punk_id = data.get("punk_id")
        if not punk_id:
            return {"message": "punk_id is required", "status": 400}

        punk = Punk.query.get(punk_id)
        if not punk:
            return {"message": "Punk not found", "status": 404}

        # Delete cached changesets first
        PunkChangeset.query.filter_by(punk_id=punk_id).delete()
        db.session.delete(punk)
        db.session.commit()

        return {"status": 200, "message": "Punk deleted"}

    # ─── Punk detail ─────────────────────────────────────

    @requires_admin
    def fetch_punk_detail(self):
        """Return punk info, cached changesets, heatmap points, and summary."""
        data = request.json or {}
        punk_id = data.get("punk_id")
        if not punk_id:
            return {"message": "punk_id is required", "status": 400}

        punk = Punk.query.get(punk_id)
        if not punk:
            return {"message": "Punk not found", "status": 404}

        changesets = (
            PunkChangeset.query.filter_by(punk_id=punk_id)
            .order_by(PunkChangeset.created_at.desc())
            .all()
        )

        changeset_list = []
        heatmap_points = []
        hashtag_counts = {}
        total_changes = 0

        for cs in changesets:
            changeset_list.append({
                "changeset_id": cs.changeset_id,
                "created_at": cs.created_at.isoformat() if cs.created_at else None,
                "closed_at": cs.closed_at.isoformat() if cs.closed_at else None,
                "changes_count": cs.changes_count or 0,
                "comment": cs.comment,
                "editor": cs.editor,
                "source": cs.source,
                "centroid_lat": cs.centroid_lat,
                "centroid_lon": cs.centroid_lon,
                "hashtags": cs.hashtags or [],
            })

            total_changes += cs.changes_count or 0

            # Heatmap points
            if cs.centroid_lat is not None and cs.centroid_lon is not None:
                weight = cs.changes_count if cs.changes_count else 1
                heatmap_points.append([cs.centroid_lat, cs.centroid_lon, weight])

            # Hashtag summary
            for ht in (cs.hashtags or []):
                ht_clean = ht.strip().lower()
                if ht_clean:
                    hashtag_counts[ht_clean] = hashtag_counts.get(ht_clean, 0) + 1

        # Sort hashtags by count descending
        hashtag_summary = [
            {"hashtag": k, "count": v}
            for k, v in sorted(hashtag_counts.items(), key=lambda x: -x[1])
        ]

        punk_info = {
            "id": punk.id,
            "osm_username": punk.osm_username,
            "osm_uid": punk.osm_uid,
            "notes": punk.notes,
            "tags": punk.tags or [],
            "added_by": punk.added_by,
            "added_by_name": punk.added_by_name,
            "created_at": punk.created_at.isoformat() if punk.created_at else None,
            "cached_total_changesets": punk.cached_total_changesets,
            "cached_last_active": (
                punk.cached_last_active.isoformat() if punk.cached_last_active else None
            ),
            "cached_account_created": (
                punk.cached_account_created.isoformat()
                if punk.cached_account_created
                else None
            ),
            "cache_updated_at": (
                punk.cache_updated_at.isoformat() if punk.cache_updated_at else None
            ),
        }

        return {
            "status": 200,
            "punk": punk_info,
            "changesets": changeset_list,
            "heatmapPoints": heatmap_points,
            "hashtagSummary": hashtag_summary,
            "summary": {
                "totalChangesets": len(changeset_list),
                "totalChanges": total_changes,
            },
        }

    # ─── Refresh punk activity ───────────────────────────

    @requires_admin
    def refresh_punk_activity(self):
        """Fetch latest changeset data from OSM API and update cache."""
        data = request.json or {}
        punk_id = data.get("punk_id")
        if not punk_id:
            return {"message": "punk_id is required", "status": 400}

        punk = Punk.query.get(punk_id)
        if not punk:
            return {"message": "Punk not found", "status": 404}

        try:
            self._refresh_punk(punk)
        except Exception as e:
            current_app.logger.error(f"Failed to refresh punk '{punk.osm_username}': {e}")
            return {"message": f"OSM API error: {str(e)}", "status": 502}

        return {"status": 200, "message": f"Activity refreshed for '{punk.osm_username}'"}

    # ─── Internal refresh logic ──────────────────────────

    def _refresh_punk(self, punk):
        """Fetch changesets from OSM API and update the punk's cached data."""
        # 1. Fetch changesets
        url = f"{OSM_API_BASE}/changesets?display_name={punk.osm_username}&limit=100"
        resp = http_requests.get(url, headers=OSM_HEADERS, timeout=OSM_TIMEOUT)
        resp.raise_for_status()

        root = ET.fromstring(resp.content)
        changesets = root.findall("changeset")

        # 2. Extract uid from first changeset
        uid = None
        if changesets:
            uid_str = changesets[0].get("uid")
            if uid_str:
                uid = int(uid_str)

        # 3. Upsert changesets
        existing_ids = set()
        existing_rows = PunkChangeset.query.filter_by(punk_id=punk.id).all()
        for row in existing_rows:
            existing_ids.add(row.changeset_id)

        latest_closed = None
        new_count = 0

        for cs_elem in changesets:
            cs_id = int(cs_elem.get("id"))
            if cs_id in existing_ids:
                continue

            created_at_str = cs_elem.get("created_at")
            closed_at_str = cs_elem.get("closed_at")
            changes_count_str = cs_elem.get("changes_count", "0")

            created_at = (
                datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                if created_at_str
                else datetime.utcnow()
            )
            closed_at = (
                datetime.fromisoformat(closed_at_str.replace("Z", "+00:00"))
                if closed_at_str
                else None
            )
            changes_count = int(changes_count_str) if changes_count_str else 0

            # Compute centroid from bbox
            min_lat = cs_elem.get("min_lat")
            max_lat = cs_elem.get("max_lat")
            min_lon = cs_elem.get("min_lon")
            max_lon = cs_elem.get("max_lon")
            centroid_lat = None
            centroid_lon = None
            if min_lat and max_lat and min_lon and max_lon:
                centroid_lat = (float(min_lat) + float(max_lat)) / 2
                centroid_lon = (float(min_lon) + float(max_lon)) / 2

            # Extract tags
            tags = {}
            for tag_elem in cs_elem.findall("tag"):
                tags[tag_elem.get("k")] = tag_elem.get("v")

            comment = tags.get("comment")
            editor = tags.get("created_by")
            source_val = tags.get("source")
            hashtags_raw = tags.get("hashtags", "")
            hashtags = (
                [h.strip() for h in hashtags_raw.split(";") if h.strip()]
                if hashtags_raw
                else []
            )

            pc = PunkChangeset(
                punk_id=punk.id,
                changeset_id=cs_id,
                created_at=created_at,
                closed_at=closed_at,
                changes_count=changes_count,
                comment=comment,
                editor=editor,
                source=source_val,
                centroid_lat=centroid_lat,
                centroid_lon=centroid_lon,
                hashtags=hashtags if hashtags else None,
            )
            db.session.add(pc)
            new_count += 1

            # Track latest closed_at
            if closed_at and (latest_closed is None or closed_at > latest_closed):
                latest_closed = closed_at

        if new_count > 0:
            db.session.flush()

        # 4. Try to fetch user profile for account_created and total changesets
        account_created = None
        total_changesets = None
        if uid:
            try:
                user_url = f"{OSM_API_BASE}/user/{uid}"
                user_resp = http_requests.get(
                    user_url, headers=OSM_HEADERS, timeout=OSM_TIMEOUT
                )
                if user_resp.status_code == 200:
                    user_root = ET.fromstring(user_resp.content)
                    user_elem = user_root.find("user")
                    if user_elem is not None:
                        acct_str = user_elem.get("account_created")
                        if acct_str:
                            account_created = datetime.fromisoformat(
                                acct_str.replace("Z", "+00:00")
                            )
                        cs_elem = user_elem.find("changesets")
                        if cs_elem is not None:
                            count_str = cs_elem.get("count")
                            if count_str:
                                total_changesets = int(count_str)
            except Exception as e:
                current_app.logger.warning(
                    f"Failed to fetch OSM user profile for uid {uid}: {e}"
                )

        # 5. Update punk cached fields
        punk.osm_uid = uid
        if total_changesets is not None:
            punk.cached_total_changesets = total_changesets
        if account_created is not None:
            punk.cached_account_created = account_created

        # Determine last active from cached changesets
        last_active_row = (
            PunkChangeset.query.filter_by(punk_id=punk.id)
            .order_by(PunkChangeset.created_at.desc())
            .first()
        )
        if last_active_row:
            punk.cached_last_active = last_active_row.created_at

        punk.cache_updated_at = datetime.utcnow()
        db.session.commit()
