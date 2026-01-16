# Quick Start Guide

## Prerequisites Check

```bash
node --version  # Should be 20 or higher
npm --version   # Any recent version
```

## Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```
   
   **Important**: The `.env.example` uses `DATABASE_URL="file:./prisma/data/app.db"` because Prisma resolves paths relative to `prisma/schema.prisma`. This ensures both Prisma CLI and the server use the same database file.

3. **Set up database:**
   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

5. **Test the API:**
   ```bash
   # Health check
   curl http://localhost:3000/health

   # View API docs
   open http://localhost:3000/docs  # or visit in browser

   # Create a course
   curl -X POST http://localhost:3000/api/courses \
     -H "Content-Type: application/json" \
     -d '{"code": "CISC 121", "title": "Intro to Data Structures"}'
   ```

6. **Run smoke test (optional):**
   ```bash
   npm run smoke
   ```
   
   This runs an end-to-end test: creates course → uploads lecture → processes → verifies outputs.

## What Works Without API Keys

The system works end-to-end with **stub providers** when no API keys are configured:

- ✅ **STT**: Generates placeholder transcript
- ✅ **Notes Generation**: Creates notes from transcript segments
- ✅ **Flashcards/Quiz**: Generates simple study materials
- ✅ **Podcast Script**: Creates a basic recap script
- ⚠️ **TTS**: Skips audio generation (gracefully, doesn't fail)

## Adding Real Providers

To enable real functionality, add API keys to your `.env`:

- `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` → Real TTS
- `OPENAI_API_KEY` → Real LLM generation (when implemented)
- `ANTHROPIC_API_KEY` → Real LLM generation (when implemented)

## Troubleshooting

**npm install fails:**
- Try: `npm cache clean --force && npm install`
- Or use: `yarn install` or `pnpm install`

**Database errors:**
- Make sure `prisma/data/` directory exists and is writable
- Check that `DATABASE_URL` in `.env` matches the path Prisma expects (relative to `prisma/schema.prisma`)
- Run `npm run prisma:push` again

**Port already in use:**
- Change `PORT` in `.env` to a different port

**File upload fails:**
- Check file size (max 200MB)
- Check file type (mp3, m4a, wav, mp4)

