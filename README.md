# Lecture Library


QU Lecture Library is a platform for students who miss class. If you cannot attend a lecture, you can visit the site, find your course, select the lecture you missed, and view detailed notes that explain exactly what the professor covered. These notes are generated from lecture recordings uploaded by other students, either from previous semesters or by someone who attended the class, allowing everyone to access the same in-depth explanations even if they were not there in person.

A video demo: https://drive.google.com/file/d/1J3paiYlzyWGG4227Bw-BhMcEz-qsM5oS/view
## Features

- Upload audio/video lectures under course codes
- Transcribe lectures with timestamped segments (stub by default; ElevenLabs STT when configured)
- Generate notes, flashcards, quizzes, and podcast scripts (stub by default; OpenAI via Python/LangChain when configured)
- Optional podcast audio generation via ElevenLabs TTS
- Public notes endpoint for sharing

## Tech Stack

- Backend: Node.js 20+, TypeScript, Fastify, Prisma (SQLite), Zod
- Frontend: React 18, TypeScript, Vite, Tailwind CSS

## Project Layout

```
src/         # Backend API + services
frontend/    # React app
prisma/      # Prisma schema and SQLite database
storage/     # Uploaded audio + generated outputs
```

## Backend Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create or update `.env` in the repo root:

```bash
PORT=3000
DATABASE_URL="file:./prisma/data/app.db"
STORAGE_ROOT=./storage

# Optional: ElevenLabs STT + TTS
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=

# Optional: OpenAI LLM (requires Python + requirements.txt)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-3.5-turbo
```

Notes:
- Prisma resolves paths relative to `prisma/schema.prisma`, so `file:./prisma/data/app.db` keeps the CLI and server aligned.
- `GEMINI_API_KEY` and `ANTHROPIC_API_KEY` are present in config but not wired to real providers yet.

### 3. Set up the database

```bash
npm run prisma:generate
npm run prisma:push
```

### 4. Run the API

```bash
npm run dev
```

The server runs at `http://localhost:3000`.

## OpenAI LLM (Optional)

The OpenAI summarizer uses Python + LangChain when `OPENAI_API_KEY` is set.

```bash
pip install -r requirements.txt
```

Quick check:

```bash
python scripts/test_pipeline.py
```

If no API keys are set, the backend falls back to stub transcript and stub note generation.

## Frontend

See `frontend/README.md` for full details. Quick start:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and calls the backend at `http://localhost:3000` by default.

## API Docs

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs/json`

## Smoke Test

Run the end-to-end pipeline (course → upload → process → outputs):

```bash
npm run smoke
```

## License

MIT
