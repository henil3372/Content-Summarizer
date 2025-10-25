# Instagram Reel Summarizer

A full-stack application that extracts, transcribes, and summarizes Instagram Reels using AI.

## Features

- **Video Resolution**: Uses Apify's Instagram Reel Scraper to extract direct video URLs from public Instagram Reels
- **Audio Transcription**: Leverages OpenAI's Whisper or GPT-4o transcription models to convert audio to text with timestamps
- **AI Summarization**: Generates structured summaries with key points, TL;DR, named entities, and key moments using OpenAI's GPT models
- **Job Queue System**: Background processing with real-time status updates
- **History & Search**: View past jobs with pagination, filtering, and full-text search
- **Video Viewing**: Direct access to original Instagram video from results
- **Process Management**: Delete completed or failed processes with confirmation
- **Modern UI**: Beautiful glassmorphism design with animated beams background
- **Query Parameter API**: Submit videos via GET request with URL parameter

## Tech Stack

### Backend
- **Node.js + Express**: REST API server
- **TypeScript**: Type-safe server code
- **Apify Client**: Instagram Reel data extraction
- **OpenAI SDK**: Audio transcription and text summarization
- **File-based Storage**: JSON files for job persistence

### Frontend
- **React + TypeScript**: Interactive UI
- **Vite**: Fast development and build tooling
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Beautiful icons

## Architecture

### Backend Flow
1. **Ingest** - Validate Instagram URL, create job, enqueue
2. **Resolve Video** - Use Apify to fetch reel metadata and video URL
3. **Download** - Stream video to temp directory with size/type checks
4. **Transcribe** - Submit to OpenAI Transcriptions API
5. **Summarize** - Generate structured summary via OpenAI Responses API
6. **Persist** - Save results as JSON with atomic writes

### API Endpoints

- `POST /api/reels/ingest` - Submit a reel URL (request body)
- `GET /api/reels/process?url=REEL_URL` - Submit a reel URL via query parameter
- `GET /api/reels/:id/status` - Poll job progress
- `GET /api/reels/:id` - Get full job result (includes videoUrl)
- `GET /api/reels` - List jobs with filtering
- `POST /api/reels/:id/retry` - Retry failed jobs
- `DELETE /api/reels/:id` - Delete a process and its results

### Frontend Pages

- **Submit** - Enter Instagram Reel URL with modern glassmorphism design
- **Status** - Real-time progress with 2-second polling
- **Details** - View transcript and structured summary
- **History** - Browse past jobs with search, filters, video viewing, and delete actions

## Setup

### Prerequisites

- Node.js 18+
- Apify account and API token
- OpenAI API key

### Environment Variables

Create a `.env` file in the project root:

```env
# Apify Configuration
APIFY_TOKEN=your_apify_token_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
DATA_DIR=./data
TEMP_DIR=./temp

# Model Configuration
TRANSCRIPTION_MODEL=whisper-1
SUMMARIZATION_MODEL=gpt-4o-mini
```

### Installation

```bash
npm install
```

### Running the Application

**Terminal 1 - Backend Server:**
```bash
npm run server
```

**Terminal 2 - Frontend Dev Server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:3001`.

## Configuration Options

### Transcription Models

- `whisper-1` - Standard Whisper model with verbose JSON output and segment timestamps
- `gpt-4o-audio-preview` - Higher-quality transcription with 25MB upload limit
- `gpt-4o-mini-audio-preview` - Faster, cost-effective transcription

Set via `TRANSCRIPTION_MODEL` environment variable.

### Summarization Models

- `gpt-4o-mini` (default) - Fast and cost-effective
- `gpt-4o` - Higher quality summaries
- `gpt-4.1` - Latest GPT-4 Turbo

Set via `SUMMARIZATION_MODEL` environment variable.

## File Limits & Constraints

- **Video Size**: 25MB maximum (OpenAI transcription limit)
- **Supported Formats**: mp3, mp4, mpeg, mpga, m4a, wav, webm
- **Download Timeout**: 120 seconds
- **Rate Limiting**: 10 requests per minute per IP on ingest endpoint

## Security Features

- CORS protection - only allows configured frontend origin
- Instagram URL validation - rejects non-Instagram domains
- Rate limiting on ingest endpoint
- Temp file cleanup after processing
- No persistent storage of video files

## Data Storage

All job results are stored as pretty-printed JSON files in the `./data` directory:

```
data/
  ├── {job-id-1}.json
  ├── {job-id-2}.json
  └── ...
```

Each file contains:
- Job metadata (ID, URLs, timestamps)
- Full transcript with optional segments
- Structured summary
- Model information
- Performance metrics

## Error Handling

The application handles various error scenarios:

- Invalid or private Instagram URLs
- Missing video URLs from Apify
- Download failures (timeout, wrong content type)
- Files exceeding size limits
- Unsupported audio formats
- Transcription/summarization API errors

All errors include clear user-facing messages and are logged server-side.

## Development

### Type Checking
```bash
npm run typecheck
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Production Deployment

1. Set production environment variables
2. Build the frontend: `npm run build`
3. Serve static files from `./dist`
4. Run the backend server with process manager (PM2, systemd, etc.)
5. Configure reverse proxy (nginx, Caddy) for frontend and API

## Future Enhancements

- Support for batch processing multiple reels
- Database integration (PostgreSQL, MongoDB)
- User authentication and private job history
- Webhook notifications on job completion
- Advanced analytics and metrics dashboard
- Export summaries to PDF or Markdown

## License

MIT
