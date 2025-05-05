import { NextRequest, NextResponse } from "next/server";

// Simple utility to estimate average word duration
function getWordDuration(word: string): number {
  // Shorter words are spoken more quickly, longer words more slowly
  const baseTime = 0.25; // average base time for a word in seconds
  const lengthFactor = 0.03; // additional time per character
  
  return baseTime + (word.length * lengthFactor); 
}

export async function POST(request: NextRequest) {
  try {
    // Get the text and audio data from the request
    const { audioData, text } = await request.json();

    if (!text && !audioData) {
      return NextResponse.json(
        { error: "Either text or audio data is required" }, 
        { status: 400 }
      );
    }

    // Generate captions from text
    const captionSegments = generateCaptionsFromText(text);
    
    return NextResponse.json({ 
      captions: captionSegments,
      fullTranscript: text,
      estimated: true,
    });
    
  } catch (error) {
    console.error("Error generating captions:", error);
    return NextResponse.json(
      { error: "Failed to generate captions", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Generate caption segments from text
function generateCaptionsFromText(text: string) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  // Split the text into sentences
  const sentences = text
    .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
    .split("|")
    .filter(s => s.trim().length > 0);
  
  // Calculate segment durations based on word count and lengths
  let currentTime = 0;
  const segments = [];
  
  for (const sentence of sentences) {
    // Skip empty sentences
    if (!sentence.trim()) continue;
    
    const segmentText = sentence.trim();
    const words = segmentText.split(/\s+/);
    
    // Calculate duration for this segment based on word lengths
    let segmentDuration = 0;
    for (const word of words) {
      segmentDuration += getWordDuration(word);
    }
    
    // Add a small pause at the end of sentences
    segmentDuration += 0.3;
    
    segments.push({
      text: segmentText,
      startTime: currentTime,
      endTime: currentTime + segmentDuration
    });
    
    currentTime += segmentDuration;
  }
  
  return segments;
} 