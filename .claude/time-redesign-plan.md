# Time System Redesign Plan

## Goal
Replace the flat Project + Category time tracking with a three-tier hierarchy:
**Project (country)** → **Topic (activity type)** → **Task (specific item)**

## Current State
- `TimeEntry` model has `project_id` (FK to Project) + `category` (string: mapping/validation/review/training/other)
- UI: Project dropdown + Category dropdown at clock-in
- Category is a hardcoded list in both frontend and backend

## Proposed Design

### Tier 1: Project (unchanged)
- Already country-based in practice (e.g., "Albania - MK")
- Auto-populated from user's assigned projects via `useUserProjects()`
- No changes needed

### Tier 2: Topic (replaces "category")
Expanded activity types. Stored as string on TimeEntry (same as current `category`):

| Topic Value | Label |
|---|---|
| `editing` | Editing |
| `validating` | Validating |
| `training` | Training |
| `checklist` | Checklist |
| `review` | QC / Review |
| `meeting` | Meeting / Training Event |
| `documentation` | Documentation |
| `imagery` | Imagery Capture |
| `other` | Other |

### Tier 3: Task (NEW - specific item)
Dynamically populated based on Topic selection:

| When Topic is... | Task dropdown shows... | Source |
|---|---|---|
| Editing | User's assigned TM/MR projects | `useUserProjects()` filtered |
| Validating | User's assigned TM/MR projects | `useUserProjects()` filtered |
| Training | Available training modules | `useOrgTrainings()` |
| Checklist | User's assigned checklists | `useUserChecklists()` or similar |
| Review | User's assigned TM/MR projects | `useUserProjects()` filtered |
| Meeting | Free-text input | N/A |
| Documentation | Free-text input | N/A |
| Imagery | Free-text input | N/A |
| Other | Free-text input | N/A |

Task is **optional** — user can clock in with just Project + Topic if they don't want to specify.

---

## Database Changes

### TimeEntry model additions
```python
# Rename conceptually: category → topic (but keep column name for backward compat)
# OR add migration to rename column. I recommend keeping "category" as the column
# name to avoid breaking existing data, but accepting the new topic values.

# NEW columns:
task_name = db.Column(db.String(255), nullable=True)      # Display name of specific task
task_ref_type = db.Column(db.String(50), nullable=True)    # "project" | "training" | "checklist" | "custom"
task_ref_id = db.Column(db.Integer, nullable=True)         # FK to the specific entity (nullable)
```

### Migration
```
flask db migrate -m "Add task fields to TimeEntry"
flask db upgrade
```

### Backend changes (TimeTracking.py)
1. Expand `VALID_CATEGORIES` to include new topic values
2. Accept `task_name`, `task_ref_type`, `task_ref_id` in clock_in payload
3. Include task fields in `format_time_entry()` response
4. Accept task fields in `admin_add_entry` and `edit_entry`
5. Include task fields in export (CSV/JSON/PDF)

### Backward compatibility
- Existing entries with old categories (mapping/validation/review/training/other) remain valid
- `mapping` maps to `editing`, `validation` maps to `validating` (can normalize in display)
- New entries use the expanded topic values
- `task_name`, `task_ref_type`, `task_ref_id` are all nullable — old entries just have nulls

---

## Frontend Changes

### 1. TimeTrackingWidget.tsx
- Replace Category dropdown with Topic dropdown (expanded list)
- Add Task selector that changes based on Topic:
  - For entity-linked topics: dropdown populated from API
  - For free-text topics: text input
- Task is optional (can be empty)
- Update clock-in payload to include `task_name`, `task_ref_type`, `task_ref_id`

### 2. SidebarClock.tsx
- Same Topic/Task changes but in compact layout
- May show Task as a second-line compact dropdown

### 3. User Time Page (user/time/page.tsx)
- Add Topic and Task columns to history table
- Add Topic filter (replace Category filter)

### 4. Admin Time Page (admin/time/page.tsx)
- Add Topic and Task columns to history table
- Add Topic/Task fields to Add Entry modal
- Add Topic/Task fields to Edit Entry modal
- Update filters

### 5. AdminTimeManagement widget
- Same updates as admin time page

### 6. Types (types/index.ts)
- Add `taskName`, `taskRefType`, `taskRefId` to `TimeEntry` interface

### 7. Hooks (useApi.ts)
- Update clock-in hook payload type
- May need new hook for fetching user checklists if not already available

---

## Files to Modify

### Backend (requires deploy)
1. `backend/api/database/core.py` — Add columns to TimeEntry
2. `backend/api/views/TimeTracking.py` — Expand categories, accept/return task fields
3. New migration file (auto-generated)

### Frontend
1. `frontend/mikro-next/src/components/widgets/TimeTrackingWidget.tsx`
2. `frontend/mikro-next/src/components/layout/SidebarClock.tsx`
3. `frontend/mikro-next/src/app/(authenticated)/user/time/page.tsx`
4. `frontend/mikro-next/src/app/(authenticated)/admin/time/page.tsx`
5. `frontend/mikro-next/src/components/widgets/AdminTimeManagement.tsx`
6. `frontend/mikro-next/src/types/index.ts`
7. `frontend/mikro-next/src/hooks/useApi.ts`

---

## Implementation Order

1. **Backend: DB migration** — Add new columns (non-breaking, all nullable)
2. **Backend: API changes** — Expand valid categories, accept/return new fields
3. **Deploy backend**
4. **Frontend: Types + Hooks** — Update interfaces and API hooks
5. **Frontend: TimeTrackingWidget** — Rebuild clock-in form with Topic → Task cascade
6. **Frontend: SidebarClock** — Mirror changes in compact layout
7. **Frontend: History pages** — Add columns and filters
8. **Frontend: Admin modals** — Update Add/Edit entry forms

---

## Open Questions for Keeley

1. **Topic list**: Are the proposed topics (Editing, Validating, Training, Checklist, Review, Meeting, Documentation, Imagery, Other) the right set? Should any be added/removed?
2. **Task requirement**: Should Task be optional or required for certain topics?
3. **Project auto-population**: Should Project auto-select based on user's primary country, or always require selection?
4. **Old data**: How should existing time entries with old categories display? Map "mapping" → "Editing", "validation" → "Validating"?
