# Admin Checklists Page Tutorial Video — Implementation Plan

## Overview
Produce a Remotion tutorial video for the Mikro admin Checklists page. Same approach as Training tutorial: built-in CSS highlighting on DOM elements + modal mockups for every key action.

## Reference Material
- **Live data** (from snapshot): 3 checklists — "test", "Co-Host A Mapathon", "Collect Narrow Road Imagery"
- **Code**: `frontend/mikro-next/src/app/(authenticated)/admin/checklists/page.tsx`
- **Pattern**: `remotion/src/components/TrainingMockup.tsx` + `remotion/src/AdminTrainingTutorial.tsx`

## Key Difference from Training
Checklists uses a **card grid layout** (3 columns) instead of a table. Each card has embedded progress bars, payment rates, and action buttons. This is visually distinct from the Training/Projects table format.

## Page Layout (from live app)

### Shared Elements (reuse sidebar + header pattern)
- Header bar: Mikro logo, Chris Gousset, Settings, Logout
- Sidebar: 10 nav items, "Checklists" active (orange highlight)

### Checklists Page Sections
1. **Page Title Row**: "Checklists" / "Manage checklists and track completion" + "Create Checklist" button (orange)
2. **Stats Cards** (4-column grid):
   - Total Checklists: **3** (white)
   - Active: **3** (orange)
   - Pending Confirmation: **0** (yellow)
   - Total Paid Out: **$0.00** (green)
3. **Status Tabs**: Active (3) | Pending Confirmation (0) | Confirmed (0) | Inactive (0) | Stale (0)
4. **Checklist Cards** (3-column grid) — each card contains:
   - Title + Difficulty badge (Easy/Medium/Hard) + optional "X loc" badge
   - Description (1-2 lines)
   - Progress bar with "X/Y items" label
   - Stats: Completion Rate ($), Validation Rate ($), Due date
   - Buttons: View Details, Edit, Assign Users

### Live Checklist Data
| # | Name | Difficulty | Comp Rate | Val Rate | Due | Items | Locs |
|---|------|-----------|-----------|----------|-----|-------|------|
| 1 | test | Easy (green) | $5.00 | $2.50 | Feb 26, 2026 | 0/3 | — |
| 2 | Co-Host A Mapathon | Medium (yellow) | $50.00 | $2.50 | — | 0/5 | — |
| 3 | Collect Narrow Road Imagery | Medium (yellow) | $5.00 | $2.50 | — | 0/3 | 1 loc |

## Modals to Mockup

### 1. Create Checklist Modal
**Trigger**: "Create Checklist" button
**Fields**:
- Name (text input)
- Description (textarea)
- Completion Rate (number, $) + Validation Rate (number, $) — side by side
- Difficulty (select: Easy/Medium/Hard) + Due Date (date input) — side by side
- Assign to User (select dropdown, optional)
- Active Status toggle (on/off with label "Active (Published)" / "Inactive (Draft)")
- **Checklist Items section** (bordered area):
  - Header: "Checklist Items (N)" + "Add Item" button
  - Each item: Task description input + Link input (optional) + Remove button
  - Show 2-3 sample items
**Footer**: Cancel | Create Checklist

### 2. View Details Modal
**Trigger**: "View Details" button on any card
**Content**:
- Title + description in header
- Summary grid (2x2): Completion Rate, Validation Rate, Difficulty badge, Due Date
- Items list with numbered circles (green checkmark if completed, gray if not)
  - Item text (strikethrough if completed) + optional "View" link
**Footer**: Close

### 3. Edit Checklist Modal (tabbed)
**Trigger**: "Edit" button on any card
**Tabs**:
- **Settings tab**: Name, Description, Completion Rate + Validation Rate, Difficulty, Active Status toggle
- **Locations tab**: Assigned countries list with Remove buttons, search + Add bar
**Footer**: Delete (red, left) | Cancel | Save Changes

### 4. Assign Users Modal
**Trigger**: "Assign Users" button on any card
**Content** (two sections):
- **Assigned Users** (green header): List of assigned users with name, role, "Unassign" button
- **Available Users**: Scrollable list of unassigned users with name, role, "Assign" button
**Footer**: Done

## Files to Create/Modify

### New Files
1. **`remotion/src/components/ChecklistsMockup.tsx`** — React mockup of the checklists page
   - Same dark theme (C color constants)
   - Same sidebar + header pattern
   - `highlightSection` prop with built-in CSS glow + dimming
   - Sections: `createChecklist`, `stats`, `tabs`, `cards`, `card-0`, `card-1`, `card-2`
   - Exported modal components: `CreateChecklistModal`, `ViewDetailsModal`, `EditChecklistModal`, `AssignUsersModal`

