# Google Chat Integration Plan

## Current State

Every project in `notification-config.json` already has a `googleChat` block:
```json
"googleChat": {
  "enabled": false,
  "webhookUrl": null,
  "comment": "Pending Google Workspace admin approval for Trello integration"
}
```

The blocker noted was "Google Workspace admin approval." This was likely the **admin toggle** that controls whether users can add incoming webhooks to Chat spaces.

---

## What Needs to Happen

### Step 1: Google Workspace Admin Toggle (ONE-TIME, done by admin)

A Google Workspace admin for kaart.com must:

1. Go to **Google Admin Console** → https://admin.google.com
2. Navigate to **Apps → Google Workspace → Google Chat**
3. Click **Chat apps** (or "Manage Chat apps")
4. Find the setting: **"Allow users to add and use incoming webhooks"**
5. Toggle it to **ON**
6. Click **Save**

This is likely the step that was never completed — without this, the "Manage webhooks" / "Apps & integrations" option won't appear in Chat spaces.

**Who can do this**: Anyone with the "Service Settings administrator" privilege in Google Workspace. This is likely the Kaart Google Workspace admin (not Goose or Keeley specifically, unless they have admin roles).

### Step 2: Create Webhook URLs in Each Google Chat Space

Once the admin toggle is enabled:

1. Open **Google Chat** in a web browser (NOT the mobile app — webhooks can only be configured in the web UI)
2. Go to the relevant Chat space (e.g., "Mikro Updates", "Viewer Updates", etc.)
3. Click the **space name** at the top → select **Apps & integrations**
4. Click **Webhooks** → **Add webhooks**
5. Enter a name (e.g., "Mikro Trello Bot") and optionally an avatar URL
6. Click **Save**
7. **Copy the generated webhook URL** — it will look like:
   ```
   https://chat.googleapis.com/v1/spaces/XXXXX/messages?key=YYYYY&token=ZZZZZ
   ```
8. Repeat for each project space

### Step 3: Store Webhook URLs in Config

Update `~/.claude/notification-config.json` for each project:
```json
"googleChat": {
  "enabled": true,
  "webhookUrl": "https://chat.googleapis.com/v1/spaces/XXXXX/messages?key=YYYYY&token=ZZZZZ"
}
```

**SECURITY**: Webhook URLs are secrets — anyone with the URL can post to the space. The notification-config.json file is already local-only (not committed to git), so this is fine.

### Step 4: Build the Notification Script

Create a Python script (e.g., `scripts/gchat_notify.py`) that:

1. Reads webhook URL from `notification-config.json`
2. Sends formatted messages via HTTP POST
3. Supports both simple text and Card V2 formatted messages

**Simple text message:**
```python
import requests

def send_gchat_message(webhook_url, text):
    response = requests.post(webhook_url, json={"text": text})
    response.raise_for_status()
    return response.json()
```

**Rich card message (for daily briefings, status updates):**
```python
def send_gchat_card(webhook_url, title, subtitle, sections):
    card = {
        "cardsV2": [{
            "cardId": "statusCard",
            "card": {
                "header": {
                    "title": title,
                    "subtitle": subtitle
                },
                "sections": sections
            }
        }]
    }
    response = requests.post(webhook_url, json=card)
    response.raise_for_status()
    return response.json()
```

### Step 5: Integrate with Existing Workflow

Hook the notification script into existing automation points:

| Event | Message Content |
|-------|----------------|
| **Daily Briefing** (`/daily-briefing`) | Board summary, card counts by list, aging analysis |
| **New Card Analyzed** (trello-monitor) | "New request analyzed: [card name] — questions posted" |
| **Card Approved** (trello-monitor) | "Card approved: [card name] — starting implementation" |
| **Card Moved to Needs Testing** | "Ready for testing: [card name] — [link]" |
| **Card Deployed** | "Deployed: [card name] — live on mikro.kaart.com" |

### Step 6: Per-Project Chat Spaces

Ideal setup — one Chat space per project with its own webhook:

| Project | Chat Space Name | Config Key |
|---------|----------------|------------|
| Mikro | "Mikro Updates" | `projects.mikro.notifications.googleChat` |
| Viewer | "Viewer Updates" | `projects.viewer.notifications.googleChat` |
| GoKaart | "GoKaart Updates" | `projects.gokaart.notifications.googleChat` |
| Viewer Uploader | "Uploader Updates" | `projects.viewer-uploader.notifications.googleChat` |
| Mapbox Uploader | "Mapbox Updates" | `projects.mapbox-uploader.notifications.googleChat` |

---

## The Original Blocker

The comment "Pending Google Workspace admin approval for Trello integration" suggests you may have been looking for a **Trello-specific integration** in the Google Chat marketplace or admin console. That's a different (harder) path.

**The webhook approach doesn't need any marketplace integration or app approval.** It just needs:
1. The admin toggle enabled (Step 1)
2. Webhook URLs created in each space (Step 2)
3. A simple script to POST JSON (Step 4)

No OAuth, no API keys, no Google Cloud project, no app review. Just an HTTP POST to a URL.

---

## Implementation Effort

- **Step 1**: ~2 minutes (admin toggle)
- **Step 2**: ~5 minutes per space (create webhooks)
- **Steps 3-5**: ~1-2 hours of coding (notification script + integration into skills)

---

## Quick Test (once webhook URL exists)

```bash
curl -X POST \
  -H 'Content-Type: application/json' \
  'WEBHOOK_URL_HERE' \
  -d '{"text": "Hello from Mikro Trello Bot! Integration test successful."}'
```

If this returns HTTP 200 and the message appears in the Chat space, the integration works.

---

## Sources

- [Google Developers: Build a Chat app as a webhook](https://developers.google.com/workspace/chat/quickstart/webhooks)
- [Google Admin: Allow users to install Chat apps](https://support.google.com/a/answer/7651360?hl=en)
- [Allow Incoming Webhooks in Google Chat: Admin Guide](https://workspace123.com/manage-services/google-chat-settings/allow-incoming-webhooks/)
- [Python webhook example (GitHub Gist)](https://gist.github.com/gh640/4df1cf28bf2e1b8544487213e3fbd4fe)
- [Google official Python webhook sample](https://github.com/googleworkspace/google-chat-samples/blob/main/python/webhook/quickstart.py)
- [Google Chat webhook complete guide](https://softwareengineeringstandard.com/2025/09/01/google-chat-webhook/)
