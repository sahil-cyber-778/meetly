# Meetly — meeting intelligence workspace

Meetly is an original, Fireflies-inspired meeting workspace built for the Scaler full-stack assignment. It turns transcripts into a practical library of summaries, chapters, action items, and synchronized conversation playback. It runs entirely without external AI services or API keys.

## What works

- Search meetings by title or participant, apply participant/date-range filters, and sort by recency
- Switch between meeting list and card views
- Create meetings from pasted transcripts or uploaded TXT, VTT, and JSON files (up to 1 MB)
- Search titles, participants, and transcript content across the workspace; jump to matching timestamps
- Export transcripts, summaries, or full meeting notes as TXT or Markdown
- Edit and delete meetings with persisted SQLite changes
- View summaries, notes, participants, chapters, and speaker-labelled transcripts
- Search a transcript with highlighted matches
- Play/pause the simulated player, drag its seek bar, or click any transcript segment/chapter
- Keep the active transcript segment synchronized with playback time
- Add, edit, complete, and delete action items
- Responsive UI, modal forms, confirmation flows, loading/empty/error states, and toasts
- Five realistic seeded meetings, each containing a detailed multi-speaker transcript

## Technology

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide icons, Radix Dialog |
| Backend | Python 3.11+, FastAPI, SQLAlchemy 2, Pydantic |
| Database | SQLite locally; database URL is configurable |
| API | REST/JSON with OpenAPI docs |

## Project structure

```text
Meet_AI/
├── frontend/
│   ├── app/                 # Dashboard and meeting detail routes
│   ├── components/          # Sidebar, cards, modal, notifications
│   ├── lib/api.ts           # Typed API client
│   └── types/               # Shared frontend models
├── backend/
│   ├── main.py              # FastAPI app and CORS
│   ├── database.py          # SQLAlchemy engine/session
│   ├── models.py            # Relational database entities
│   ├── schemas.py           # Request/response validation
│   ├── routers/meetings.py  # REST endpoints
│   └── seed.py              # Idempotent demo dataset
└── README.md
```

## Local setup

Prerequisites: Node.js 22.18+ (for the TypeScript test runner), npm 10+ or pnpm, and Python 3.11+.

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API is available at `http://localhost:8000`; interactive docs are at `http://localhost:8000/docs`. SQLite is created automatically at `backend/meetings.db`. Demo meetings are seeded only when the meetings table is first created; deleting all meetings does not reseed them. Set `SEED_DEMO=false` to disable initial seeding. SQLite foreign keys are enforced.

### Frontend

```bash
cd frontend
copy .env.example .env.local   # use `cp` on macOS/Linux
npm install
npm run dev
```

Open `http://localhost:3000`.

### Verification

```bash
cd backend && pytest -q
cd frontend && npm run test && npm run typecheck && npm run build
```

Backend tests use temporary SQLite files and never modify the working database. Playback tests cover segment boundaries, silent gaps, and invalid seek times.

For browser tests, start separate QA servers: backend on port 8001 with `DATABASE_URL=sqlite:///./qa.db` and `CORS_ORIGINS=http://localhost:3001`; frontend on port 3001 with `NEXT_PUBLIC_API_URL=http://127.0.0.1:8001/api` and `NEXT_BUILD_DIR=.next-qa`. Use a fresh QA database for the full seeded workflow. With Chrome installed, run `npm run test:e2e` or `npm run test:e2e -- --timestamp-only` for the focused search-navigation regression. The test creates and deletes only its own temporary meeting. Override `E2E_BROWSER`, `E2E_BASE_URL`, and `E2E_API_URL` if needed.

## Database schema

- `meetings`: title, date, duration, creation timestamp
- `participants`: meeting participant names and optional email
- `transcript_segments`: speaker, start/end time, transcript text
- `summaries`: one overview and notes record per meeting
- `action_items`: assignee, description, completion state
- `chapters`: labelled timestamps for major sections

Every child record has a foreign key to `meetings`. SQLAlchemy relationships use `delete-orphan`, so deleting a meeting cascades to all related records.

## REST API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Deployment health check |
| `GET` | `/api/search?q=...` | Search titles, people, and transcript segments with timestamps |
| `GET` | `/api/meetings` | List/search/filter/sort meetings |
| `POST` | `/api/meetings` | Create a meeting and parse transcript text |
| `GET` | `/api/meetings/{id}` | Return the complete meeting workspace |
| `PUT` | `/api/meetings/{id}` | Update metadata, participants, or notes |
| `DELETE` | `/api/meetings/{id}` | Delete a meeting and related data |
| `POST` | `/api/meetings/{id}/action-items` | Add an action item |
| `PATCH` | `/api/meetings/{id}/action-items/{itemId}` | Edit or complete an action item |
| `DELETE` | `/api/meetings/{id}/action-items/{itemId}` | Delete an action item |
| `GET` | `/api/meetings/{id}/export` | Download TXT or Markdown; parameters: `format=txt\|md`, `content=all\|transcript\|summary` |

`GET /api/meetings` supports `search`, `participant`, `date_from`, `date_to`, and `sort=newest|oldest`. Creating a meeting accepts `transcript_format=txt|vtt|json` and `transcript_text`; the browser reads the selected file and sends its contents to the backend for validation and persistence. JSON accepts a segment array or `{ "segments": [...] }`, with `speaker`, `text`, `start_time`, and optional `end_time`. VTT supports voice tags and cue gaps. Timestamps must be ordered without overlaps and fit within the entered meeting duration.

## Deployment

### Backend on Railway

1. Create a Railway service from this repository and set the root directory to `backend`.
2. Attach a persistent volume, for example at `/data`.
3. Set `DATABASE_URL=sqlite:////data/meetings.db`.
4. Set `CORS_ORIGINS=https://your-frontend.vercel.app` (comma-separated values are accepted).
5. Railway uses `railway.json` to launch Uvicorn and check `/api/health`.

SQLite must live on the attached volume; storing it only in the deploy filesystem would lose changes on redeploy. A hosted PostgreSQL URL can be supplied later without changing the ORM models.

### Frontend on Vercel

1. Import the repository and select `frontend` as the root directory.
2. Set `NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api`.
3. Deploy with the standard Next.js preset.

## Assumptions

- Playback is deliberately simulated; no audio/video asset is required by the assignment.
- A transcript line may use `[MM:SS] Speaker: text`. Untimestamped lines are distributed across the entered duration and assigned to participants in order.
- Authentication, external AI APIs, speech-to-text, calendar integrations, and team collaboration are intentionally represented as permitted placeholders.
- Seeded summaries are mocked. New transcripts use an editable extractive overview from their first three segments; this does not call an AI service.
- The original Scaler assignment PDF was reviewed as the primary specification. Submission requires both a public repository URL and a working hosted demo URL. Deployment configuration is provided; a hosted demo must still be verified and supplied before submission. Improvements are kept on `feature/improvements` without automatically merging or deploying to production.

