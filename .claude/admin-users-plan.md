# Plan: Admin Users Page Improvements

## Changes Requested

1. **Search bar** for user names (same style as projects page)
2. **Sortable columns** in user table (where it makes sense)
3. **OSM username column** in the table
4. **Consolidate edit user modal** — expose more admin-editable fields
5. **Add user modal info** — note that users with existing Kaart login can use those credentials directly

---

## 1. Search Bar

Add a text search input above the table (same placement/style as projects page) that filters by:
- `name` (first + last)
- `osm_username`
- `email` (useful for admin lookups)

**Files:** `page.tsx` only (client-side filter, same pattern as projects)

---

## 2. Sortable Columns

Current columns: Name, Role, Country, Region, Timezone, Projects, Mapped, Validated, Invalidated, Awaiting Payment, Total Paid

**Make sortable:**
- Name (alpha)
- Role (admin > validator > user)
- Country (alpha)
- Region (alpha)
- Projects (numeric)
- Mapped (numeric)
- Validated (numeric)
- Total Paid (numeric)

**Not sortable:** Timezone, Invalidated, Awaiting Payment (less useful for ordering)

**Implementation:** Same pattern as projects page — `sortKey`/`sortDir` state, `sortUsers()` function, clickable column headers with arrow indicator.

**Files:** `page.tsx` only

---

## 3. OSM Username Column

Add `osm_username` as a column in the table between Name and Role. The backend already returns `osm_username` — wait, checking... **No, `fetch_users` does NOT return `osm_username`.** Need to add it.

**Files:**
- `backend/api/views/Users.py` — add `"osm_username": user.osm_username` to `fetch_users` response (~line 470)
- `page.tsx` — add column

---

## 4. Consolidate Edit User Modal

Current edit modal only has: **role, first_name, last_name** (3 fields).

Backend has TWO update endpoints:
- `do_modify_users` (admin): role, first_name, last_name
- `admin_update_user_profile` (admin): countryId, timezone, mapillary_username

**Plan:** Merge into one modal with all editable fields:
- First Name, Last Name (existing)
- Role (existing)
- OSM Username
- Email
- Timezone (dropdown or text)
- Country (dropdown from countries list)
- Mapillary Username

**Backend change needed:** Extend `do_modify_users` to accept additional fields (osm_username, email, timezone, country, mapillary_username) so we only need one API call. Or call both endpoints from the frontend.

**Simpler approach:** Call `do_modify_users` for role/name, then `admin_update_user_profile` for country/timezone/mapillary. Two calls but no backend changes.

**For OSM username + email:** These aren't in either admin endpoint. Need to add them to `do_modify_users`.

**Files:**
- `backend/api/views/Users.py` — extend `do_modify_users` to accept osm_username, email, timezone, country_id, mapillary_username
- `page.tsx` — expand edit modal form, update handler

---

## 5. Add User Modal Info

Current add user modal just has an email field + invite button.

**Add a note/callout** explaining: "If this user already has a Kaart login, they can use those same credentials to log into Mikro — no password change needed."

**Files:** `page.tsx` only (just add an info text block)

---

## Implementation Order

1. Backend: add osm_username to fetch_users response + extend do_modify_users
2. Frontend: search bar
3. Frontend: sortable columns + OSM username column
4. Frontend: expand edit modal
5. Frontend: add user modal info note

## Files to Modify

- `backend/api/views/Users.py`
- `frontend/mikro-next/src/app/(authenticated)/admin/users/page.tsx`
