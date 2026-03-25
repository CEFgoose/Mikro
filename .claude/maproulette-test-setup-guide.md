# MapRoulette Test Setup Guide

## Overview
Step-by-step guide to create a MapRoulette account, set up a private test challenge, and test from both mapper & admin perspectives — without disrupting other users on the platform.

---

## KEY THINGS TO KNOW UPFRONT

1. **MapRoulette uses OSM OAuth** — no separate account system. You log in with your OSM account and immediately get full project/challenge creation abilities.
2. **Hierarchy**: Project > Challenge > Task (like TM4's Project > Task)
3. **You can make challenges unlisted** (`enabled: false`) — they won't appear in searches, but anyone with the direct URL can still access them. Good enough for testing.
4. **You likely need 2 OSM accounts to test the review workflow** — MapRoulette won't let you review your own tasks. If you only need to test task completion (not review), one account is fine.
5. **There is no sandbox/staging server** for MR v3. We test on production with unlisted challenges.

---

## STEP 1: Log In to MapRoulette

1. Go to https://maproulette.org
2. Click **"Sign in'** (top-right)
3. Authorize with your OSM account
4. You're in — no admin role request needed

---

## STEP 2: Get Your API Key

This is needed for our Mikro integration to pull task data.

1. After logging in, click your **username/avatar** (top-right)
2. Go to your **User Profile / Settings**
3. Your API key is displayed at the **bottom of the profile page**
4. Copy it and save it somewhere safe — we'll need it as `MAPROULETTE_API_KEY` in Mikro's backend config

---

## STEP 3: Create a Test Project

A project is just a container for challenges. We want it unlisted.

### Via Web UI:
1. Look for a **"Create"** option in your profile dropdown or navigation
2. Create a new project:
   - **Name**: `Kaart Test Project` (or similar)
   - **Description**: `Internal testing — not for public use`
   - **Visible**: **NO** (this keeps it out of public searches)

### Via API (alternative):
```bash
curl -X POST "https://maproulette.org/api/v2/project" \
  -H "apiKey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kaart Test Project",
    "description": "Internal testing - not for public use",
    "enabled": false
  }'
```
Note the returned project `id` — you'll need it for the next step.

---

## STEP 4: Create a Test Challenge with Tasks

A challenge contains the actual tasks mappers work on. We'll create a small one with 3-5 point tasks in an uninhabited area (to be extra safe).

### Via Web UI (Recommended for first time):

1. From your project page, click **"Create Challenge"** or use the challenge creation wizard
2. Fill in:

**Page 1 — Basic Info:**
| Field | Value |
|-------|-------|
| Name | `Test Challenge - Do Not Use` |
| Description | `Internal testing for Kaart Mikro integration` |
| Instructions | `This is a test task. Mark as Fixed when done.` |
| Visible | **NO** |
| Difficulty | Normal |
| Category | Other |

**Page 2 — Data Source:**
Choose **"Upload GeoJSON"** and upload this file (save it locally first):

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {"name": "Test Task 1"},
      "geometry": {"type": "Point", "coordinates": [-176.5, -50.0]}
    },
    {
      "type": "Feature",
      "properties": {"name": "Test Task 2"},
      "geometry": {"type": "Point", "coordinates": [-176.51, -50.01]}
    },
    {
      "type": "Feature",
      "properties": {"name": "Test Task 3"},
      "geometry": {"type": "Point", "coordinates": [-176.52, -50.02]}
    },
    {
      "type": "Feature",
      "properties": {"name": "Test Task 4"},
      "geometry": {"type": "Point", "coordinates": [-176.53, -50.03]}
    },
    {
      "type": "Feature",
      "properties": {"name": "Test Task 5"},
      "geometry": {"type": "Point", "coordinates": [-176.54, -50.04]}
    }
  ]
}
```
*(These coordinates are in the middle of the South Pacific — no one will stumble on them.)*

**Pages 3 & 4** — Leave defaults, click through.

3. Challenge will build (may take a few seconds). You'll see a "building" status then "complete."

### Via API (alternative):
```bash
curl -X POST "https://maproulette.org/api/v2/challenge" \
  -H "apiKey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Challenge - Do Not Use",
    "parent": PROJECT_ID_FROM_STEP_3,
    "instruction": "This is a test task. Mark as Fixed when done.",
    "description": "Internal testing for Kaart Mikro integration",
    "enabled": false,
    "difficulty": 1,
    "localGeoJSON": {
      "type": "FeatureCollection",
      "features": [
        {"type":"Feature","properties":{"name":"Test Task 1"},"geometry":{"type":"Point","coordinates":[-176.5,-50.0]}},
        {"type":"Feature","properties":{"name":"Test Task 2"},"geometry":{"type":"Point","coordinates":[-176.51,-50.01]}},
        {"type":"Feature","properties":{"name":"Test Task 3"},"geometry":{"type":"Point","coordinates":[-176.52,-50.02]}},
        {"type":"Feature","properties":{"name":"Test Task 4"},"geometry":{"type":"Point","coordinates":[-176.53,-50.03]}},
        {"type":"Feature","properties":{"name":"Test Task 5"},"geometry":{"type":"Point","coordinates":[-176.54,-50.04]}}
      ]
    }
  }'
