# Mikro Sync Meeting — Week of March 18, 2026

**Attendees:** Goose, Aaron, Keeley, [New Project Owner TBD]
**Context:** Keeley is transitioning out; new person taking over project ownership. This is a sync + handover + strategy discussion.

---

## 1. Project Handover for New Team Member (~10 min)

### What is Mikro?
- Mikro is Kaart's internal GIS task & time management platform for OpenStreetMap mappers
- It tracks mapping/validation tasks from Tasking Manager (TM4) and MapRoulette, manages time tracking, training modules, checklists, and (currently) payments
- Built as a Next.js frontend + Flask/PostgreSQL backend, deployed on DigitalOcean
- Users authenticate via Auth0, link their OSM accounts for changeset tracking

### Quick Tour (live or screenshare)
- **User Dashboard** — clock in/out, assigned projects, task stats, training & checklists
- **Admin Dashboard** — org-wide stats, time management, user management, project management, reports
- **Validator Dashboard** — validation queue, checklist review
- **Account Page** — profile, OSM account linking, Mapillary linking, timezone
- **Reports** — editing/validation stats, changeset heatmaps, element analysis, MapRoulette breakdown

### How We Work — Trello Workflow
- Board: [Mikro Trello Board](https://trello.com/b/mikro)
- Lists flow left to right: **Goals → Planning → TODO → In Progress → Needs Testing → Ready to Deploy → Deliverable**
- Separate lists for **bug reports**, **UI changes**, **feature requests**, and **Blocked/Waiting**
- Each list has a guideline card at the top explaining how to submit items
- Semi-automated: Claude Code monitors the board, picks up new cards, asks clarifying questions, drafts implementation plans, and moves cards through the pipeline
- The new owner's role: submit requests via Trello cards, review/approve implementation plans, test completed features, and provide feedback

---

## 2. Strategic Direction: Payment Platform → GIS Task & Time Management (~15 min)

### The Shift
- Mikro was originally built around micropayments for OSM mapping tasks
- Discussion has moved toward making it a more general **GIS time & task management platform**
- Payments don't need to be dropped entirely, but the platform's identity and feature priority should shift

### Questions for Aaron
- **What's the new core purpose?** Time tracking + task management for GIS teams? Internal ops tool? Client-facing?
- **Payments — keep, deprecate, or make optional?** Currently payments are woven into projects, tasks, and user profiles. If de-emphasized:
  - Should payment fields be hidden by default and toggled on per-project? (We already added a `payments_enabled` toggle to projects)
  - Should the Payments page remain in the nav, or move to a sub-menu / admin-only area?
- **What new capabilities matter most?** Some possibilities:
  - Enhanced time tracking (see item 3 below)
  - Team/project reporting & analytics
  - MapRoulette integration (in progress)
  - Community outreach tracking
  - Imagery collection management
  - Integration with external tools (Google Sheets, Mapillary, etc.)
- **Target users** — Is this still internal Kaart only, or could it serve other OSM organizations?

### Features to Review in Context of the Shift

| Feature Area | Current State | Action Needed? |
|---|---|---|
| Payments page & pay requests | Fully built | Hide/toggle? Keep as-is? |
| Payment rates on projects | Per-task rates for mapping/validation | Make optional (toggle exists) |
| Payment fields on user profiles | Points, payment history | De-emphasize in UI? |
| Time tracking | Redesigned (Project → Topic → Task) | **Done** — in testing, needs db upgrade |
| Task sync (TM4 + MapRoulette) | Working, webhook-based | Core feature, keep |
| Training & Checklists | Fully built | Core feature, keep |
| Reports & Analytics | Editing, validation, MapRoulette tabs | Expand — this becomes more central |
| Community tab | Blocked (Google Sheets integration) | Revisit priority? |

---

## 3. Cards Needing Discussion / Decisions (~15 min)

### A. Time Tracking Redesign: Project → Topic → Task — **IMPLEMENTED**
**Card:** [Trello](https://trello.com/c/psPKprZB) | **List:** Needs Testing

This has been built and pushed. The old 5-category system is replaced with 9 topics and cascading task selectors:
- **Topics:** Editing, Validating, Training, Checklist, QC/Review, Meeting, Documentation, Imagery Capture, Other
- **Task selectors:** project dropdown, training/checklist dropdown, or free-text depending on topic
- **"Other"** saves custom topic names per-org for reuse
- **Backward compatible** — old entries display with updated labels (Mapping → Editing, etc.)
- **Requires `flask db upgrade`** (migration `o5a6b7c8d9e0`)

**Still open for discussion:**
1. Is the topic list right? Add/remove any?
2. Should Task be required for certain topics or always optional? (Currently always optional)
3. Should Project auto-select based on user's country?
4. A few bugs still being worked out

**Note:** Aaron originally designed the time system — get his feedback on the new topics.

### B. Multiple OSM Accounts Per User
**Card:** [Trello](https://trello.com/c/OTc06VEG) | **List:** Planning

One team member has two Kaart OSM accounts (manual editing + imports). Recommendation is to keep single-account and have them create a second Mikro user. Adds significant complexity otherwise (affects time tracking, payments, changeset counting, reports).

**Decision needed:** Single account (recommended) or support multiple?

### C. OSM Account Linking Error
**Card:** [Trello](https://trello.com/c/OSt7rPO8) | **List:** Planning

One user reported "Missing required parameter: client_id" when linking OSM. Likely isolated — need to identify who experienced it and whether it's reproducible. Code looks correct; if it affected everyone we'd know.

**Action:** Get details from whoever reported it. Browser? Reproducible?

### D. Validator Payment for Non-Mikro Mapper Tasks
**Card:** Decision Needed | **List:** Planning

When a validator approves a task that was mapped by someone not in Mikro, should the validator still get paid/credited? Currently these tasks are ignored by validation sync.

**Decision needed:** Pay validators regardless of who mapped? Or only for tasks mapped by Mikro users?

### E. MapRoulette Integration
**Card:** Maproulette Integration Plan | **List:** TODO

Project sync and basic task tracking are built and in testing. Remaining work: handling edge-case task statuses, improving the reports tab breakdown. Priority check — is this still important given the platform direction shift?

### F. Challenges Cards (Planning)
Several "Challenges" cards in Planning that need strategic input:
- **Task Splitting** — How to handle TM4 tasks that get split
- **Externally Mapped/Validated Tasks** — Same as validator payment question above
- **Outcome Billing - Checklist Picture Upload** — Adding photo upload to checklists for proof-of-work
- **Community Outreach / Imagery Collection** — Strategy for tracking non-mapping work

---

## 4. Current State of Development (~5 min)

### In Needs Testing (16 items)
Highlight the big ones for the team to test:
- Global Time Tracking (full system) — **now with Topic → Task redesign**
- Admin Dashboard with Reporting & Charts
- MapRoulette Integration
- Silent User Tracking (add users by OSM username without invitation)
- Sidebar clock widget
- Category filter fix for active sessions (just committed today)
- Various bug fixes (wrong user stats, MR errors, etc.)

### In Progress
- Live TM4 → Mikro Task Sync via Webhook (webhook receiver built, needs production TM4 config)

### Ready to Deploy
- Validator dashboard 404 fix on Quick Action buttons

### Blocked
- Community Tab — waiting on Google Sheets API integration approach

### Bug Reports
- Projects page filter not working (needs investigation)

---

## 5. Handover Logistics (~5 min)

- **Trello access** — New person needs to be added to the Mikro board
- **Mikro admin access** — Create their user account with admin role
- **Auth0** — They don't need Auth0 dashboard access unless managing users directly
- **Testing process** — Items in "Needs Testing" have test instructions in the card description; test on mikro.kaart.com, move to "Ready to Deploy" or back to "In Progress" with feedback
- **Communication** — Continue using Trello cards for requests? Slack? Establish cadence for check-ins
- **Keeley's open items** — Any context she wants to pass along that isn't in Trello?

---

## Quick Reference — Open Questions Checklist

- [ ] Platform direction: payment-centric → task/time management. What changes?
- [x] Time tracking redesign: **implemented** — review topic list, confirm task requirement rules
- [ ] Multiple OSM accounts: single (recommended) or multiple?
- [ ] OSM linking error: who was affected? Reproducible?
- [ ] Validator pay for non-Mikro mapper tasks: yes or no?
- [ ] MapRoulette priority: still high given direction shift?
- [ ] Checklist photo upload: priority?
- [ ] Community/imagery tracking: priority?
- [ ] New project owner Trello + Mikro access setup
- [ ] Communication cadence going forward
