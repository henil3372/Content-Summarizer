# Quick Start Guide

## Get Your API Keys

### 1. Apify Token

1. Visit [https://console.apify.com/](https://console.apify.com/)
2. Sign up or log in
3. Go to Settings → Integrations → API Token
4. Copy your API token

### 2. OpenAI API Key

1. Visit [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key immediately (you won't see it again)

## Configure Environment Variables

Edit the `.env` file in the project root and add your keys:

```env
APIFY_TOKEN=apify_api_xxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

The other variables are already configured with sensible defaults.

## Start the Application

### Terminal 1 - Start the Backend Server

```bash
npm run server
```

You should see:
```
Worker initialized
Server running on port 3001
```

### Terminal 2 - Start the Frontend

```bash
npm run dev
```

You should see:
```
VITE v5.4.8  ready in XXX ms

➜  Local:   http://localhost:5173/
```

## Use the Application

1. Open your browser to `http://localhost:5173`
2. Paste a public Instagram Reel URL (e.g., `https://www.instagram.com/reel/...`)
3. Click "Submit"
4. Watch the real-time progress as your reel is processed
5. View the transcript and AI-generated summary

## Example URLs to Try

Find public Instagram Reels from:
- Popular creators
- Brand accounts
- News outlets
- Educational content

**Note:** The reel must be public (not private or from a private account).

## Troubleshooting

### "No video URL found" error
- The reel might be private or deleted
- Try a different public reel

### "Video file too large" error
- The reel exceeds 25MB (OpenAI's limit)
- Try a shorter reel

### Backend not starting
- Ensure port 3001 is available
- Check that your API keys are valid

### Frontend not connecting to backend
- Verify the backend is running on port 3001
- Check browser console for CORS errors

## Performance Notes

- First job may take 30-60 seconds depending on reel length
- Transcription time varies with audio duration
- Summarization typically takes 2-5 seconds
- Results are cached locally for instant retrieval

## Cost Estimates (OpenAI)

- **Whisper-1**: ~$0.006/minute of audio
- **GPT-4o-mini**: ~$0.15-0.60 per 1M tokens (summaries use ~500-2000 tokens)

A typical 60-second reel costs approximately $0.01-0.02 to process.

## Need Help?

Check the main README.md for:
- Complete API documentation
- Architecture details
- Advanced configuration
- Production deployment guide
