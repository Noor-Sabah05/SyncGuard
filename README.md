# SyncGuard - Decision Conflict Catcher

SyncGuard helps co-founding teams stay aligned by logging decisions, detecting conflicts with prior choices, and generating daily action briefings.

## Why it exists
Fast-moving teams make fast decisions. SyncGuard turns those decisions into a living source of truth and highlights strategic misalignments before they become costly.

## Features
- Decision log with AI summaries
- Conflict detection with severity, explanation, and suggested resolution
- Conflict inbox to resolve or override decisions
- Daily briefing with prioritized tasks
- Voice note transcription to log decisions quickly
- Decision history timeline with conflict context

## Tech stack
- Next.js App Router
- React + TypeScript
- SQLite (better-sqlite3)
- Gemini API for reasoning and transcription

## How it works
1. A founder logs a decision (text, Slack paste, or voice note).
2. SyncGuard summarizes it and checks for conflicts against prior decisions.
3. Conflicts appear in the inbox with AI explanations and suggested resolutions.
4. The daily briefing surfaces today's priority actions.
5. All decisions and conflicts are stored locally in SQLite.

## Getting started
1. Install dependencies:
	```bash
	npm install
	```
2. Create a `.env` file:
	```bash
	GEMINI_API_KEY="your_api_key_here"
	```
3. Run the dev server:
	```bash
	npm run dev
	```
4. Open http://localhost:3000

## Core pages
- Dashboard: daily briefing and conflict count
- Log: submit decisions (text, Slack paste, voice)
- Conflicts: review and resolve or override conflicts
- History: timeline of all decisions and triggered conflicts

## API endpoints
- `GET /api/briefing` - daily briefing tasks
- `POST /api/log` - log a decision, detect conflicts
- `GET /api/conflicts` - open conflict inbox
- `POST /api/conflicts` - resolve or override a conflict
- `GET /api/history` - full decision history
- `POST /api/transcribe` - voice note transcription

## Data model (SQLite)
- `decisions`: founder, category, content, summary, created_at
- `conflicts`: decision_a_id, decision_b_id, severity, explanation, status

## Notes
- The SQLite database (`syncguard.db`) is created automatically on first run.
- Voice transcription uses the Gemini API.

## Roadmap ideas
- Multi-team workspaces and invites
- Analytics for recurring conflict themes
- Integrations (Slack, Notion, Linear)
- Hosted deployment option
