import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

// Convert callback-based functions to Promise-based
const writeFileAsync = util.promisify(fs.writeFile);
const mkdirAsync = util.promisify(fs.mkdir);
const readFileAsync = util.promisify(fs.readFile);
const execAsync = util.promisify(require('child_process').exec);

// Function to check if FFmpeg is installed
async function checkFFmpeg() {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch (error) {
    console.error('FFmpeg is not installed or not in PATH');
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get video path from query params
    const { searchParams } = new URL(request.url);
    const videoPath = searchParams.get('path');
    
    if (!videoPath) {
      return NextResponse.json({
        success: false,
        error: 'Video path is required'
      }, { status: 400 });
    }
    
    // Check if FFmpeg is installed
    const hasFFmpeg = await checkFFmpeg();
    if (!hasFFmpeg) {
      return NextResponse.json({
        success: false,
        error: 'FFmpeg is not installed on the server'
      }, { status: 500 });
    }
    
    // Generate unique ID for this operation
    const operationId = uuidv4();
    
    // Create temp directory
    const tempDir = path.join(tmpdir(), `frame-extract-${operationId}`);
    
    if (!existsSync(tempDir)) {
      await mkdirAsync(tempDir, { recursive: true });
    }
    
    // Resolve the full video path
    let fullVideoPath;
    if (videoPath.startsWith('/')) {
      // It's a relative path from the project root
      fullVideoPath = path.join(process.cwd(), videoPath.slice(1));
    } else {
      // It's already an absolute path or something else
      fullVideoPath = videoPath;
    }
    
    // Check if the video file exists
    if (!fs.existsSync(fullVideoPath)) {
      return NextResponse.json({
        success: false,
        error: `Video file not found: ${fullVideoPath}`
      }, { status: 404 });
    }
    
    // Output frame path
    const framePath = path.join(tempDir, 'frame.jpg');
    
    // Use FFmpeg to extract the first frame
    const ffmpegArgs = [
      '-i', fullVideoPath, // Input video
      '-vframes', '1', // Extract just 1 frame
      '-q:v', '2', // Quality level (lower is better)
      framePath // Output image
    ];
    
    // Execute FFmpeg command
    return new Promise((resolve) => {
      const ffmpeg = spawn('ffmpeg', ffmpegArgs);
      
      ffmpeg.stderr.on('data', (data) => {
        console.log(`FFmpeg stderr: ${data}`);
      });
      
      ffmpeg.on('close', async (code) => {
        if (code !== 0) {
          resolve(NextResponse.json({
            success: false,
            error: `FFmpeg process exited with code ${code}`
          }, { status: 500 }));
          return;
        }
        
        try {
          // Read the extracted frame
          const frameBuffer = await readFileAsync(framePath);
          
          // Return the frame as a base64 string
          const base64Frame = frameBuffer.toString('base64');
          
          resolve(NextResponse.json({
            success: true,
            frameData: `data:image/jpeg;base64,${base64Frame}`
          }));
        } catch (error) {
          console.error('Error reading frame:', error);
          resolve(NextResponse.json({
            success: false,
            error: 'Failed to read extracted frame'
          }, { status: 500 }));
        }
      });
      
      ffmpeg.on('error', (err) => {
        console.error('FFmpeg process error:', err);
        resolve(NextResponse.json({
          success: false,
          error: 'Error extracting frame: ' + err.message
        }, { status: 500 }));
      });
    });
  } catch (error) {
    console.error('Error in frame extraction:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract frame'
    }, { status: 500 });
  }
}