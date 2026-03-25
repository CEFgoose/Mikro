# Admin Training Page Tutorial Video — Implementation Plan

## Overview
Produce a Remotion tutorial video for the Mikro admin Training page, following the same approach used for the Dashboard (v4) and Projects tutorials: built-in CSS highlighting on the actual DOM elements, no absolute-positioned overlays.

## Reference Material
- **Screenshot**: `screenshots/remotion-reference/admin-training.png` + `admin-training-scrolled.png`
- **Code**: `frontend/mikro-next/src/app/(authenticated)/admin/training/page.tsx` (703 lines)
- **Existing pattern**: `remotion/src/components/ProjectsMockup.tsx` + `remotion/src/AdminProjectsTutorial.tsx`

## Page Layout (from real app screenshots)

### Shared Elements (reuse from Dashboard/Projects)
- Header bar: Mikro logo, Chris Gousset, Settings, Logout
- Sidebar: 10 nav items, "Training" active (orange highlight)

### Training Page Sections
1. **Page Title Row**: "Training" / "Manage training modules and quizzes" + "Add Training" button (orange)
2. **Stats Cards** (4-column grid):
   - Total Trainings: **3** (white)
   - Mapping: **1** (orange)
   - Validation: **0** (blue)
   - Project Specific: **2** (purple)
3. **Type Tabs**: All (3) | Mapping (1) | Validation (0) | Project Specific (2)
4. **Training Table** — columns: Title, Difficulty, Points, Questions, URL, Actions
   - Row 1: "Atlas Check Editing Guide" | Medium (orange badge) + "1 loc" | 10 | 0 | View | Questions, Edit, Delete
   - Row 2: "MapWithAI Workflow for JOSM" | Medium + "1 loc" | 10 | 2 | View | Questions, Edit, Delete
   - Row 3: "test training" | Hard (red badge) + "4 loc" | 100 | 3 | View | Questions, Edit, Delete

## Files to Create/Modify

### New Files
1. **`remotion/src/components/TrainingMockup.tsx`** — React mockup of the training page
   - Same dark theme (C color constants)
   - Same sidebar + header pattern
   - `highlightSection` prop with built-in CSS glow + dimming
   - Sections: `header`, `sidebar`, `addTraining`, `stats`, `tabs`, `table`, `row-0`, `row-1`, `row-2`

2. **`remotion/src/AdminTrainingTutorial.tsx`** — Main composition
   - Same scene structure as Projects tutorial
   - FadeIn wrapper, DashScene pattern, TitleScene, OutroScene

### Modified Files
3. **`remotion/src/Root.tsx`** — Register new `AdminTrainingTutorial` composition

## Scene Plan (56 seconds, 1680 frames @ 30fps)

| # | Scene | Frames | Duration | Highlight Section | Callout Text |
|---|-------|--------|----------|------------------|-------------|
| 1 | Title | 0-120 | 4s | — | "Training Page Tutorial" |
| 2 | Overview | 120-300 | 6s | (none) | "The Training page — create and manage training modules and quizzes for your mappers" |
| 3 | Add Training | 300-480 | 6s | `addTraining` | "Create a new training module with title, URL, difficulty, point value, and quiz questions" |
| 4 | Stats Cards | 480-660 | 6s | `stats` | "Training counts by type — Mapping, Validation, and Project Specific" |
| 5 | Type Tabs | 660-840 | 6s | `tabs` | "Filter trainings by type — each tab shows its own count" |
| 6 | Training Table | 840-1080 | 8s | `table` | "All your training modules at a glance — title, difficulty, points, quiz questions, and actions" |
| 7 | Table Row Detail | 1080-1320 | 8s | `row-0` → `row-2` | First half: "Each training shows difficulty level, location restrictions, and point value" / Second half: "Questions button shows the quiz, Edit lets you change settings and assign locations" |
| 8 | Actions Focus | 1320-1500 | 6s | `table` | "Questions opens the quiz viewer, Edit updates settings & locations, Delete removes the training" |
| 9 | Outro | 1500-1680 | 6s | — | "That's the Training Page!" |

## Mockup Component Design (`TrainingMockup.tsx`)

### Highlightable Sections
- `addTraining` — the Add Training button (white glow like Projects)
- `stats` — the 4 stats cards row (orange glow + padding)
- `tabs` — the 4 type tabs (orange glow + padding)
- `table` — the full training table card (orange glow)
- `row-0`, `row-1`, `row-2` — individual table rows (inset left border + bg tint)

### Sample Data (from real app)
```typescript
const trainings = [
  {
    title: 'Atlas Check Editing Guide',
    difficulty: 'Medium', diffColor: C.yellow,
    points: 10, questions: 0,
    badges: ['1 loc'],
  },
  {
    title: 'MapWithAI Workflow for JOSM',
    difficulty: 'Medium', diffColor: C.yellow,
    points: 10, questions: 2,
    badges: ['1 loc'],
  },
  {
    title: 'test training',
    difficulty: 'Hard', diffColor: C.red,
    points: 100, questions: 3,
    badges: ['4 loc'],
  },
];
```

### Color Values for Stats
- Total Trainings: `C.text` (white)
- Mapping: `C.orange` (#ff6b35)
- Validation: `#3b82f6` (blue)
- Project Specific: `#a855f7` (purple)

## Implementation Steps

1. Create `TrainingMockup.tsx` following the `ProjectsMockup.tsx` pattern
2. Create `AdminTrainingTutorial.tsx` following the `AdminProjectsTutorial.tsx` pattern
3. Register composition in `Root.tsx` (1680 frames, 30fps, 1920x1080)
4. Render test stills of key scenes (overview, stats, table, row detail)
5. Verify alignment visually
6. Full render to `screenshots/admin-training-tutorial.mp4`
7. Open for user review

## Notes
- The training page is simpler than Projects (fewer sections, smaller table)
- The table only has 3 rows vs 5 in Projects — more vertical space below
- Difficulty badges use different colors: Easy=green, Medium=orange/yellow, Hard=red
- "X loc" badge indicates location restrictions assigned to the training
- The Questions modal and Edit modal (with Settings + Locations tabs) are key features to mention in callouts but don't need visual mockups — they're described in text
