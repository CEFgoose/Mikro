# Project Profile Page — Implementation Plan

## Overview
A dedicated detail page for each project, accessible from the Projects page and Reports page. Shows all stats, assigned users, teams, trainings, time entries, and financial data for a single project.

**Route:** `/admin/projects/[id]/page.tsx`

---

## Page Layout

### Header Section
- Project name (large) + source badge (TM4/MR) + external link icon
- Status badge (Active/Inactive) + Difficulty badge (Easy/Medium/Hard)
- Created by (admin name)
- Breadcrumb: Projects > Project Name
- Actions: Edit | Sync | Back to Projects

### Section 1: Stats Cards (4-column grid)
| Card | Value | Detail |
|------|-------|--------|
| Total Tasks | `project.total_tasks` | — |
| Progress | `% mapped` | Progress bar |
| Validated | `% validated` | Progress bar |
| Avg Time/Task | computed from TimeEntry | e.g. "2h 15m" |

### Section 2: Financial Summary (3-column grid)
| Card | Value |
|------|-------|
| Budget | `$max_payment` (mapping_rate + validation_rate × total_tasks) |
| Paid Out | `$total_payout` |
| Remaining | `$max_payment - $total_payout` |

Below cards: rate breakdown — Mapping Rate: $X/task, Validation Rate: $X/task

### Section 3: Task Breakdown (conditional on source)

**TM4 Projects:**
- Horizontal bar or donut showing: Mapped / Validated / Invalidated / Remaining
- Table: Task ID | Mapped By | Validated By | Date Mapped | Date Validated | Paid Out

**MR Projects:**
- MR Status breakdown chart: Fixed / Already Fixed / False Positive / Skipped / Can't Complete
- Same task table with mr_status column

### Section 4: Assigned Users
- Table: User Name | Email | Role | Tasks Mapped | Tasks Validated | Time Logged | Earnings
- Data from: ProjectUser join + Task aggregates + TimeEntry aggregates
- Link each user name to `/admin/users/[id]`

### Section 5: Assigned Teams
- Cards or badges showing team names
- Each links to `/admin/teams/[id]`

### Section 6: Time Tracking Summary
- Total hours logged for this project
- Breakdown by category (mapping/validation/review/training/other)
- Recent time entries table: User | Category | Clock In | Clock Out | Duration

### Section 7: Assigned Trainings
- List of required trainings with completion stats
- Training Name | Difficulty | Points | Users Completed / Total Assigned

### Section 8: Locations
- List of assigned countries (flags + names)
- Or "Visible to all" if no country restrictions

---

## Backend Changes

### New endpoint: `/project/fetch_project_profile`

**Request:** `{ project_id: number }`

**Response:**
```json
{
  "status": 200,
  "project": { ...full project object... },
  "assigned_users": [
    {
      "id": "auth0|...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "tasks_mapped": 45,
      "tasks_validated": 12,
      "time_logged_seconds": 36000,
      "earnings": 5700.00
    }
  ],
  "assigned_teams": [
    { "id": 1, "name": "Team Alpha", "member_count": 5 }
  ],
  "tasks": [
    {
      "task_id": 123,
      "mapped_by": "user1",
      "validated_by": "user2",
      "date_mapped": "2026-01-15T...",
      "date_validated": "2026-01-16T...",
      "paid_out": true,
      "mr_status": null
    }
  ],
  "time_entries": [
    {
      "user_name": "John Doe",
      "category": "mapping",
      "clock_in": "...",
      "clock_out": "...",
      "duration_seconds": 3600
    }
  ],
  "time_summary": {
    "total_seconds": 72000,
    "by_category": {
      "mapping": 50000,
      "validation": 20000,
      "other": 2000
    }
  },
  "assigned_trainings": [
    {
      "id": 1,
      "title": "Road Mapping 101",
      "difficulty": "Easy",
      "points": 10,
      "users_completed": 3,
      "users_total": 5
    }
  ],
  "assigned_locations": [
    { "country_code": "US", "country_name": "United States" }
  ],
  "avg_time_per_task": 240
}
```

**Implementation:** Single endpoint that aggregates all data in one call to avoid multiple round-trips. Uses existing queries from Projects.py, Users.py, and Reports.py patterns.

---

## Frontend Changes

### New files:
- `frontend/mikro-next/src/app/(authenticated)/admin/projects/[id]/page.tsx` — Main page component

### Modified files:
- `frontend/mikro-next/src/app/(authenticated)/admin/projects/page.tsx` — Make project names clickable (Link to `/admin/projects/[id]`)
- `frontend/mikro-next/src/app/(authenticated)/admin/reports/page.tsx` — Make project names clickable (Link to `/admin/projects/[id]`)
- `frontend/mikro-next/src/hooks/useApi.ts` — Add `useFetchProjectProfile` hook
- `frontend/mikro-next/src/types/index.ts` — Add `ProjectProfileResponse` type

### Navigation:
- Projects page: project name becomes a `<Link>` to `/admin/projects/[id]`
- Reports page: project name in the projects table becomes a `<Link>` to `/admin/projects/[id]`
- Project profile page: breadcrumb back to `/admin/projects`

---

## Scope Estimate
- **Backend:** 1 new endpoint (~150 lines)
- **Frontend:** 1 new page (~500 lines), 2 small edits to existing pages
- **Scope:** Medium
