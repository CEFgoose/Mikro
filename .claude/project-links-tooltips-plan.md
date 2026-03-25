# Project Links & Tooltips Plan

## Changes Needed

### 1. Create User Project Detail Page (`/user/projects/[id]`)
Simplified version of admin project profile — shows:
- Project name, source badge (TM4/MR), difficulty, status
- "Open in Tasking Manager" / "Open in MapRoulette" button
- Stats: total tasks, % mapped, % validated
- User's own progress on this project (tasks mapped, validated, earnings)
- Progress bars

Does NOT show: financial summary, all contributors, admin edit controls

### 2. Make Project Names Clickable → `/user/projects/[id]`
- **User dashboard** — "Your Projects" section: project names become links
- **User dashboard** — Any "Assigned Projects" rendering
- **User projects page** — project card names become links
- **Validator dashboard** — project names become links

### 3. Show TM Project ID Under Project Name
- Render `#{project.id}` below the project name as a clickable link to external TM/MR
- On user dashboard "Your Projects" section
- On user projects page cards

### 4. Add Tooltips on All Clickable Navigation Items
Add `title` attributes (native browser tooltips) on all clickable items that navigate to another page but aren't obvious links. Examples:

**User Dashboard:**
- Project names → "View project details"
- Project IDs → "Open in Tasking Manager" / "Open in MapRoulette"
- Quick action buttons → already labeled

**User Projects Page:**
- Project names → "View project details"
- Project IDs → "Open in Tasking Manager"
- "Start Mapping" button → already labeled

**User Teams Page:**
- Team names → "View team details"

**Validator Dashboard:**
- Project names → "View project details"
- Project IDs → "Open in Tasking Manager"

**Admin Pages (already clickable, just need tooltips):**
- Project names → "View project details"
- User names → "View user profile"
- Team names → "View team details"
- Project IDs → "Open in Tasking Manager" / "Open in MapRoulette"

**Admin Project Detail Page:**
- User names in contributors → "View user profile"
- Team names → "View team details"

## Implementation Order
1. Create `/user/projects/[id]` page
2. Wire up project name links + ID links on user dashboard
3. Wire up on user projects page
4. Wire up on validator dashboard
5. Add tooltips across all pages
