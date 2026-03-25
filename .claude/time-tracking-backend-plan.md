# Time Tracking Backend Implementation Plan

## Context

The Global Time Tracking feature (Trello card: `698515c86acf084a29def456`) needs backend support. The frontend UI is already built on branch `feature/trello-698515c86acf084a29def456-time-tracking` with mock data — `TimeTrackingWidget` (clock in/out for all roles) and `AdminTimeManagement` (active sessions table, history with edit/void). Stakeholders (Aaron, Keeley) have approved the UI direction and are waiting for backend integration so we can test in a production-like setting.

The system tracks contractor clock in/out times in UTC, correlates with OpenStreetMap changesets, and provides admin oversight.

---

## Step 1: Database Model + Migration

### 1a. Add `time_tracking_required` to User model

**File**: `backend/api/database/core.py` — add to User class:

```python
time_tracking_required = db.Column(db.Boolean, nullable=False, default=False, server_default="False")
```

### 1b. Create `TimeEntry` model

**File**: `backend/api/database/core.py` — new model:

```python
class TimeEntry(CRUDMixin, db.Model):
    __tablename__ = "time_entries"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(255), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    org_id = db.Column(db.String(255), nullable=True, index=True)
    category = db.Column(db.String(50), nullable=False)  # mapping|validation|review|training|other
    clock_in = db.Column(db.DateTime, nullable=False, default=func.now())
    clock_out = db.Column(db.DateTime, nullable=True)
    duration_seconds = db.Column(db.Integer, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="active", server_default="active")  # active|completed|voided
    changeset_count = db.Column(db.Integer, nullable=True, default=0)
    changes_count = db.Column(db.Integer, nullable=True, default=0)
    voided_by = db.Column(db.String(255), nullable=True)
    voided_at = db.Column(db.DateTime, nullable=True)
    edited_by = db.Column(db.String(255), nullable=True)
    edited_at = db.Column(db.DateTime, nullable=True)
    force_clocked_out_by = db.Column(db.String(255), nullable=True)
    notes = db.Column(db.Text, nullable=True)

    __table_args__ = (
        db.Index("ix_time_entries_user_status", "user_id", "status"),
        db.Index("ix_time_entries_org_status", "org_id", "status"),
    )
```

**Design decisions**:
- Uses `CRUDMixin, db.Model` (NOT `ModelWithSoftDeleteAndCRUD`) — voided entries tracked by `status` column, not soft-delete
- `ondelete="CASCADE"` for user (entries go with user), `"SET NULL"` for project (entries survive project deletion)
- `duration_seconds` stored on clock_out for efficient queries
- `org_id` denormalized from user for admin queries (matches `PayRequests` pattern)
- Composite indexes for "find active session" and "all org active sessions" queries

### 1c. Export and migrate

- Export `TimeEntry` from `backend/api/database/__init__.py`
- Run: `flask db migrate -m "add time tracking"` then `flask db upgrade`

---

## Step 2: API View — Clock In/Out

**New file**: `backend/api/views/TimeTracking.py`

Flask MethodView following existing patterns (same as `Checklists.py`, `Users.py`). All endpoints via POST (matching existing codebase pattern where reads are also POST — e.g. `fetch_admin_checklists`).

### Endpoints:

**`POST /api/timetracking/clock_in`**
- Auth: any authenticated user
- Body: `{ "project_id": int, "category": str }`
- Validates: no existing active session, valid category, valid project_id
- Creates TimeEntry with `status="active"`, `clock_in=datetime.utcnow()`
- Returns: `{ "status": 200, "message": "Clocked in successfully", "session_id": id }`

**`POST /api/timetracking/clock_out`**
- Auth: any authenticated user
- Body: `{ "session_id": int (optional) }`
- Finds active entry for user (or by session_id)
- Sets `clock_out`, calculates `duration_seconds`, sets `status="completed"`
- Calls OSM changeset fetch (Step 3) — best-effort, doesn't block clock_out on failure
- Returns: `{ "status": 200, "message": "Clocked out successfully", "duration_seconds": int }`

**`POST /api/timetracking/my_active_session`**
- Auth: any authenticated user
- Returns user's active session or null
- Returns: `{ "status": 200, "session": TimeEntry | null }`

