# Lecture Library Backend

A production-lean, hackathon-friendly backend for a "Lecture Library" application. This backend accepts recorded lecture audio/video files, transcribes them with timestamps, generates study materials (notes, flashcards, quizzes), and optionally creates podcast-style audio recaps.

## Features

- 📹 **Upload lectures** - Accept audio/video files under course codes
- 🎤 **Speech-to-Text** - Transcribe lectures with timestamped segments
- 📝 **Generate Notes** - Create short and detailed class notes with time citations
- 🎴 **Flashcards & Quizzes** - Generate study materials from lecture content
- 🎙️ **Podcast Recaps** - Create audio recaps using TTS (ElevenLabs)
- 🔍 **Public Access** - Access notes by course code and lecture number

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Fastify
- **Database**: SQLite with Prisma ORM
- **Validation**: Zod
- **Storage**: Local filesystem

## Prerequisites

- Node.js 20 or higher
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
npm install
```

**Note**: If you encounter npm install issues, try:
- Clearing npm cache: `npm cache clean --force`
- Using a different package manager: `yarn install` or `pnpm install`
- Checking Node.js version: `node --version` (should be 20+)

### 2. Set Up Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Or create it manually with:

```bash
# Server
PORT=3000

# Database
# Note: Prisma resolves paths relative to prisma/schema.prisma
# Using ./prisma/data/app.db keeps Prisma and server consistent
DATABASE_URL="file:./prisma/data/app.db"

# Storage
STORAGE_ROOT=./storage

# ElevenLabs TTS (optional)
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=

# LLM Providers (optional)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

**Important**: Prisma resolves file paths relative to `prisma/schema.prisma`. Using `DATABASE_URL="file:./prisma/data/app.db"` ensures both Prisma CLI and the server use the same database file. If you use `file:./data/app.db`, Prisma will create it at `prisma/data/app.db` instead.

**Note**: The system works end-to-end without any API keys using stub providers. Add keys to enable real STT, LLM generation, and TTS.

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database (creates tables)
npm run prisma:push
```

### 4. Start the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## Frontend

A beautiful React frontend is available in the `frontend/` directory. See [frontend/README.md](frontend/README.md) for detailed setup instructions.

### Quick Start

```bash
# Install frontend dependencies
cd frontend
npm install

# Start frontend dev server
npm run dev
```

The frontend will be available at `http://localhost:5173` and will automatically proxy API requests to the backend.

### Frontend Features

- 🎨 Beautiful UI with maroon red, navy blue, and deep yellow color scheme
- 📚 Course management interface
- 📤 Drag-and-drop lecture upload
- ⚡ Real-time processing status updates
- 📝 View transcripts, notes, flashcards, and quizzes
- 📱 Fully responsive design

## API Documentation

### Swagger UI

Interactive API documentation is available at:

- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI JSON**: http://localhost:3000/docs/json

The Swagger UI provides:
- Complete endpoint documentation
- Request/response schemas
- Try-it-out functionality
- Error response formats

## Smoke Test

Run the end-to-end smoke test to verify the complete pipeline:

```bash
npm run smoke
```

This script will:
1. Check server health
2. Create a test course
3. Upload a lecture file
4. Start processing
5. Poll for completion
6. Verify outputs are accessible

The smoke test works with stub providers (no API keys required).

## API Endpoints

### Health Check

```bash
GET /health
```

### Courses

#### Create Course

```bash
POST /api/courses
Content-Type: application/json

{
  "code": "CISC 121",
  "title": "Introduction to Data Structures"
}
```

#### List Courses

```bash
GET /api/courses
```

#### Get Course

```bash
GET /api/courses/:courseCode
```

### Lectures

#### Upload Lecture

```bash
POST /api/courses/:courseCode/lectures
Content-Type: multipart/form-data

Fields:
- lectureNumber: 5
- lectureTitle: "Stacks and Queues" (optional)
- file: <audio/video file>
```

#### List Lectures

```bash
GET /api/courses/:courseCode/lectures
```

#### Get Lecture Details

```bash
GET /api/courses/:courseCode/lectures/:lectureNumber
```

### Processing

#### Process Lecture (All-in-One)

```bash
POST /api/lectures/:lectureId/process
Content-Type: application/json

{
  "generate": {
    "notesShort": true,
    "notesDetailed": true,
    "flashcards": false,
    "quiz": false,
    "podcastScript": true
  },
  "prefs": {
    "tone": "friendly tutor",
    "difficulty": "intermediate",
    "lengthMinutes": 8,
    "focusTopics": ["stacks", "queues"]
  },
  "tts": {
    "enabled": true,
    "voiceId": null,
    "twoVoice": false
  }
}
```

#### Get Processing Status

```bash
GET /api/lectures/:lectureId/status
```

### Outputs

#### Get Transcript

```bash
GET /api/lectures/:lectureId/transcript
```

#### Get Notes

```bash
GET /api/lectures/:lectureId/notes?type=short
GET /api/lectures/:lectureId/notes?type=detailed
```

#### Get Flashcards

```bash
GET /api/lectures/:lectureId/flashcards
```

#### Get Quiz

```bash
GET /api/lectures/:lectureId/quiz
```

#### Get Podcast Script

```bash
GET /api/lectures/:lectureId/podcast/script
```

#### Get Podcast Audio

```bash
GET /api/lectures/:lectureId/podcast/audio
```

### Public Access

#### Get Notes by Course and Lecture Number

```bash
GET /api/public/:courseCode/lecture/:lectureNumber/notes?type=short
GET /api/public/:courseCode/lecture/:lectureNumber/notes?type=detailed
```

