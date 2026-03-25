# Mikro Code Cleanup & Refactoring Plan (Updated 2026-03-17)

## Context
Post-data-integrity-fix cleanup. Line numbers updated to reflect current codebase state after the stats/payment counter removal commit.

**Critical constraint:** Backend is LIVE. Every commit must be production-safe. No API response shape changes. No database schema changes.

---

## Phase 1: Remove Backend Debug Print Statements
**Risk: ZERO**

- `backend/api/views/Training.py` — lines 194, 199, 202, 222 (commented), 233
- `backend/api/views/Checklists.py` — lines 179, 264, 267, 520, 582, 1043
- `backend/api/views/Transactions.py` — lines 248, 317

## Phase 2: Remove Backend Dead/Commented Code
**Risk: ZERO**

- `Users.py:123-124` — commented register route + `Users.py:799+` commented method
- `Projects.py:123-126` — routes to commented-out `user_join_project`/`user_leave_project` (runtime crash bug!) + `Projects.py:1560-1605` commented methods. Remove BOTH the routes AND the commented methods.

## Phase 3: Standardize Name Formatting (.capitalize → .title)
**Risk: LOW**

- `Users.py:305-306` — `first_login_update()`
- `Users.py:375-376` — `fetch_user_details()`
- `Transactions.py:165-166, 254-255, 319-320` — `create_transaction`, `process_payment_request`, `submit_payment_request`
- Leave `Users.py:878` alone (category, not a name)
- Leave `Transactions.py:525` alone (transaction_type, not a name)

## Phase 4: Extract Users.py helpers
**Risk: LOW**

Extract `_format_user_name(user)` and `_resolve_country_region(country_id, cache, cache)`.

## Phase 5: Extract Training.py helper
**Risk: LOW**

Extract `_create_training_questions(training_id, questions_data)` from duplicated loops in `create_training` and `modify_training`.

## Phase 6: Frontend — alert() → toast()
**Risk: LOW**

4 files, ~25 alert calls.

## Phase 7: Frontend — Inline modals → Modal component
**Risk: MEDIUM**

admin/users/page.tsx, admin/tasks/page.tsx.

## Phase 8: Fix N+1 Queries in Regions.py
**Risk: MEDIUM**

Pre-fetch and use dicts.

## Phase 9: UI inline styles → Tailwind
**Risk: LOW**

Button.tsx, Input.tsx, Card.tsx.
