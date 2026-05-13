# Team admin permissions audit — proposal

**Authored:** 2026-05-13
**Mandate:** "Team admins ought to be able to do all the same things an org admin can but scoped to the teams they manage."
**Status:** Awaiting Goose approval per category before code changes.

## Method

Inventoried every `@requires_admin` decorator across `backend/api/views/` and every `isOrgAdminOrAbove(viewerRole)` gate in `frontend/mikro-next/src`. For each, decided:

- **OPEN** — flip to `@requires_team_admin_or_above`. Existing `org_id` filter is enough; team_admin can do this org-wide within their org. No team-scope check needed.
- **SCOPE** — flip the decorator AND add a managed-team check inside the handler. Team_admin can only act on resources tied to their managed teams.
- **KEEP** — stays `@requires_admin`. Either inherently org-level (create team, region administration), destructive (delete, purge), a dev tool, or a role-promotion path.

The F3 plan already opened ~50 endpoints across Teams/Time/Transactions/Reports/etc., and we've shipped two more on master since (project create+edit, project sync). This audit covers what's left.

---

## Category 1 — OPEN (decorator swap only, ~12 endpoints)

These don't need a team-scope check because:
- They're already scoped to the user's `org_id`
- The resource itself either belongs to the org as a whole (training, checklist, project) and team_admin is trusted to manage them within their org
- They're read-only or low-risk operations

### Backend
| File | Endpoint | Notes |
|---|---|---|
| `Projects.py:507` | `calculate_budget` | Read-only computation helper |
| `Projects.py:2216` | `fetch_project_trainings` | Read-only |
| `Projects.py:2257` | `assign_project_training` | Attach training to a project |
| `Projects.py:2296` | `unassign_project_training` | Detach training from a project |
| `Tasks.py:1028` | `update_task` | Fix individual task data |
| `Training.py:78` | `create_training` | New training |
| `Training.py:199` | `update_training` | Metadata edits |
| `Training.py:227` | `modify_training` | Full update incl. questions |
| `Checklists.py:76` | `create_checklist` | New checklist |
| `Checklists.py:166` | `update_list_items` | Edit items |
| `Checklists.py:271` | `update_checklist` | Metadata edits |
| `Reports.py:1102` | `fetch_element_analysis` | Read-only analytics |
| `Reports.py:1169` | `queue_element_analysis` | Background job kick |
| `Reports.py:1203` | `check_element_analysis_status` | Job status read |
| `Regions.py:88` | `fetch_regions` | Read-only |
| `Regions.py:182` | `fetch_countries` | Read-only |
| `Regions.py:354` | `fetch_filter_options` | Read-only, used everywhere |
| `Regions.py:518` | `assign_project_locations` | Attach location to project |
| `Regions.py:525` | `unassign_project_location` | Detach location |
| `Regions.py:532` | `fetch_project_locations` | Read-only |
| `Regions.py:541` | `assign_training_locations` | Same idea for training |
| `Regions.py:548` | `unassign_training_location` | — |
| `Regions.py:555` | `fetch_training_locations` | Read |
| `Regions.py:564` | `assign_checklist_locations` | Same for checklists |
| `Regions.py:571` | `unassign_checklist_location` | — |
| `Regions.py:578` | `fetch_checklist_locations` | Read |
| `Users.py:686` | `fetch_project_users` | Read |

---

## Category 2 — SCOPE (decorator swap + managed-team check, ~6 endpoints)

These need an additional check: team_admin can only operate on users / transactions / projects that belong to teams they manage.

| File | Endpoint | Scope rule |
|---|---|---|
| `Users.py:850` | `invite_user` | Team_admin invites must carry `target_team_id` in their managed set (the F3 plan §3.6 wired this — verify implementation) |
| `Users.py:1211` | `do_modify_users` | Team_admin can edit user details only for users on their managed teams. Role promotion still blocked unless caller is org_admin+. (super_admin gate already added earlier.) |
| `Users.py:1307` | `assign_user` | Team_admin can assign only users on their managed teams to projects |
| `Projects.py:1788` | `assign_user_project` | Team_admin can assign their managed-team users to a project they can access |
| `Projects.py:1815` | `unassign_user_project` | Same as assign |
| `Tasks.py:864` | `sync_user_projects` | Team_admin can sync projects for users on their managed teams |
| `Transactions.py:545` | `archive_transaction` | Team_admin can archive transactions for users on their managed teams |
| `Transactions.py:575` | `fetch_archived_transactions` | Read scoped to managed-team users |
| `TimeTracking.py:1721` | `admin_set_hourly_rate` | Team_admin sets rates only for their managed-team users |

---

## Category 3 — KEEP (`@requires_admin` stays)

These remain Org Admin / Super Admin only because they're org-level decisions, destructive, dev-tool only, or role-promotion paths:

### Inherently org-level
- `Teams.py:200` `create_team` — Org-level structure
- `Teams.py:273` `delete_team` — Org-level
- `Regions.py:129,147,162` `create/update/delete_region` — Region admin is org-level
- `Regions.py:215,247,274` `create/update/delete_country`
- `Regions.py:294,328` `assign/unassign_user_country` — Org user-data mgmt
- `Users.py:235` `import_users` — Org bulk import
- `Users.py:1034` `sync_org_ids` — Org-level Auth0 sync
- `Users.py:1143,1173` `deactivate/reactivate_user` — Org-level user status
- `Regions.py:608` `seed_defaults` — Org bootstrap