## Example Workflow

### 1. Create a Course

```bash
curl -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "code": "CISC 121",
    "title": "Introduction to Data Structures"
  }'
```

Response:
```json
{
  "id": 1,
  "code": "CISC 121",
  "title": "Introduction to Data Structures",
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

### 2. Upload a Lecture

```bash
curl -X POST http://localhost:3000/api/courses/CISC%20121/lectures \
  -F "lectureNumber=5" \
  -F "lectureTitle=Stacks and Queues" \
  -F "file=@lecture05.mp3"
```

Response:
```json
{
  "lectureId": 1,
  "courseCode": "CISC 121",
  "lectureNumber": 5,
  "lectureTitle": "Stacks and Queues",
  "status": "uploaded",
  "createdAt": "2024-01-15T10:05:00.000Z"
}
```

### 3. Process the Lecture

```bash
curl -X POST http://localhost:3000/api/lectures/1/process \
  -H "Content-Type: application/json" \
  -d '{
    "generate": {
      "notesShort": true,
      "notesDetailed": true,
      "flashcards": false,
      "quiz": false,
      "podcastScript": true
    },
    "prefs": {
      "tone": "friendly tutor",
      "difficulty": "intermediate"
    },
    "tts": {
      "enabled": true
    }
  }'
```

Response:
```json
{
  "lectureId": 1,
  "status": "transcribing",
  "jobStarted": true,
  "message": "Processing job enqueued"
}
```

### 4. Check Processing Status

```bash
curl http://localhost:3000/api/lectures/1/status
```

Response (while processing):
```json
{
  "status": "generating",
  "errorMessage": null,
  "updatedAt": "2024-01-15T10:06:00.000Z"
}
```

Response (when complete):
```json
{
  "status": "complete",
  "errorMessage": null,
  "updatedAt": "2024-01-15T10:08:00.000Z"
}
```

### 5. Fetch Notes (Public Endpoint)

```bash
curl http://localhost:3000/api/public/CISC%20121/lecture/5/notes?type=short
```

Response (Markdown):
```markdown
# Lecture Notes

- STT (Speech-to-Text) is not configured... (0:00–0:05)
- This is a placeholder transcript... (0:05–0:10)
...
```

## Storage Layout

Files are stored in the following structure:

```
storage/
├── audio/
│   └── {course_code}/
│       └── {lecture_id}_{filename}
└── outputs/
    └── {course_code}/
        └── {lecture_id}/
            ├── transcript.json
            ├── transcript.txt
            ├── notes_short.md
            ├── notes_detailed.md
            ├── flashcards.json (optional)
            ├── quiz.json (optional)
            ├── podcast_script.txt (optional)
            └── podcast_audio.mp3 (optional)
```

## Database Schema

### Course

- `id`: Primary key
- `code`: Unique course code (e.g., "CISC 121")
- `title`: Course title
- `createdAt`: Creation timestamp

### Lecture

- `id`: Primary key
- `courseId`: Foreign key to Course
- `lectureNumber`: Lecture number (unique per course)
- `lectureTitle`: Optional lecture title
- `audioFilename`: Original filename
- `audioPath`: Path to stored audio file
- `status`: Processing status (uploaded | transcribing | transcribed | generating | voiced | complete | failed)
- `transcriptJsonPath`: Path to JSON transcript
- `transcriptTextPath`: Path to plain text transcript
- `notesShortMdPath`: Path to short notes
- `notesDetailedMdPath`: Path to detailed notes
- `flashcardsJsonPath`: Path to flashcards JSON
- `quizJsonPath`: Path to quiz JSON
- `podcastScriptPath`: Path to podcast script
- `podcastAudioMp3Path`: Path to podcast MP3
- `errorMessage`: Error message if processing failed
- `createdAt`, `updatedAt`: Timestamps

## Adding Real Providers

### Speech-to-Text (STT)

To add a real STT provider, implement the `STTProvider` interface in `src/services/stt.ts`:

```typescript
class YourSTTProvider implements STTProvider {
  async transcribe(audioPath: string): Promise<Transcript> {
    // Your implementation
  }
}
```

Then update `getSTTProvider()` to return your provider when API keys are present.

### LLM Generation

To add a real LLM provider, implement the `LLMProvider` interface in `src/services/generator.ts`:

```typescript
class YourLLMProvider implements LLMProvider {
  async generateNotes(transcript: Transcript, options: GenerationOptions) {
    // Your implementation
  }
}
```

Update `getGeneratorProvider()` to use your provider.

### Text-to-Speech (TTS)

ElevenLabs TTS is already integrated. To add another provider, extend `src/services/tts.ts` with a new function or provider class.

## Development

### Prisma Studio

View and edit database records:

```bash
npm run prisma:studio
```

### Database Migrations

If you modify the Prisma schema:

```bash
npm run prisma:migrate
```

Or push changes directly (development only):

```bash
npm run prisma:push
```

## Error Handling

All errors return consistent JSON responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

Common error codes:
- `COURSE_NOT_FOUND`: Course doesn't exist
- `LECTURE_NOT_FOUND`: Lecture doesn't exist
- `DUPLICATE_COURSE`: Course code already exists
- `DUPLICATE_LECTURE`: Lecture number already exists for course
- `INVALID_FILE_TYPE`: Uploaded file type not allowed
- `FILE_TOO_LARGE`: File exceeds size limit
- `ALREADY_PROCESSING`: Lecture is currently being processed
- `TRANSCRIPT_NOT_FOUND`: Transcript not available
- `NOTES_NOT_FOUND`: Notes not available

## License

MIT
