# Time Tracking Page — Implementation Plan

## Overview

Build dedicated Time Tracking pages for **users** (`/user/time`) and **admins** (`/admin/time`) with full history, filtering, and export capabilities. Consolidates time management into a proper page rather than dashboard widgets.

---

## What Exists Today

| Component | Location | What It Does |
|-----------|----------|--------------|
| TimeTrackingWidget | `components/widgets/TimeTrackingWidget.tsx` | Clock in/out UI (used on both dashboards) |
| AdminTimeManagement | `components/widgets/AdminTimeManagement.tsx` | Active sessions + history table, edit/void/add modals |
| UserTimeHistory | `components/widgets/UserTimeHistory.tsx` | Last 5 entries + "View All" modal, adjustment requests |
| FilterBar | `components/filters/FilterBar.tsx` | Reusable multi-dimension filter chip system |
| useFilters hook | `hooks/useApi.ts` | Filter state management (activeFilters, filtersBody) |
| useFetchFilterOptions | `hooks/useApi.ts` | Fetches available filter dimensions (teams, users, regions) |
| Backend endpoints | `views/TimeTracking.py` | clock_in/out, history (last 100, no filters), edit, void, add |
| Backend reports | `views/Reports.py` | fetch_timekeeping_stats (date range + filters, aggregated stats) |

### Key Limitation
The current `/timetracking/history` endpoint returns **last 100 entries with no filtering**. This must be extended.

---

## Phase 1: Backend — Extend History Endpoint

### File: `backend/api/views/TimeTracking.py`

**Modify `/timetracking/history`** to accept optional filters:

```
POST /timetracking/history
{
  "startDate": "2026-01-01",        // optional, ISO date
  "endDate": "2026-03-11",          // optional, ISO date
  "userId": "auth0|abc123",         // optional, single user
  "teamId": 5,                      // optional, filter by team membership
  "category": "mapping",            // optional, filter by category
  "filters": [...],                 // optional, universal filter system (team, user, region)
  "limit": 500,                     // optional, default 500 (up from 100)
  "offset": 0                       // optional, for pagination
}
```

**Query changes:**
- Add date range filter: `TimeEntry.clock_in >= startDate`, `TimeEntry.clock_in < endDate`
- Add user filter: `TimeEntry.user_id == userId`
- Add team filter: join through `TeamUser` to get member IDs
- Add category filter: `TimeEntry.category == category`
- Support universal `filters` array via `resolve_filtered_user_ids()` (already exists in Reports.py)
- Return total count alongside entries for pagination: `{"entries": [...], "total": 1234}`
- Increase default limit to 500, support offset

**Modify `/timetracking/my_history`** similarly:
- Add optional `startDate`, `endDate`, `category` filters
- Increase limit to 500
- Return total count

### New Export Endpoint

**Add `/timetracking/export`** (admin only):

```
POST /timetracking/export
{
  "format": "csv" | "json" | "pdf",
  "startDate": "2026-01-01",
  "endDate": "2026-03-11",
  "filters": [...],                 // same filter system as history
  "userId": "...",
  "teamId": 5,
  "category": "mapping"
}
```

- Uses the exact same filtering logic as the history endpoint
- **CSV**: Standard CSV with headers — User, OSM Username, Project, Category, Clock In, Clock Out, Duration, Status, Changesets, Changes, Notes
- **JSON**: Array of entry objects (same fields)
- **PDF**: Use `reportlab` or `weasyprint` — formatted table with title, date range, filter summary, and entry rows. Include totals row at bottom (total hours, total changesets, total changes).
- Returns file as download (`Content-Disposition: attachment`)

---

## Phase 2: Frontend — User Time Page