**`POST /api/timetracking/my_history`**
- Auth: any authenticated user
- Returns user's completed/voided entries
- Returns: `{ "status": 200, "entries": TimeEntry[] }`

### Response format (TimeEntry):
```json
{
  "id": 1,
  "userName": "Jane Smith",
  "projectName": "PP - Cebu City South",
  "category": "Validation",
  "clockIn": "2026-02-09T10:30:00Z",
  "clockOut": "2026-02-09T14:30:00Z",
  "duration": "04:00:00",
  "status": "completed",
  "changesetCount": 3,
  "changesCount": 45
}
```

### Registration:
- Import in `backend/api/views/__init__.py`
- Register in `backend/app.py`: `app.add_url_rule("/api/timetracking/<path>", view_func=TimeTrackingAPI.as_view("timetracking"))`

---

## Step 3: OSM Changeset Integration

**Private method in `TimeTrackingAPI`**: `_fetch_osm_changesets(osm_username, clock_in_time)`

- Endpoint: `https://api.openstreetmap.org/api/0.6/changesets.json?display_name=USERNAME&time=CLOCK_IN_TIME`
- Returns JSON with `changesets` array
- Extracts: `changeset_count` (len) and `changes_count` (sum of `changes_count` field)
- Error handling: 3 retries with exponential backoff for rate limits (HTTP 429)
- On failure: returns (0, 0) — clock_out still succeeds, changeset data is best-effort
- Uses `requests` library (already in requirements.txt)
- Uses user's `osm_username` from `g.user.osm_username` (already verified via existing OSM OAuth flow in `OSMAuth.py`)
- 30 second timeout (matching existing codebase pattern)

---

## Step 4: Admin Endpoints

**Added to same `TimeTracking.py` view**:

**`POST /api/timetracking/active_sessions`** (admin only)
- Query: `TimeEntry.query.filter_by(org_id=g.user.org_id, status="active").all()`
- Joins User + Project for names
- Returns: `{ "status": 200, "sessions": TimeEntry[] }`

**`POST /api/timetracking/history`** (admin only)
- Query: all non-active entries for org, ordered by `clock_in` desc, limit 100
- Returns: `{ "status": 200, "entries": TimeEntry[] }`

**`POST /api/timetracking/force_clock_out`** (admin only)
- Body: `{ "session_id": int }`
- Sets clock_out, duration, status="completed", `force_clocked_out_by=g.user.id`
- Fetches OSM changesets
- Returns: `{ "status": 200, "message": "Force clock out successful" }`

**`POST /api/timetracking/void_entry`** (admin only)
- Body: `{ "entry_id": int }`
- Sets `status="voided"`, `voided_by`, `voided_at`
- Returns: `{ "status": 200, "message": "Entry voided" }`

**`POST /api/timetracking/edit_entry`** (admin only)
- Body: `{ "entry_id": int, "clockIn": str, "clockOut": str, "category": str }`
- Parses ISO strings, recalculates duration, validates category
- Sets `edited_by`, `edited_at`
- Returns: `{ "status": 200, "message": "Entry updated" }`

---

## Step 5: Frontend Hooks + Types

### 5a. Types

**File**: `frontend/mikro-next/src/types/index.ts` — add TimeEntry interface

### 5b. Hooks

**File**: `frontend/mikro-next/src/hooks/useApi.ts` — add hooks using existing `useApiCall`/`useApiMutation` patterns:

- `useClockIn()` → mutation → `/timetracking/clock_in`
- `useClockOut()` → mutation → `/timetracking/clock_out`
- `useActiveTimeSession()` → call → `/timetracking/my_active_session`
- `useMyTimeHistory()` → call → `/timetracking/my_history`
- `useAdminActiveSessions()` → call → `/timetracking/active_sessions`
- `useAdminTimeHistory()` → call → `/timetracking/history`
- `useForceClockOut()` → mutation → `/timetracking/force_clock_out`
- `useVoidTimeEntry()` → mutation → `/timetracking/void_entry`
- `useEditTimeEntry()` → mutation → `/timetracking/edit_entry`

---

## Step 6: Wire TimeTrackingWidget

**File**: `frontend/mikro-next/src/components/widgets/TimeTrackingWidget.tsx`

