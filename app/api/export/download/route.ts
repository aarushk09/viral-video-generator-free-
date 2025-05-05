import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { tmpdir } from 'os';
import * as fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    console.log("Download API called");
    
    // Get video ID from query params
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get('id');
    
    console.log(`Requested video ID: ${videoId}`);
    
    if (!videoId) {
      console.error("No video ID provided");
      return NextResponse.json({ 
        success: false, 
        error: 'Video ID is required' 
      }, { status: 400 });
    }
    
    // Construct path to temp directory for this export
    const tempDir = join(tmpdir(), `video-export-${videoId}`);
    const videoPath = join(tempDir, 'output.mp4');
    
    console.log(`Looking for video at: ${videoPath}`);
    
    // Check if file exists
    if (!existsSync(videoPath)) {
      console.error(`Video file not found at ${videoPath}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Video not found' 
      }, { status: 404 });
    }
    
    // Read the file
    console.log("Reading video file");
    const videoBuffer = await readFile(videoPath);
    
    console.log(`Serving video file (size: ${videoBuffer.length} bytes)`);
    
    // Set appropriate headers for the response
    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="generated-video.mp4"`);
    headers.set('Content-Type', 'video/mp4');
    headers.set('Content-Length', videoBuffer.length.toString());
    
    // Return the video file
    return new Response(videoBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error serving video file:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to serve video file' 
      }, 
      { status: 500 }
    );
  }
} 