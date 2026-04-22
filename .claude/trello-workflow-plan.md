# Trello-Driven Feature Request Automation Workflow

## Executive Summary

This plan outlines a semi-automated workflow where Claude Code monitors Trello lists for feature requests, bug reports, and change requests, processes them through a structured approval flow, implements the changes, and manages the deployment pipeline.

---

## Current Trello Board Structure

### Monitored Lists (Request Intake)
| List | ID | Purpose |
|------|----|---------|
| Other Changes | `6983d86662fc86a324a75906` | Misc changes, refactoring, config updates |
| UI Changes | `6983d7ebe01da075acd7e757` | Frontend/visual modifications |
| New Feature Requests | `6983d81447b5f853fabbb198` | New functionality |
| Bug Reports | `6983d7fc47c087c4c92fa356` | Defects and fixes |

### Workflow Lists
| List | ID | Purpose |
|------|----|---------|
| In Progress | `64fa56eb0834a60d8dc94c7f` | Currently being worked on |
| Needs Testing | `6983da5cc3ef48c3ce86d969` | Completed, awaiting verification |
| Ready to Deploy | `6983dae0053be0da3a8c3ec4` | Tested, awaiting commit/push |
| Deliverable | `64fa588a9a940eb19058ffeb` | Deployed/completed |
| Blocked / Waiting | `64fa56eb0834a60d8dc94c80` | Awaiting clarification or dependency |

### Active Board Members
- **Goose** (goose95) - Developer
- **keeley.bobo** (keeley98) - Project owner

### Workflow Labels
- `CLAUDE-REVIEWING` (orange) - Card is being analyzed
- `AWAITING-PROCEED` (yellow) - Summary posted, waiting for approval
- `IN-IMPLEMENTATION` (blue) - Actively being worked on
- `READY-FOR-USER-TEST` (purple) - Implementation done, needs verification
- `NEED CLARIFYING` (green) - Existing label for cards needing questions answered

---

## Confirmed Decisions

| Decision | Choice |
|----------|--------|
| Create workflow labels | Yes - CLAUDE-REVIEWING, AWAITING-PROCEED, etc. |
| Add list descriptions | Yes - Add submission guidelines now |
| Approval flow | All cards require explicit "proceed" confirmation |
| Git strategy | Branch-per-feature with automated merge |
| Notifications | @mention keeley.bobo on all cards |
| Real-time alerts | Trello native (Butler + Google Chat Power-Up) |
| Intelligent briefing | Claude cron job with metrics |

---

## Proposed Workflow

### Phase 1: Session Start - Triage
```
You: "Check the Trello board for new requests"
Claude: Scans all 4 monitored lists
        → Analyzes each card
        → Posts clarifying questions OR implementation summaries
        → Waits for "proceed" confirmations
```

### Phase 2: Implementation
```
Claude: Works through approved requests
        → Creates feature branch
        → Moves cards to "In Progress"
        → Implements changes
        → Moves completed cards to "Needs Testing"
        → Alerts requester and you
```

### Phase 3: Testing
```
You + Claude: Step through each item in "Needs Testing"
              → You verify functionality
              → Approved items move to "Ready to Deploy"
```

### Phase 4: Deployment
```
Claude: For each card in "Ready to Deploy"
        → Creates commit message (no co-author line)
        → Merges feature branch to master
        → Moves card to "Deliverable"
        → Pushes all commits at once
```

---

## Branch-per-Feature Workflow

For each card:
```bash
# 1. Create feature branch
git checkout -b feature/trello-{card-id}-{brief-name}

# 2. Implement changes, commit
git add . && git commit -m "commit message"

# 3. After testing approved, merge to master
git checkout master
git merge feature/trello-{card-id}-{brief-name}

# 4. Delete feature branch
git branch -d feature/trello-{card-id}-{brief-name}

# 5. Push master (all at once at end of session)
git push origin master
```

---

## Notification & Command Center System

### Overview

A multi-channel notification system that **prompts you** rather than waiting for you to check:

| Notification Type | Trigger | Channels | Purpose |
|------------------|---------|----------|---------|
| **Morning Briefing** | Cron (8 AM daily) | Google Chat, macOS notification | Start-of-day summary with metrics |
| **New Request Alert** | Card created | Google Chat, Email | Immediate awareness |
| **Task Ready Alert** | "proceed" posted | Google Chat, Email | Work item is approved |

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    REAL-TIME ALERTS (Trello Native)             │
├─────────────────────────────────────────────────────────────────┤
│  Trello Card Created/Moved/Commented                            │
│         │                                                       │
│         ├──► Google Chat Power-Up ──► Chat Room                 │
│         │                                                       │
│         └──► Butler Rule ──► Email (Fastmail/Gmail)             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 INTELLIGENT BRIEFING (Claude Cron)              │
├─────────────────────────────────────────────────────────────────┤
│  Cron (8 AM) ──► Claude Code (headless)                         │
│                       │                                         │
│                       ├──► Analyze all Trello boards            │
│                       ├──► Generate metrics & summary           │
│                       ├──► Post to Google Chat                  │
│                       ├──► Send email digest                    │
│                       └──► macOS notification ──► Click to open │
│                                                    VS Code      │
└─────────────────────────────────────────────────────────────────┘
```

### Morning Briefing Content

**Metrics:**
- Cards by status (new, waiting approval, in progress, blocked, done)
- Aging/staleness (cards waiting >3 days)
- Weekly velocity (completed this week vs last)
- By requester breakdown

**Format Example:**
```
🌅 MIKRO DAILY BRIEFING - Feb 4, 2026