### New File: `frontend/mikro-next/src/app/(authenticated)/user/time/page.tsx`

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│  Time Tracking                                       │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Total    │  │ This     │  │ Pending  │          │
│  │ Hours    │  │ Month    │  │ Requests │          │
│  │  142.5h  │  │  28.3h   │  │    2     │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                      │
│  Date Range: [This Month ▾]  Category: [All ▾]      │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │ Date  │ Project │ Cat │ In  │ Out │ Dur │ St │  │
│  │───────│─────────│─────│─────│─────│─────│────│  │
│  │ 3/11  │ Proj 42 │ Map │ 9a  │ 5p  │ 8h  │ ✓ │  │
│  │ 3/10  │ Proj 42 │ Val │ 9a  │ 1p  │ 4h  │ ✓ │  │
│  │ ...   │         │     │     │     │     │    │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  Showing 1-50 of 234       [< Prev] [Next >]        │
└─────────────────────────────────────────────────────┘
```

**Features:**
- **Stat cards**: Total hours (all time), hours this month, pending adjustment requests
- **Simple filters**: Date range picker (preset: This Week / This Month / Last Month / Custom), Category dropdown
- **Full history table**: Date, Project, Category, Clock In, Clock Out, Duration, Status, Actions
- **Actions column**: "Request Adjustment" button (for completed entries without pending requests)
- **Adjustment request**: Inline expandable form with reason textarea (reuse pattern from UserTimeHistory)
- **Pagination**: 50 entries per page, prev/next buttons
- **Status badges**: completed (green), voided (red/strikethrough), adjustment pending (yellow)

**Reuse:**
- Date formatting helpers from `AdminTimeManagement.tsx`
- Adjustment request hook (`useRequestTimeAdjustment`)
- Status badge styling from `UserTimeHistory.tsx`

---

## Phase 3: Frontend — Admin Time Page

### New File: `frontend/mikro-next/src/app/(authenticated)/admin/time/page.tsx`

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  Time Management                          [Export ▾]     │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ ┌──────────┐ │
│  │ Total    │  │ Active   │  │ Adj.     │ │ Voided   │ │
│  │ Hours    │  │ Sessions │  │ Requests │ │ Entries  │ │
│  │  1,842h  │  │    3     │  │    5     │ │   12     │ │
│  └──────────┘  └──────────┘  └──────────┘ └──────────┘ │
│                                                          │
│  Date: [This Month ▾]  [+ Add Filter]  [+ Add Entry]    │
│  [Team: Colombia ×] [User: Jorge ×]                      │
│                                                          │
│  ── Active Sessions (3) ─────────────────────────────    │
│  │ User  │ Project │ Cat │ Started │ Duration │ Act │    │
│  │ Jorge │ Proj 42 │ Map │ 9:00am  │ 2h 15m ● │ ⏹  │    │
│  │ ...                                              │    │
│                                                          │
│  ── History ─────────────────────────────────────────    │
│  │ User │ Proj │ Cat │ In │ Out │ Dur │ St │ Actions │  │
│  │──────│──────│─────│────│─────│─────│────│─────────│  │
│  │ Jorge│ P42  │ Map │ 9a │ 5p  │ 8h  │ ✓  │ ✎  🗑  │  │
│  │ Maria│ P42  │ Val │ 8a │ 4p  │ 8h  │ ✓  │ ✎  🗑  │  │
│  │ ...  │      │     │    │     │     │ ⚠  │ ✎  🗑  │  │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Showing 1-50 of 1,234     [< Prev] [Next >]            │
└──────────────────────────────────────────────────────────┘
```

**Features:**
- **Stat cards**: Total hours (filtered period), active sessions count, pending adjustment requests, voided entries count
- **FilterBar integration**: Reuse existing FilterBar + useFetchFilterOptions + useFilters pattern from Reports page. Dimensions: Team, User, Region, Category
- **Date range picker**: Same preset system (This Week / This Month / Last Month / Custom)
- **Active Sessions section** (collapsible): Live table showing currently clocked-in users with live duration timer and Force Clock Out button
- **History table**: User, Project, Category, Clock In, Clock Out, Duration, Status, Actions
- **Actions column**:
  - Edit button → opens Edit modal (reuse from AdminTimeManagement)
  - Void button → confirmation then void (reuse from AdminTimeManagement)
  - Adjustment request indicator (yellow badge) — clicking opens edit modal with request details shown
