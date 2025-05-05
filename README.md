# Viral Video Generator

Generate viral videos with AI-powered audio and captions.

## Features

- Generate stories using AI
- Convert text to speech with high-quality voices
- **Advanced Auto-Captions** with accurate timing and smooth visual presentation
- Preview video with captions
- Multiple voice options

## Enhanced Caption System

The auto-caption system now uses a multi-tiered approach:

1. **Primary Method**: OpenAI Whisper API for accurate speech-to-text with word-level timing
2. **Secondary Method**: Forced alignment algorithm that maps the original text to the audio duration
3. **Fallback Method**: Simple text chunking with estimated timing

### Caption Features

- Word-level timing for precise caption display
- Smooth transitions between caption segments
- Improved visual appearance with backdrop blur and animation
- Caption lookahead for natural timing

## Environment Variables

The following environment variables can be used to configure the application:

- `GROQ_API_KEY` - API key for Groq text-to-speech service
- `WHISPER_API_KEY` - API key for OpenAI Whisper speech-to-text service (optional)

## Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Technologies Used

- Next.js
- Tailwind CSS
- shadcn/ui components
- Groq AI for text generation
- Groq TTS for text-to-speech