📊 METRICS
├─ Ready to work: 3 cards
├─ Awaiting proceed: 2 cards
├─ In progress: 1 card
├─ Blocked: 0 cards
└─ Completed this week: 5 cards (+2 vs last week)

🎯 TODAY'S PRIORITIES
1. [BUG] Login 500 error - READY (keeley approved)
2. [FEATURE] Export CSV - READY (keeley approved)
3. [UI] Dashboard spacing - needs your response

⏰ AGING ITEMS
└─ "Payment history pagination" waiting 5 days

Click to open VS Code: vscode://file/Users/goose/Documents/PROJECTS/KAART/Mikro
```

### Recipient Configuration

Create `~/.claude/notification-config.json`:
```json
{
  "mikro": {
    "google_chat_webhook": "https://chat.googleapis.com/v1/spaces/XXX/messages?key=YYY",
    "email_recipients": [
      "goose@kaart.com",
      "keeley@kaart.com"
    ],
    "smtp": {
      "provider": "fastmail",
      "from": "mikro-alerts@kaart.com"
    }
  }
}
```

### Scaling to Multiple Projects

```json
{
  "projects": [
    {
      "name": "Mikro",
      "trello_board_id": "64fa56eb0834a60d8dc94c7c",
      "codebase_path": "/Users/goose/Documents/PROJECTS/KAART/Mikro",
      "recipients": ["goose@kaart.com", "keeley@kaart.com"]
    },
    {
      "name": "Viewer",
      "trello_board_id": "64fa566d6d50780e7642d287",
      "codebase_path": "/Users/goose/Documents/PROJECTS/KAART/viewer 2/viewer-2-0",
      "recipients": ["goose@kaart.com"]
    }
  ]
}
```

---

## List Description Content

### Other Changes
```
**Purpose**: Miscellaneous changes that don't fit other categories
- Refactoring & code cleanup
- Configuration updates
- Documentation changes
- Dependency updates

**How to submit**:
- Title: Clear action verb + what's changing
- Description: Why this change is needed
- Example: "Update ESLint config to fix warnings"
```

### UI Changes
```
**Purpose**: Visual and frontend modifications
- Layout changes
- Styling updates
- Component modifications
- Responsive design fixes

**How to submit**:
- Title: [Page/Component] + Change description
- Include: Current vs desired behavior
- Attach: Screenshots or mockups if possible
- Example: "Dashboard - Increase card spacing on mobile"
```

### New Feature Requests
```
**Purpose**: New functionality to be added
- New pages or components
- New API endpoints
- New user capabilities

**How to submit**:
- Title: Brief feature name
- Description: What the feature should do
- User story format helps: "As a [user], I want [feature] so that [benefit]"
- Include: Acceptance criteria (how to know it's done)
- Example: "Add export to CSV button on payments table"
```

### Bug Reports
```
**Purpose**: Defects and issues to fix
- Broken functionality
- Error messages
- Incorrect behavior

**How to submit**:
- Title: [Area] - Brief problem description
- Include: Steps to reproduce
- Include: Expected vs actual behavior
- Include: Browser/environment if relevant
- Example: "Login - 500 error when email contains '+'"
```

---

## Implementation Phases

### Phase 1: Trello Board Setup (Today)

1. **Create new labels on Mikro board:**
   - `CLAUDE-REVIEWING` (orange)
   - `AWAITING-PROCEED` (yellow)
   - `IN-IMPLEMENTATION` (blue)
   - `READY-FOR-USER-TEST` (purple)

2. **Update list descriptions** with submission guidelines

3. **Save workflow configuration** to MEMORY.md for persistence

### Phase 2: Trello Native Notifications

1. **Enable Google Chat Power-Up** on Mikro board
2. **Set up Butler rules** for email alerts

### Phase 3: Claude Cron Briefing System

1. **Create skill file** at `~/.claude/skills/daily-briefing/SKILL.md`
2. **Create briefing script** at `~/.claude/scripts/morning-briefing.sh`
3. **Create notification dispatcher**
4. **Add to crontab**

### Phase 4: macOS Launch Integration

1. **Create LaunchAgent** for login notification (optional)
2. **Configure notification action** to open VS Code/Claude Code

---

## Files to Create

| File | Purpose |
|------|---------|
| `~/.claude/skills/daily-briefing/SKILL.md` | Briefing generation skill |
| `~/.claude/skills/trello-monitor/SKILL.md` | Request analysis skill |
| `~/.claude/scripts/morning-briefing.sh` | Cron entry point |
| `~/.claude/scripts/dispatch-notifications.sh` | Multi-channel dispatcher |
| `~/.claude/notification-config.json` | Recipients and webhooks |
| `~/.claude/trello-state/` | Cached state for change detection |

---

## Session Commands

| You Say | Claude Does |
|---------|-------------|
| "Check Trello for requests" | Scans all 4 lists, analyzes cards, posts questions/summaries |
| "Show work queue" | Lists all approved items ready to implement |
| "Start working" | Begins implementation of approved items |
| "Testing time" | Reviews items in "Needs Testing" with you |
| "Deploy approved items" | Commits and pushes all items in "Ready to Deploy" |