- **Add Entry button**: Opens Add Entry modal (reuse from AdminTimeManagement)
- **Pagination**: 50 entries per page
- **Export button** (top right): Dropdown with CSV, JSON, PDF options. Exports current filtered view.

**Reuse:**
- FilterBar component + hooks (from Reports page pattern)
- Edit/Void/Add Entry modals (extract from AdminTimeManagement into shared components or import directly)
- Active sessions table (from AdminTimeManagement)
- Date/time formatting helpers

---

## Phase 4: Export Implementation

### Backend (`/timetracking/export`)

**CSV Export:**
- Use Python `csv` module + `io.StringIO`
- Headers: User, OSM Username, Project, Category, Clock In (UTC), Clock Out (UTC), Duration (hours), Status, Changesets, Changes, Notes
- Return with `Content-Type: text/csv`, `Content-Disposition: attachment; filename="time-report-{date}.csv"`

**JSON Export:**
- Same data as CSV but as JSON array
- Return with `Content-Type: application/json`, `Content-Disposition: attachment; filename="time-report-{date}.json"`

**PDF Export:**
- Use `reportlab` (already common in Python, lightweight)
- **Page 1 header**: "Mikro Time Report", date range, applied filters summary
- **Summary row**: Total hours, total entries, total changesets, total changes
- **Table**: Same columns as CSV, paginated across PDF pages
- **Footer**: Generated timestamp, page numbers
- Return with `Content-Type: application/pdf`

### Frontend

**Export dropdown button** (admin time page only):
```
[Export ▾]
  ├── Download CSV
  ├── Download JSON
  └── Download PDF
```

- On click: POST to `/timetracking/export` with current filters + format
- Trigger browser file download from response blob
- Show loading spinner on button while generating
- Toast on success: "Report downloaded"

---

## Phase 5: Sidebar + Navigation

### Sidebar Updates (`Sidebar.tsx`)

Add "Time" entry for all roles:

**User:** Dashboard → Projects → **Time** → Training → Checklists → Payments → Teams
**Validator:** Dashboard → Projects → **Time** → Training → Checklists → Payments → Teams
**Admin:** Dashboard → Projects → Tasks → **Time** → Training → Checklists → Users → Teams → Payments → Reports → Regions

Icon: Clock icon (new SVG in iconMap)

---

## Implementation Order

| Step | What | Files | Est. Complexity |
|------|------|-------|-----------------|
| 1 | Extend backend history endpoints with filters + pagination | `TimeTracking.py` | Medium |
| 2 | Build User Time page | `user/time/page.tsx` | Medium |
| 3 | Extract shared modals from AdminTimeManagement | `components/time/` | Low |
| 4 | Build Admin Time page | `admin/time/page.tsx` | Medium-High |
| 5 | Add export endpoint (CSV + JSON) | `TimeTracking.py` | Medium |
| 6 | Add PDF export | `TimeTracking.py` + `reportlab` | Medium |
| 7 | Add frontend export button | `admin/time/page.tsx` | Low |
| 8 | Add "Time" to sidebar for all roles | `Sidebar.tsx` | Trivial |
| 9 | Update Trello cards | — | Trivial |

---

## Dependencies

- `reportlab` — Python PDF generation library (add to `requirements.txt`)
- No new frontend dependencies needed
- No database migrations needed (TimeEntry model already has all required fields)
- No new API hooks pattern — follows existing conventions

---

## What Stays on the Dashboard

The dashboard widgets (TimeTrackingWidget for clock in/out, AdminTimeManagement summary, UserTimeHistory compact view) **remain unchanged**. The new Time pages are the full-featured versions. The dashboard widgets serve as quick-access shortcuts.

---

## Open Questions

1. **Pagination size**: 50 entries per page — good default? Or should it be configurable?
2. **PDF styling**: Simple table layout, or branded with Mikro logo/colors?
3. **Date range default**: Default to "This Month" on page load?
4. **Active sessions on user page**: Should users see their own active session on the Time page too, or just on the dashboard?
