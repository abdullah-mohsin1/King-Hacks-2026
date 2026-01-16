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
   # Or create manually with the content from README.md
   ```

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

   # Create a course
   curl -X POST http://localhost:3000/api/courses \
     -H "Content-Type: application/json" \
     -d '{"code": "CISC 121", "title": "Intro to Data Structures"}'
   ```

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
- Make sure `data/` directory exists and is writable
- Run `npm run prisma:push` again

**Port already in use:**
- Change `PORT` in `.env` to a different port

**File upload fails:**
- Check file size (max 200MB)
- Check file type (mp3, m4a, wav, mp4)

