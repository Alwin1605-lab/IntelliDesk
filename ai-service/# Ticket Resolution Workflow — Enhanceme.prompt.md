# Ticket Resolution Workflow — Enhancement Plan

## Context

The POWERGRID helpdesk app (d:\hacksphere) currently:
- Classifies tickets via ML (category + team + priority)
- Shows AI suggestions (3 steps) in CreateTicket sidebar
- Assigns tickets to a technician and team on creation
- Displays `assignedTeam` badge on ticket header and detail page

## What We Can Do to Help Resolve Problems

### 1. Expand AI Suggestions (ai-service/app.py)
- Increase from 3 to 5–7 steps per category
- Add sub-category-aware steps (e.g. VPN vs DNS vs WiFi within "network")
- Add "escalation path" — who to call if steps don't resolve within X minutes
- Add checklist items with expected outcomes per step

### 2. Resolution Knowledge Base Panel (TicketDetail.jsx)
- Add a collapsible "Resolution Guide" section on the ticket detail page
- Show all AI suggestions (not just 3) with checkboxes the technician can tick off
- Track which steps were tried — persist in ticket `history`
- Link to internal KB articles relevant to the category

### 3. Similar Resolved Tickets (backend + frontend)
- Store resolved ticket summaries
- When a ticket is created, query similar resolved tickets by TF-IDF cosine similarity
- Show "Similar resolved tickets" panel: title + resolution summary + link
- Helps technician see what worked before for the same issue

### 4. Auto-Suggested Resolution Notes (on status change)
- When technician sets status → "resolved", auto-populate the resolution notes field
- Pre-fill with the AI suggestion steps that were applicable
- Technician edits/confirms before saving

### 5. Escalation Alerts (backend)
- If ticket stays "open" beyond 50% of SLA time without a comment, send alert
- If AI confidence < 40%, flag ticket for manual review with "Low confidence" badge
- If category = "security", auto-notify security team via email/socket

### 6. Team-Specific Resolution Templates
- Per-team canned responses the technician can insert with one click
- HR Team: onboarding checklist, replacement request form link
- Security Team: isolation procedure, incident report template
- Network Team: diagnostic command snippets (ping, tracert, ipconfig)

### 7. Resolution Time Predictor
- Train a simple regression model on historical resolved tickets
- Predict estimated resolution time based on category + priority + description length
- Show "Estimated resolution: ~2 hours" on ticket detail

### 8. Feedback Loop to Improve ML
- After ticket resolves, record (text → final_category) as a training sample
- Periodically retrain classifier with confirmed real data
- Track per-technician correction rate to measure model drift

## Implementation Priority

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 1 | Expand AI suggestions | Low | High |
| 2 | Resolution Guide panel with checkboxes | Medium | High |
| 3 | Similar resolved tickets | Medium | High |
| 4 | Auto-populate resolution notes | Low | Medium |
| 5 | Escalation alerts | Medium | Medium |
| 6 | Team-specific templates | Low | Medium |
| 7 | Resolution time predictor | High | Medium |
| 8 | Feedback loop retraining | High | High |

## Files to Modify

- `ai-service/app.py` — expanded suggestions, similarity endpoint
- `ai-service/models/classifier.py` — feedback loop retraining hook
- `backend/models/Ticket.js` — resolutionNotes, stepsTriedresolutionTime
- `backend/controllers/ticketController.js` — escalation logic, SLA alerts
- `frontend/src/pages/TicketDetail.jsx` — Resolution Guide panel, similar tickets
- `frontend/src/pages/CreateTicket.jsx` — similar tickets hint in sidebar