2. **`remotion/src/AdminChecklistsTutorial.tsx`** — Main composition

### Modified Files
3. **`remotion/src/Root.tsx`** — Register new `AdminChecklistsTutorial` composition

## Scene Plan (78 seconds, 2340 frames @ 30fps)

| # | Scene | Frames | Duration | What's on screen | Callout Text |
|---|-------|--------|----------|-----------------|--------------|
| 1 | Title | 0–120 | 4s | Animated title card | "Checklists Page Tutorial" |
| 2 | Overview | 120–300 | 6s | Full page, no highlight | "The Checklists page — create task lists, track completion, and manage payments for your mappers" |
| 3 | Stats Cards | 300–480 | 6s | Stats row highlighted | "At-a-glance numbers — total checklists, active count, pending confirmations, and total paid out" |
| 4 | Status Tabs | 480–660 | 6s | Tabs highlighted | "Five status tabs — Active, Pending Confirmation, Confirmed, Inactive, and Stale" / "Each tab shows checklists in that workflow stage" |
| 5 | Checklist Cards | 660–900 | 8s | Cards area highlighted | "Each checklist card shows the title, difficulty, progress, payment rates, and due date" |
| 6 | Card Detail | 900–1140 | 8s | card-0 → card-2 (switch at 120) | First: "The progress bar tracks completed items — this checklist has 3 tasks at $5.00 each" / Second: "Location-restricted checklists show an 'X loc' badge — only assigned mappers in those areas see them" |
| 7 | Create button + Modal | 1140–1440 | 10s | Button highlight (3s) → Create modal | Button: "Click Create Checklist to build a new task list" / Modal: "Set name, description, payment rates, difficulty, and due date" / "Add checklist items — each task can include an optional reference link" |
| 8 | View Details Modal | 1440–1620 | 6s | View Details modal | "View Details shows the full checklist — summary stats and all items with completion status" / "Green checkmarks show completed tasks" |
| 9 | Edit Modal — Settings | 1620–1800 | 6s | Edit modal, Settings tab | "The Settings tab lets you update name, description, rates, difficulty, and active status" |
| 10 | Edit Modal — Locations | 1800–1950 | 5s | Edit modal, Locations tab | "The Locations tab restricts this checklist to specific countries or regions" / "Only mappers in assigned locations will see it" |
| 11 | Assign Users Modal | 1950–2160 | 7s | Assign Users modal | "Assign Users shows who's on this checklist — assign or unassign mappers individually" / "Assigned users see the checklist in their dashboard" |
| 12 | Outro | 2160–2340 | 6s | Animated outro | "That's the Checklists Page!" + feature badges |

**Total: 12 scenes, 2340 frames = 78 seconds**

## Mockup Component Design (`ChecklistsMockup.tsx`)

### Highlightable Sections
- `createChecklist` — the Create Checklist button (white glow)
- `stats` — the 4 stats cards row (orange glow + padding)
- `tabs` — the 5 status tabs (orange glow + padding)
- `cards` — the full cards grid area (orange glow)
- `card-0`, `card-1`, `card-2` — individual checklist cards (orange glow on single card)

### Card Layout (per card)
```
┌─────────────────────────────────────┐
│ Title                    Easy badge │
│ Description text (1-2 lines)        │
│                                     │
│ Progress          0/3 items         │
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                     │
│ Comp Rate: $5.00  Val Rate: $2.50   │
│ Due: Feb 26, 2026                   │
│                                     │
│ [View Details]  [Edit]              │
│ [Assign Users               ]       │
└─────────────────────────────────────┘
```

### Color Values for Stats
- Total Checklists: `C.text` (white)
- Active: `C.orange` (#ff6b35)
- Pending Confirmation: `C.yellow` (#f59e0b)
- Total Paid Out: `C.green` (#22c55e)

## Implementation Steps

1. Create `ChecklistsMockup.tsx` with page mockup + 4 exported modal components
2. Create `AdminChecklistsTutorial.tsx` with 12 scenes
3. Register composition in `Root.tsx` (2340 frames, 30fps, 1920x1080)
4. Render test stills of key scenes (overview, cards, each modal)
5. Verify alignment visually
6. Full render to `screenshots/admin-checklists-tutorial.mp4`
7. Open for user review

## Lessons from Training Tutorial
- **Always show the modal** when describing modal actions — don't just highlight the button and describe unseen contents
- Brief button highlight (3s) before opening the modal scene gives visual context for what was clicked
- Edit modal tab-switching mid-scene works well (used in Training for Settings → Locations)
- Card grid needs different highlight treatment than table rows — glow on individual cards vs inset border on rows