```

---

## STEP 5: Test as a Mapper

1. Navigate to your challenge (use the direct URL from creation, or find it in your project)
2. Click **"Start"** to begin working on tasks
3. You'll see a map centered on the task geometry
4. For each task, you can:
   - **Fixed** (status 1) — marks it as completed
   - **Not an Issue / False Positive** (status 2)
   - **Skip** (status 3)
   - **Already Fixed** (status 5)
   - **Can't Complete** (status 6)
5. When marking as Fixed, check **"Need an extra set of eyes?"** to send it to the review queue
   - OR: Go to User Settings and enable **auto-review-request** so all your completions go to review automatically
6. Complete 2-3 tasks this way

### What Mikro cares about:
- **Fixed (1)** = `mapped=True` in Mikro
- Everything else = skip (no payment)

---

## STEP 6: Test the Review/Validation Workflow

### IMPORTANT: You need a SECOND OSM account for this.
MapRoulette won't let you review your own work.

**With Account B (reviewer):**
1. Log into MapRoulette with the second OSM account
2. Go to **User Settings** and enable the **reviewer** option
3. A **"Review"** item will appear in your user dropdown
4. Open the Review queue — your tasks from Account A should be there
5. For each task, you can:
   - **Approve** (review status 1) — work is correct
   - **Reject** (review status 2) — send back with comment
   - **Approve with Fixes** (review status 3) — you made edits to complete it

### What Mikro cares about:
- **Approved (1)** = `validated=True` (triggers payment)
- **Rejected (2)** = `invalidated=True`
- **Assisted (3)** = `validated=True` (triggers payment)
- **Disputed (4)** = hold for manual resolution

### If you only have one account:
You can still test the mapper side fully. For the review side, you can verify via the API that task statuses and review statuses are queryable — the Mikro sync code will work the same whether review happened via UI or not.

---

## STEP 7: Verify via API (What Mikro Will Do)

These are the endpoints our Mikro backend will call during sync:

```bash
# Get challenge tasks (paginated)
curl "https://maproulette.org/api/v2/challenge/CHALLENGE_ID/tasks?limit=50&page=0" \
  -H "apiKey: YOUR_API_KEY"

# Get task history (who did what, when)
curl "https://maproulette.org/api/v2/task/TASK_ID/history" \
  -H "apiKey: YOUR_API_KEY"

# Get user metrics for a challenge
curl "https://maproulette.org/api/v2/data/user/USER_ID/metrics?challengeIds=CHALLENGE_ID" \
  -H "apiKey: YOUR_API_KEY"

# Resolve OSM username to MR user ID
curl "https://maproulette.org/api/v2/osmuser/YOUR_OSM_USERNAME" \
  -H "apiKey: YOUR_API_KEY"
```

---

## STEP 8: Link Your MR Account in Mikro

Once the test challenge exists and has some completed tasks:

1. Log into Mikro at localhost:3000
2. Go to your Account page
3. Use the MapRoulette account linking (self-service, like OSM/Mapillary)
4. The sync should pick up your test challenge tasks

---

## GOTCHAS & WARNINGS

| Issue | Details |
|-------|---------|
| `#maproulette` hashtag | Auto-added to OSM changeset comments. Be aware for test tasks. |
| GeoJSON format | Must be RFC 7946 compliant. Each task = one Feature in a FeatureCollection. |
| Task building is async | After creating a challenge, tasks build in background. Check status before testing. |
| API key is manual-only | No programmatic way to get it. Must copy from web UI. |
| Review is mapper-initiated | Admin can't force review. Mapper must check the box or enable auto-review in settings. |
| Challenge `enabled: false` | API default. Must explicitly set to `true` to make discoverable. |

---

## REFERENCE LINKS

| Resource | URL |
|----------|-----|
| MapRoulette | https://maproulette.org |
| Documentation | https://learn.maproulette.org |
| Swagger API | https://maproulette.org/docs/swagger-ui/index.html |
| Challenge Visibility Docs | https://learn.maproulette.org/en-US/documentation/challenge-visibility-and-discovery/ |
| Creating Challenges | https://learn.maproulette.org/en-US/documentation/creating-a-challenge/ |
| Python Client | https://maproulette-python-client.readthedocs.io |
| Backend GitHub | https://github.com/maproulette/maproulette-backend |
