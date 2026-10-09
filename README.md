# Meetly — meeting intelligence workspace

Meetly is an original, Fireflies-inspired meeting workspace built for the Scaler full-stack assignment. It turns transcripts into a practical library of summaries, chapters, action items, and synchronized conversation playback. It runs entirely without external AI services or API keys.

## What works

- Search meetings by title or participant, filter by date, and sort by recency
- Create meetings from pasted, timestamped transcript text
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

Prerequisites: Node.js 20+, npm 10+, and Python 3.11+.

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API is available at `http://localhost:8000`; interactive docs are at `http://localhost:8000/docs`. SQLite is created automatically at `backend/meetings.db`, and the demo meetings are seeded only when the database is empty.

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
cd frontend && npm run typecheck && npm run build
```

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
| `GET` | `/api/meetings` | List/search/filter/sort meetings |
| `POST` | `/api/meetings` | Create a meeting and parse transcript text |
| `GET` | `/api/meetings/{id}` | Return the complete meeting workspace |
| `PUT` | `/api/meetings/{id}` | Update metadata, participants, or notes |
| `DELETE` | `/api/meetings/{id}` | Delete a meeting and related data |
| `POST` | `/api/meetings/{id}/action-items` | Add an action item |
| `PATCH` | `/api/meetings/{id}/action-items/{itemId}` | Edit or complete an action item |
| `DELETE` | `/api/meetings/{id}/action-items/{itemId}` | Delete an action item |

`GET /api/meetings` supports `search`, `date_from`, `date_to`, and `sort=newest|oldest` query parameters.

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
- Authentication, external AI APIs, speech-to-text, calendar integrations, and exports are intentionally out of scope.
- The original assignment PDF referenced in the supplied brief was not present in the attachment; the detailed pasted requirements were treated as authoritative.