Changes:
1. Import `useClockIn`, `useClockOut`, `useActiveTimeSession`
2. On mount: check for existing active session (restores state on page refresh)
3. Replace `onClockIn` callback → call `useClockIn` mutation with `{ project_id, category }`
4. Replace `onClockOut` callback → call `useClockOut` mutation
5. Remove `onClockIn`/`onClockOut` props (widget becomes self-contained)
6. Add error handling

---

## Step 7: Wire AdminTimeManagement

**File**: `frontend/mikro-next/src/components/widgets/AdminTimeManagement.tsx`

Changes:
1. Replace `MOCK_ACTIVE_SESSIONS` → `useAdminActiveSessions()` hook
2. Replace `MOCK_RECENT_ENTRIES` → `useAdminTimeHistory()` hook
3. Wire `handleForceClockOut` → `useForceClockOut` mutation + refetch
4. Wire `handleVoidEntry` → `useVoidTimeEntry` mutation + refetch
5. Wire `handleEditEntry` → `useEditTimeEntry` mutation + refetch
6. Add auto-refresh for active sessions (poll every 60s for live duration updates)

---

## Step 8: Dashboard Cleanup

**Files**:
- `frontend/mikro-next/src/app/(authenticated)/admin/dashboard/page.tsx`
- `frontend/mikro-next/src/app/(authenticated)/user/dashboard/page.tsx`
- `frontend/mikro-next/src/app/(authenticated)/validator/dashboard/page.tsx`

Remove console.log `onClockIn`/`onClockOut` callbacks — widget handles its own API calls now.

---

## Files Modified (Summary)

| File | Change |
|------|--------|
| `backend/api/database/core.py` | Add TimeEntry model, add time_tracking_required to User |
| `backend/api/database/__init__.py` | Export TimeEntry |
| `backend/api/views/TimeTracking.py` | **NEW** — all 9 endpoints + OSM changeset helper |
| `backend/api/views/__init__.py` | Import TimeTrackingAPI |
| `backend/app.py` | Register `/api/timetracking/<path>` route |
| `backend/migrations/versions/...` | Auto-generated migration |
| `frontend/mikro-next/src/types/index.ts` | Add TimeEntry interface |
| `frontend/mikro-next/src/hooks/useApi.ts` | Add 9 time tracking hooks |
| `frontend/mikro-next/src/components/widgets/TimeTrackingWidget.tsx` | Replace mock callbacks with real API |
| `frontend/mikro-next/src/components/widgets/AdminTimeManagement.tsx` | Replace mock data with real API |
| `frontend/mikro-next/src/app/(authenticated)/admin/dashboard/page.tsx` | Remove callback props |
| `frontend/mikro-next/src/app/(authenticated)/user/dashboard/page.tsx` | Remove callback props |
| `frontend/mikro-next/src/app/(authenticated)/validator/dashboard/page.tsx` | Remove callback props |

---

## Verification Plan

1. **Database**: After migration, verify `time_entries` table exists and `users.time_tracking_required` column exists
2. **Clock In**: POST to `/api/timetracking/clock_in` with valid JWT, verify entry created with `status="active"`
3. **Clock Out**: POST to `/api/timetracking/clock_out`, verify entry updated to `status="completed"` with duration
4. **Double Clock In**: Attempt second clock_in while active — should return error
5. **OSM Integration**: Clock in, make OSM edit, clock out — verify `changeset_count` and `changes_count` populated
6. **Admin Active Sessions**: Verify admin can see all org users' active sessions
7. **Admin History**: Verify admin can see completed/voided entries
8. **Force Clock Out**: Admin force-clocks out another user, verify `force_clocked_out_by` populated
9. **Void Entry**: Admin voids an entry, verify `status="voided"` and entry remains in history
10. **Edit Entry**: Admin edits clock_in/clock_out times, verify duration recalculated
11. **Frontend**: Clock in via UI, refresh page, verify session restored. Clock out, verify confirmation shows.
12. **Admin UI**: Verify active sessions table shows real data, History tab shows real data, Edit/Void buttons work

---

## Trello Image Display Fix (for next time)

Current issue: Trello markdown `![alt](url)` renders images inline at card width — not expandable.

**Fix for next upload**: Use `[![alt](url)](url)` format — wraps the image in a clickable link that opens the full-size image in a new tab. Or use the Trello attachment API to attach images directly to the card (attachments are expandable in Trello's lightbox viewer).