### Destructive / role-promotion
- `Projects.py:483` `delete_project` — Already explicitly Org Admin only per F3
- `Users.py:1197` `do_remove_users` — Hard delete
- `Training.py:286` `delete_training`
- `Checklists.py:334` `delete_checklist`
- `Transactions.py:218` `delete_transaction` — Financial

### Dev tools / purge
- `Projects.py:2156` `purge_all_projects`
- `Tasks.py:739,1079` `admin_update_all_user_tasks`, `purge_all_task_stats`
- `Training.py:547` `purge_all_trainings`
- `Checklists.py:1393` `purge_all_checklists`
- `Transactions.py:631` `purge_all_transactions`
- `Users.py:1362` `purge_all_users`
- `TimeTracking.py:1264,1584` `admin_add_test_entry`, `purge_all_time_entries`
- `Regions.py:905` `purge_all_regions`

### Whole files — out of scope for team_admin (per F3 plan §3.4: "team_admin = scoped operator on existing org assets, not a content creator")
- **Friends.py** — all 7 endpoints — Cross-team aggregation
- **Punks.py** — all 8 endpoints — Same
- **ChannelMonitor.py** — all 7 endpoints — Org-level monitoring
- **CommunityData.py** — all 4 endpoints — Org-level data
- **Transcription.py** — all 14 endpoints — Admin-only tool

These could be reconsidered later but the F3 plan was deliberate about scoping team_admin away from these.

---

## Frontend changes

These pages have `isOrgAdminOrAbove(viewerRole)` gates that need parallel updates to match the backend opening up:

| File | Variable | Change |
|---|---|---|
| `admin/projects/page.tsx:128` | `canCreateOrDelete` | Already split: `canCreateOrEdit` opened earlier (master) |
| `admin/training/page.tsx:85` | `canCreateOrDelete` | Split: add `canCreateOrEdit` for the Create / Edit buttons; keep `canCreateOrDelete` for Delete + purge |
| `admin/checklists/page.tsx:100` | `canCreateOrDelete` | Same split as training |
| `admin/payments/page.tsx:122` | `canPurge` | Keep — purge is dev tool |
| `admin/dashboard/page.tsx:58` | `canPurge` | Keep — same |
| `admin/users/page.tsx:74,75` | `canEditRole`, `canImportOrPurge` | Keep — role promotion + import stay org_admin |
| `admin/users/[id]/page.tsx:175` | `canEditRole` | Keep |
| `admin/teams/page.tsx:72` | `canCreateOrDeleteTeams` | Keep — team CRUD is org-level |

Sidebar nav already correct: `teamAdminNavItems` already excludes Regions / Friends / Punks / Transcribe.

---

## Implementation order (one commit per file ideally)

1. `Projects.py` — Category 1 swaps + Category 2 scope check on assign/unassign user
2. `Tasks.py` — Cat 1 update_task + Cat 2 sync_user_projects
3. `Training.py` — Cat 1 swaps (create/update/modify)
4. `Checklists.py` — Cat 1 swaps (create/update_items/update)
5. `Reports.py` — Cat 1 swaps (element analysis)
6. `Regions.py` — Cat 1 swaps (reads + location assigns)
7. `Users.py` — Cat 2 with scope checks (invite_user, do_modify_users, assign_user, fetch_project_users)
8. `Transactions.py` — Cat 2 (archive + fetch_archived)
9. `TimeTracking.py` — Cat 2 (admin_set_hourly_rate)
10. Frontend — training, checklists `canCreateOrEdit` mirrors

Plus a follow-up Trello card with the test plan (login as Logan/Ian, walk through each newly-opened action).

---

## Decisions (Goose 2026-05-13)

1. **invite_user** — Defer. Do NOT open it in this pass. (target_team_id wiring isn't complete; opening it without that is unsafe.)
2. **assign_user / project user assignment** — Team_admin can only assign **their managed-team members**, not arbitrary org users.
3. **Training / Checklist scoping** — Team_admin can create/edit only **trainings & checklists assigned to teams they manage**. Their read views also filter to that set. Org-wide unassigned trainings/checklists are NOT in their scope.
4. **Friends / Punks / ChannelMonitor / Transcription / CommunityData** — **Open up, but team-siloed reads**. Team_admin sees only entries tied to their managed teams (via `added_by` / `created_by` / `user_id`). Sidebar also needs nav entries added for team_admin.
5. **Region / country CRUD** — Stays Org Admin only. The Regions admin page itself is likely going away soon (regions are mostly set up now). Read endpoints and location-assignment endpoints still get opened per Category 1.

### Implications for Phase 2 (frontend)
- `training/page.tsx`, `checklists/page.tsx` — `canCreateOrEdit` split; data fetch needs to be team-scoped (the backend `fetch_admin_trainings` / `fetch_admin_checklists` will filter)
- `Sidebar.tsx` `teamAdminNavItems` — **add** Friends, Punks, Transcribe entries (currently excluded). Skip Regions (kept org_admin per decision 5). CommunityData and ChannelMonitor — TBD, depends on whether they're surfaced via the existing sidebar.
