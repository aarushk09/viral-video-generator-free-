import { NextRequest, NextResponse } from "next/server";
import Groq from 'groq-sdk';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { promisify } from 'util';
import { setTimeout } from 'timers/promises';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Interface definitions
interface Word {
  word: string;
  start: number;
  end: number;
}

interface Segment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
  words?: Word[]; // Make words optional as it might not be present
}

interface TranscriptionResponse {
  text: string;
  segments: Segment[];
  language: string;
  }
  
interface CaptionSegment {
  text: string;
  startTime: number;
  endTime: number;
}

/**
 * Convert transcription segments directly into caption segments.
 */
function mapSegmentsToCaptions(segments: Segment[]): CaptionSegment[] {
  if (!segments || segments.length === 0) {
    console.warn("No segments found in transcription response to map to captions.");
    return [];
  }
  
  return segments.map(segment => ({
    text: segment.text.trim(),
    startTime: segment.start,
    endTime: segment.end
  }));
}

/**
 * Generate captions based on text input when transcription fails.
 * This creates time-based segments by estimating word durations.
 */
function generateTextBasedCaptions(text: string, totalDuration: number = 0): CaptionSegment[] {
  // If we don't have a duration estimate, use a default speaking rate
  if (!totalDuration || totalDuration <= 0) {
    // Estimate ~3 words per second as average speaking rate
    const wordCount = text.split(/\s+/).length;
    totalDuration = wordCount / 3;
  }
  
  // Split text into sentences or chunks for captions
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const captions: CaptionSegment[] = [];
  
  // Distribute time proportionally based on character count
  const totalChars = sentences.reduce((sum, sentence) => sum + sentence.length, 0);
  let currentTime = 0;
  
  sentences.forEach(sentence => {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) return;
    
    // Calculate duration based on proportion of total text
    const proportion = trimmedSentence.length / totalChars;
    const duration = totalDuration * proportion;
    
    captions.push({
      text: trimmedSentence,
      startTime: currentTime,
      endTime: currentTime + duration
    });
    
    currentTime += duration;
  });
  
  return captions;
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3, 
  initialDelay: number = 1000
): Promise<T> {
  let retries = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      retries++;
      
      // If we've reached max retries or it's not a connection error, throw
      if (retries >= maxRetries || 
          !(error.message?.includes('Connection error') || 
            error.code === 'ECONNRESET' || 
            error.errno === 'ECONNRESET')) {
        throw error;
      }
      
      console.log(`Retry ${retries}/${maxRetries} after ${delay}ms due to connection error`);
      await setTimeout(delay);
      
      // Exponential backoff with jitter
      delay = delay * 2 * (0.5 + Math.random() * 0.5);
    }
  }
}

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null; // Keep track of temp file path
  try {
    const { text, voice = "Fritz-PlayAI" } = await request.json();
    console.log("TTS Request received:", { textLength: text?.length || 0, voice });

    if (!text) {
      console.error("No text provided for TTS");
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Step 1: Generate audio using Groq TTS API
    console.log("Generating speech with Groq TTS...");
    const audioResponse = await groq.audio.speech.create({
      model: "playai-tts",
      voice: voice,
      input: text,
      response_format: "wav"
    });
    
    // Get the binary audio data
    const audioData = await audioResponse.arrayBuffer();
    const audioBuffer = Buffer.from(audioData);
    
    // Step 2: Save the audio to a temporary file for transcription
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `tts-${Date.now()}.wav`);
    const writeFile = promisify(fs.writeFile);
    await writeFile(tempFilePath, audioBuffer);
    console.log(`Temporary audio file saved to: ${tempFilePath}`);
    
    // Step 3: Transcribe the audio with Whisper to get accurate timestamps
    console.log("Transcribing audio to get accurate timestamps...");
    
    let captionSegments: CaptionSegment[] = [];
    let transcriptionSource = "groq-segment";
    
    try {
      // Try to transcribe with retries for connection issues
      const transcriptionResponse = await retryWithBackoff(async () => {
        const fileStream = fs.createReadStream(tempFilePath);
        return await groq.audio.transcriptions.create({
          file: fileStream,
          model: "whisper-large-v3",
          response_format: "verbose_json", // Request verbose JSON for segments
          timestamp_granularities: ["segment"] // Explicitly request only segment timestamps
        });
      }, 2); // Try up to 2 retries (3 attempts total)
      
      // Step 4: Process transcription segments to get caption segments
      const transcription = transcriptionResponse as unknown as TranscriptionResponse;
      console.log(`Transcription received with ${transcription.segments?.length || 0} segments.`);
      captionSegments = mapSegmentsToCaptions(transcription.segments);
    } catch (transcriptionError: any) {
      console.error("Transcription failed, using fallback caption generation:", transcriptionError);
      
      // Fallback: Generate captions based on the original text
      // Estimate audio duration based on text length (rough approximation)
      const wordCount = text.split(/\s+/).length;
      const estimatedDuration = wordCount / 3; // ~3 words per second
      
      captionSegments = generateTextBasedCaptions(text, estimatedDuration);
      transcriptionSource = "text-based-fallback";
      
      console.log(`Generated ${captionSegments.length} fallback caption segments based on text.`);
    }
    
    // Convert audio to base64 for response
    const audioBase64 = audioBuffer.toString('base64');
    
    console.log("TTS and caption generation complete:", {
      audioSize: audioBase64.length,
      captionsCount: captionSegments.length
    });
    
    // Return the combined result
    return NextResponse.json({
      audio: audioBase64,
      captions: captionSegments,
      text: text,
      transcriptionSource: transcriptionSource
    });

  } catch (error: any) {
    console.error("Error in TTS/Transcription API:", error);
    
    // Handle specific error cases (e.g., terms acceptance, rate limiting)
    if (error.message && error.message.includes("terms")) {
      return NextResponse.json({
        error: "Terms acceptance required",
        details: "You need to accept the terms for PlayAI TTS model on the Groq console.",
        requiresTermsAcceptance: true
      }, { status: 403 });
    }
    if (error.status === 429) {
      return NextResponse.json({
        error: "Rate limit exceeded",
        details: error.message,
        status: 429
      }, { status: 429 });
    }
    
    // General error response
    return NextResponse.json(
      { error: "Failed to process request", details: error.message },
      { status: 500 }
    );
  } finally {
    // Step 5: Clean up the temporary file in a finally block
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        const unlinkFile = promisify(fs.unlink);
        await unlinkFile(tempFilePath);
        console.log(`Temporary audio file deleted: ${tempFilePath}`);
      } catch (cleanupError) {
        console.error(`Error deleting temporary file ${tempFilePath}:`, cleanupError);
      }
    }
  }
}