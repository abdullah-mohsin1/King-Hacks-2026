# Lecture Library Frontend

A beautiful, modern frontend for the Lecture Library application built with React, TypeScript, and Tailwind CSS.

## Features

- 🎨 **Beautiful UI** with maroon red, navy blue, and deep yellow color scheme
- 📚 **Course Management** - Create and browse courses
- 📤 **Lecture Upload** - Drag-and-drop file upload
- ⚡ **Real-time Processing** - Watch processing status updates
- 📝 **Study Materials** - View transcripts, notes, flashcards, and quizzes
- 📱 **Responsive Design** - Works on all devices

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - API client
- **Lucide React** - Icons

## Setup

### Prerequisites

- Node.js 20+
- Backend server running on `http://localhost:3000`

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:3000
```

If not set, it defaults to `http://localhost:3000`.

## Project Structure

```
frontend/
├── src/
│   ├── api/          # API client and types
│   ├── components/    # Reusable components
│   ├── pages/        # Page components
│   ├── App.tsx       # Main app component
│   ├── main.tsx      # Entry point
│   └── index.css     # Global styles
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

## Color Scheme

The app uses a custom color palette:

- **Maroon Red** (`maroon-950`): `#800020` - Primary actions, errors
- **Navy Blue** (`navy-950`): `#001f3f` - Headers, primary buttons
- **Deep Yellow** (`yellow-950`): `#cc9900` - Accents, highlights

## API Integration

The frontend communicates with the backend API through the `src/api/client.ts` module, which provides typed functions for all API endpoints.

## Development Notes

- The frontend proxies API requests to `http://localhost:3000` in development
- All API calls are typed with TypeScript
- Error handling is implemented at the API client level
- Real-time status updates use polling (every 2 seconds)

