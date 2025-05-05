import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import sharp from 'sharp';

// Define interfaces for type safety
interface CaptionSegment {
  text: string;
  startTime: number;
  endTime: number;
}

interface CaptionSettings {
  text?: string;
  fontColor?: string;
  backgroundColor?: string;
  opacity?: number;
  fontSize?: number;
  position?: { x: number; y: number };
  style?: string;
}

// Define common aspect ratio dimensions
const aspectRatioDimensions = {
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 }
};

// Convert callback-based functions to Promise-based
const writeFileAsync = util.promisify(fs.writeFile);
const mkdirAsync = util.promisify(fs.mkdir);
const existsAsync = util.promisify(fs.exists);
const execAsync = util.promisify(require('child_process').exec);
const copyFileAsync = util.promisify(fs.copyFile);

// Function to check if FFmpeg is installed
async function checkFFmpeg() {
  try {
    // Re-enable the actual check
    await execAsync('ffmpeg -version');
    return true;
  } catch (error) {
    console.error('FFmpeg is not installed or not in PATH');
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Export API called");
    
    // Parse the JSON data from the request
    const data = await request.json();
    const { 
      audioData, 
      backgroundSrc, 
      captions = [] as CaptionSegment[], 
      captionSettings,
      aspectRatio = "9:16" // Default to 9:16 for vertical videos if not specified
    } = data;

    // Validate required data
    if (!audioData) {
      console.warn("Missing audio data in export request");
      return NextResponse.json({ 
        success: false, 
        error: 'Missing audio data' 
      }, { status: 400 });
    }

    // Check if FFmpeg is installed
    const hasFFmpeg = await checkFFmpeg();
    if (!hasFFmpeg) {
      return NextResponse.json({
        success: false,
        error: 'FFmpeg is not installed on the server. Video generation requires FFmpeg.'
      }, { status: 500 });
    }

    // Generate unique ID for this export
    const exportId = uuidv4();
    
    // Create temp directory for this export
    const tempDir = path.join(tmpdir(), `video-export-${exportId}`);
    console.log(`Creating temp directory: ${tempDir}`);
    
    if (!existsSync(tempDir)) {
      await mkdirAsync(tempDir, { recursive: true });
    }
    
    // Decode and save audio file
    console.log("Saving audio data");
    const audioFilePath = path.join(tempDir, 'audio.wav');
    const audioBuffer = Buffer.from(audioData, 'base64');
    await writeFileAsync(audioFilePath, audioBuffer);
    
    // Path to minecraft video
    const minecraftVideoPath = path.join(tempDir, 'minecraft-background.mp4');
    
    // Copy the Minecraft video to our temp folder
    try {
      // Correct the source path to point to the public directory
      const sourceVideoPath = path.join(process.cwd(), 'public', 'videos', 'minecraft-v1.mp4');
      console.log(`Copying Minecraft video from: ${sourceVideoPath} to ${minecraftVideoPath}`);
      await copyFileAsync(sourceVideoPath, minecraftVideoPath);
    } catch (err) {
      console.error("Error copying Minecraft video:", err);
      return NextResponse.json({
        success: false,
        error: 'Failed to load Minecraft background video'
      }, { status: 500 });
    }
    
    // We still keep the original background process for potential future use
    // but it won't be used in the video output
    const bgImagePath = path.join(tempDir, 'background.png');
    // Only process background image if provided
    if (backgroundSrc) {
      const imageUrl = backgroundSrc.startsWith('http') 
        ? backgroundSrc 
        : `${request.nextUrl.origin}${backgroundSrc}`;
      
      try {
        // Fetch the image
        const imageResponse = await fetch(imageUrl);
        const imageArrayBuffer = await imageResponse.arrayBuffer();
        const imageBuffer = Buffer.from(imageArrayBuffer);
        
        // Get dimensions based on aspectRatio
        const dimensions = aspectRatioDimensions[aspectRatio as keyof typeof aspectRatioDimensions] || 
                        aspectRatioDimensions["16:9"]; // Fallback to 16:9
        
        console.log(`Using aspect ratio: ${aspectRatio} (${dimensions.width}x${dimensions.height})`);
        
        // Convert the image to a valid PNG using sharp
        console.log("Converting background image to PNG");
        const pngBuffer = await sharp(imageBuffer)
          .resize(dimensions.width, dimensions.height, {
            fit: 'cover',
            position: 'center'
          }) // Resize based on selected aspect ratio
          .toFormat('png')
          .toBuffer();
        await writeFileAsync(bgImagePath, pngBuffer);
      } catch (err) {
        console.error("Error processing background image:", err);
        // Not critical since we're using the Minecraft video instead
      }
    }
    
    // Generate subtitle file (SRT format)
    console.log("Generating subtitle file");
    const subtitlePath = path.join(tempDir, 'captions.srt');
    
    let srtContent = '';
    captions.forEach((caption: CaptionSegment, index: number) => {
      if (caption && typeof caption.text === 'string' && 
          typeof caption.startTime === 'number' && 
          typeof caption.endTime === 'number') {
        
        // Format start and end times as HH:MM:SS,mmm
        const formatTime = (seconds: number): string => {
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          const secs = Math.floor(seconds % 60);
          const millis = Math.floor((seconds % 1) * 1000);
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
        };
        
        srtContent += `${index + 1}\n`;
        srtContent += `${formatTime(caption.startTime)} --> ${formatTime(caption.endTime)}\n`;
        srtContent += `${caption.text}\n\n`;
      }
    });
    
    await writeFileAsync(subtitlePath, srtContent);
    
    // Output file path
    const outputPath = path.join(tempDir, 'output.mp4');
    
    // Generate the video using FFmpeg
    console.log("Generating video with FFmpeg");
    
    // Font settings from captionSettings
    const fontSize = captionSettings?.fontSize || 24;
    const fontColor = captionSettings?.fontColor || 'white';
    const bgColor = captionSettings?.backgroundColor || '#000000';
    const opacity = (captionSettings?.opacity || 0.7) * 255;
    const bgColorWithAlpha = `${bgColor}${Math.round(opacity).toString(16).padStart(2, '0')}`;
    
    // Escape the subtitle path for the FFmpeg filter string on Windows
    // FFmpeg filter syntax requires escaping colons and backslashes.
    const escapedSubtitlePath = subtitlePath
      .replace(/\\/g, '/')      // Replace backslashes with forward slashes
      .replace(/:/g, '\\:');   // Escape the colon after the drive letter
    
    // Build FFmpeg command using the Minecraft video as background instead of static image
    const ffmpegArgs = [
      '-i', minecraftVideoPath,                      // Input Minecraft video (instead of static image)
      '-i', audioFilePath,                           // Input audio file
      '-c:v', 'libx264',                             // Video codec
      '-c:a', 'aac',                                 // Audio codec
      '-b:a', '192k',                                // Audio bitrate
      '-shortest',                                   // Match duration to shortest input
      // Pass the properly escaped path to the subtitles filter
      '-vf', `subtitles='${escapedSubtitlePath}':force_style='FontSize=${fontSize},PrimaryColour=&H${fontColor.replace('#', '')},OutlineColour=&H000000,BorderStyle=3,Outline=1,Shadow=0,BackColour=&H${bgColorWithAlpha.replace('#', '')}'`,
      '-pix_fmt', 'yuv420p',                         // Pixel format for compatibility
      outputPath                                     // Output file
    ];
    
    // Execute FFmpeg command
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', ffmpegArgs);
      
      ffmpeg.stdout.on('data', (data) => {
        console.log(`FFmpeg stdout: ${data}`);
      });
      
      ffmpeg.stderr.on('data', (data) => {
        console.log(`FFmpeg stderr: ${data}`);
      });
      
      ffmpeg.on('close', async (code) => {
        if (code !== 0) {
          console.error(`FFmpeg process exited with code ${code}`);
          resolve(NextResponse.json({
            success: false,
            error: `FFmpeg process exited with code ${code}`
          }, { status: 500 }));
          return;
        }
        
        console.log('Video generated successfully');
        
        // Send response with videoUrl
        resolve(NextResponse.json({
          success: true,
          message: 'Video generated successfully',
          videoUrl: `/api/export/download?id=${exportId}`
        }));
      });
      
      ffmpeg.on('error', (err) => {
        console.error('FFmpeg process error:', err);
        reject(NextResponse.json({
          success: false,
          error: 'Error generating video: ' + err.message
        }, { status: 500 }));
      });
    });
  } catch (error) {
    console.error('Error in video export:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate video' 
      }, 
      { status: 500 }
    );
  }
}