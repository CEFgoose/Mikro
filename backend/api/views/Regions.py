#!/usr/bin/env python3
"""
Region & Country API endpoints for Mikro.

Handles geographic region/country CRUD, user-country assignments,
and filter options for the universal FilterBar.
"""

from flask.views import MethodView
from flask import g, request

from ..utils import requires_admin
from ..database import (
    db,
    Region,
    Country,
    UserCountry,
    User,
    Team,
    TeamUser,
)


class RegionAPI(MethodView):
    """Region/Country management and filter options API."""

    def post(self, path: str):
        # Region CRUD
        if path == "fetch_regions":
            return self.fetch_regions()
        elif path == "create_region":
            return self.create_region()
        elif path == "update_region":
            return self.update_region()
        elif path == "delete_region":
            return self.delete_region()
        # Country CRUD
        elif path == "fetch_countries":
            return self.fetch_countries()
        elif path == "create_country":
            return self.create_country()
        elif path == "update_country":
            return self.update_country()
        elif path == "delete_country":
            return self.delete_country()
        # User-country assignments
        elif path == "assign_user_country":
            return self.assign_user_country()
        elif path == "unassign_user_country":
            return self.unassign_user_country()
        # Filter options
        elif path == "fetch_filter_options":
            return self.fetch_filter_options()
        # Seed
        elif path == "seed_defaults":
            return self.seed_defaults()
        return {"message": "Unknown path", "status": 404}

    # ─── Regions ──────────────────────────────────────────

    @requires_admin
    def fetch_regions(self):
        """List all regions with their countries."""
        regions = Region.query.order_by(Region.name).all()
        result = []
        for r in regions:
            countries = (
                Country.query.filter_by(region_id=r.id)
                .order_by(Country.name)
                .all()
            )
            result.append({
                "id": r.id,
                "name": r.name,
                "org_id": r.org_id,
                "countries": [
                    {
                        "id": c.id,
                        "name": c.name,
                        "iso_code": c.iso_code,
                        "default_timezone": c.default_timezone,
                        "user_count": UserCountry.query.filter_by(
                            country_id=c.id
                        ).count(),
                    }
                    for c in countries
                ],
            })
        return {"status": 200, "regions": result}

    @requires_admin
    def create_region(self):
        """Create a new region."""
        name = (request.json.get("name") or "").strip()
        if not name:
            return {"message": "Region name is required", "status": 400}

        existing = Region.query.filter_by(name=name).first()
        if existing:
            return {"message": f"Region '{name}' already exists", "status": 400}

        region = Region.create(name=name, org_id=g.user.org_id)
        return {
            "status": 200,
            "message": f"Region '{name}' created",
            "region": {"id": region.id, "name": region.name},
        }

    @requires_admin
    def update_region(self):
        """Update a region's name."""
        region_id = request.json.get("regionId")
        name = (request.json.get("name") or "").strip()
        if not region_id or not name:
            return {"message": "regionId and name are required", "status": 400}

        region = Region.query.get(region_id)
        if not region:
            return {"message": "Region not found", "status": 404}

        region.update(name=name)
        return {"status": 200, "message": f"Region updated to '{name}'"}

    @requires_admin
    def delete_region(self):
        """Delete a region. Countries in this region will have region_id set to NULL."""
        region_id = request.json.get("regionId")
        if not region_id:
            return {"message": "regionId is required", "status": 400}

        region = Region.query.get(region_id)
        if not region:
            return {"message": "Region not found", "status": 404}

        # Unlink countries from this region
        Country.query.filter_by(region_id=region_id).update(
            {"region_id": None}
        )
        region.delete(soft=False)
        return {"status": 200, "message": "Region deleted"}

    # ─── Countries ────────────────────────────────────────

    @requires_admin
    def fetch_countries(self):
        """List all countries with region info."""
        countries = Country.query.order_by(Country.name).all()
        result = []
        for c in countries:
            region = Region.query.get(c.region_id) if c.region_id else None
            result.append({
                "id": c.id,
                "name": c.name,
                "iso_code": c.iso_code,
                "region_id": c.region_id,
                "region_name": region.name if region else None,
                "default_timezone": c.default_timezone,
                "user_count": UserCountry.query.filter_by(country_id=c.id).count(),
            })
        return {"status": 200, "countries": result}

    @requires_admin
    def create_country(self):
        """Create a new country."""
        name = (request.json.get("name") or "").strip()
        iso_code = (request.json.get("isoCode") or "").strip().upper() or None
        region_id = request.json.get("regionId")
        default_timezone = (request.json.get("defaultTimezone") or "").strip() or None

        if not name:
            return {"message": "Country name is required", "status": 400}

        if iso_code:
            existing = Country.query.filter_by(iso_code=iso_code).first()
            if existing:
                return {
                    "message": f"Country with ISO code '{iso_code}' already exists",
                    "status": 400,
                }

        country = Country.create(
            name=name,
            iso_code=iso_code,
            region_id=region_id,
            default_timezone=default_timezone,
            org_id=g.user.org_id,
        )
        return {
            "status": 200,
            "message": f"Country '{name}' created",
            "country": {"id": country.id, "name": country.name},
        }

    @requires_admin
    def update_country(self):
        """Update country details."""
        country_id = request.json.get("countryId")
        if not country_id:
            return {"message": "countryId is required", "status": 400}

        country = Country.query.get(country_id)
        if not country:
            return {"message": "Country not found", "status": 404}

        updates = {}
        if "name" in request.json:
            updates["name"] = request.json["name"].strip()
        if "isoCode" in request.json:
            updates["iso_code"] = (request.json["isoCode"] or "").strip().upper() or None
        if "regionId" in request.json:
            updates["region_id"] = request.json["regionId"]
        if "defaultTimezone" in request.json:
            updates["default_timezone"] = (
                request.json["defaultTimezone"] or ""
            ).strip() or None

        if updates:
            country.update(**updates)
        return {"status": 200, "message": "Country updated"}

    @requires_admin
    def delete_country(self):
        """Delete a country and its user-country associations."""
        country_id = request.json.get("countryId")
        if not country_id:
            return {"message": "countryId is required", "status": 400}

        country = Country.query.get(country_id)
        if not country:
            return {"message": "Country not found", "status": 404}

        # Remove user-country associations (CASCADE should handle this, but be explicit)
        UserCountry.query.filter_by(country_id=country_id).delete()
        # Clear country_id on users who have this as their primary
        User.query.filter_by(country_id=country_id).update({"country_id": None})
        country.delete(soft=False)
        return {"status": 200, "message": "Country deleted"}

    # ─── User-Country Assignments ─────────────────────────

    @requires_admin
    def assign_user_country(self):
        """Assign a user to a country."""
        user_id = request.json.get("userId")
        country_id = request.json.get("countryId")
        is_primary = request.json.get("isPrimary", True)

        if not user_id or not country_id:
            return {"message": "userId and countryId are required", "status": 400}

        # Check if already assigned
        existing = UserCountry.query.filter_by(
            user_id=user_id, country_id=country_id
        ).first()
        if existing:
            return {"message": "User already assigned to this country", "status": 400}

        UserCountry.create(
            user_id=user_id, country_id=country_id, is_primary=is_primary
        )

        # Also set the user's country_id if this is primary
        if is_primary:
            user = User.query.get(user_id)
            if user:
                country = Country.query.get(country_id)
                updates = {"country_id": country_id}
                # Auto-set timezone from country default if user has none
                if country and country.default_timezone and not user.timezone:
                    updates["timezone"] = country.default_timezone
                user.update(**updates)

        return {"status": 200, "message": "User assigned to country"}

    @requires_admin
    def unassign_user_country(self):
        """Remove a user from a country."""
        user_id = request.json.get("userId")
        country_id = request.json.get("countryId")

        if not user_id or not country_id:
            return {"message": "userId and countryId are required", "status": 400}

        record = UserCountry.query.filter_by(
            user_id=user_id, country_id=country_id
        ).first()
        if not record:
            return {"message": "Assignment not found", "status": 404}

        record.delete(soft=False)

        # If this was the user's primary country, clear it
        user = User.query.get(user_id)
        if user and user.country_id == country_id:
            user.update(country_id=None)

        return {"status": 200, "message": "User unassigned from country"}

    # ─── Filter Options ───────────────────────────────────

    @requires_admin
    def fetch_filter_options(self):
        """
        Return all available filter dimensions and their values.
        Used by the frontend FilterBar to populate dropdowns.
        """
        org_id = g.user.org_id

        # Countries
        countries = Country.query.order_by(Country.name).all()
        country_options = [
            {
                "id": c.id,
                "name": c.name,
                "region_id": c.region_id,
            }
            for c in countries
        ]

        # Regions
        regions = Region.query.order_by(Region.name).all()
        region_options = [{"id": r.id, "name": r.name} for r in regions]

        # Teams
        teams = Team.query.order_by(Team.name).all()
        team_options = [{"id": t.id, "name": t.name} for t in teams]

        # Roles — distinct roles from users in this org
        role_rows = (
            db.session.query(User.role)
            .filter(User.org_id == org_id, User.role != None)
            .distinct()
            .all()
        )
        role_options = sorted([r.role for r in role_rows])

        # Timezones — distinct timezones from users in this org
        tz_rows = (
            db.session.query(User.timezone)
            .filter(User.org_id == org_id, User.timezone != None)
            .distinct()
            .all()
        )
        timezone_options = sorted([r.timezone for r in tz_rows])

        return {
            "status": 200,
            "dimensions": {
                "country": country_options,
                "region": region_options,
                "team": team_options,
                "role": role_options,
                "timezone": timezone_options,
            },
        }

    # ─── Seed Defaults ────────────────────────────────────

    @requires_admin
    def seed_defaults(self):
        """Seed default regions and countries. Idempotent — skips existing."""
        defaults = {
            "Latin America": [
                ("Colombia", "COL", "America/Bogota"),
                ("Peru", "PER", "America/Lima"),
                ("Brazil", "BRA", "America/Sao_Paulo"),
                ("Mexico", "MEX", "America/Mexico_City"),
                ("Chile", "CHL", "America/Santiago"),
                ("Argentina", "ARG", "America/Argentina/Buenos_Aires"),
                ("Ecuador", "ECU", "America/Guayaquil"),
                ("Bolivia", "BOL", "America/La_Paz"),
                ("Paraguay", "PRY", "America/Asuncion"),
                ("Uruguay", "URY", "America/Montevideo"),
                ("Venezuela", "VEN", "America/Caracas"),
                ("Panama", "PAN", "America/Panama"),
                ("Costa Rica", "CRI", "America/Costa_Rica"),
                ("Guatemala", "GTM", "America/Guatemala"),
                ("Honduras", "HND", "America/Tegucigalpa"),
                ("El Salvador", "SLV", "America/El_Salvador"),
                ("Nicaragua", "NIC", "America/Managua"),
            ],
            "East Africa": [
                ("Kenya", "KEN", "Africa/Nairobi"),
                ("Tanzania", "TZA", "Africa/Dar_es_Salaam"),
                ("Uganda", "UGA", "Africa/Kampala"),
                ("Rwanda", "RWA", "Africa/Kigali"),
                ("Ethiopia", "ETH", "Africa/Addis_Ababa"),
                ("Mozambique", "MOZ", "Africa/Maputo"),
                ("Madagascar", "MDG", "Indian/Antananarivo"),
            ],
            "West Africa": [
                ("Nigeria", "NGA", "Africa/Lagos"),
                ("Ghana", "GHA", "Africa/Accra"),
                ("Senegal", "SEN", "Africa/Dakar"),
                ("Mali", "MLI", "Africa/Bamako"),
                ("Cameroon", "CMR", "Africa/Douala"),
                ("Ivory Coast", "CIV", "Africa/Abidjan"),
            ],
            "Southern Africa": [
                ("South Africa", "ZAF", "Africa/Johannesburg"),
                ("Botswana", "BWA", "Africa/Gaborone"),
                ("Zimbabwe", "ZWE", "Africa/Harare"),
                ("Zambia", "ZMB", "Africa/Lusaka"),
                ("Namibia", "NAM", "Africa/Windhoek"),
            ],
            "Southeast Asia": [
                ("Philippines", "PHL", "Asia/Manila"),
                ("Indonesia", "IDN", "Asia/Jakarta"),
                ("Vietnam", "VNM", "Asia/Ho_Chi_Minh"),
                ("Cambodia", "KHM", "Asia/Phnom_Penh"),
                ("Thailand", "THA", "Asia/Bangkok"),
                ("Myanmar", "MMR", "Asia/Yangon"),
                ("Malaysia", "MYS", "Asia/Kuala_Lumpur"),
            ],
            "South Asia": [
                ("India", "IND", "Asia/Kolkata"),
                ("Bangladesh", "BGD", "Asia/Dhaka"),
                ("Nepal", "NPL", "Asia/Kathmandu"),
                ("Sri Lanka", "LKA", "Asia/Colombo"),
            ],
            "Central Asia": [
                ("Uzbekistan", "UZB", "Asia/Tashkent"),
                ("Kazakhstan", "KAZ", "Asia/Almaty"),
                ("Kyrgyzstan", "KGZ", "Asia/Bishkek"),
                ("Tajikistan", "TJK", "Asia/Dushanbe"),
            ],
        }

        created_regions = 0
        created_countries = 0

        for region_name, country_list in defaults.items():
            region = Region.query.filter_by(name=region_name).first()
            if not region:
                region = Region.create(name=region_name, org_id=g.user.org_id)
                created_regions += 1

            for country_name, iso_code, tz in country_list:
                existing = Country.query.filter_by(iso_code=iso_code).first()
                if not existing:
                    Country.create(
                        name=country_name,
                        iso_code=iso_code,
                        region_id=region.id,
                        default_timezone=tz,
                        org_id=g.user.org_id,
                    )
                    created_countries += 1

        return {
            "status": 200,
            "message": f"Seeded {created_regions} regions and {created_countries} countries",
            "created_regions": created_regions,
            "created_countries": created_countries,
        }
