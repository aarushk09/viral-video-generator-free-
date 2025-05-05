"use client"

import React, { useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AutoCaptions } from "./auto-captions"
import type { CaptionSettings } from "./caption-editor"

// Aspect ratio dimensions for previews
const aspectRatioDimensions = {
  "16:9": { width: 16, height: 9, class: "aspect-video" },
  "9:16": { width: 9, height: 16, class: "aspect-[9/16]" },
  "1:1": { width: 1, height: 1, class: "aspect-square" },
  "4:5": { width: 4, height: 5, class: "aspect-[4/5]" }
};

interface VideoPreviewProps {
  backgroundSrc: string;
  captionText?: string;
  showCaptions?: boolean;
  captionSettings?: CaptionSettings;
  onCaptionPositionChange?: (position: { x: number, y: number }) => void;
  aspectRatio?: string;
  backgroundType?: 'image' | 'video';
  audioPlaybackState?: { 
    isPlaying: boolean; 
    currentTime: number; 
    duration: number 
  };
}

export function VideoPreview({ 
  backgroundSrc,
  captionText = "",
  showCaptions = false,
  captionSettings,
  onCaptionPositionChange,
  aspectRatio = "9:16",
  backgroundType = 'image',
  audioPlaybackState
}: VideoPreviewProps) {
  // If we have both active caption text (from audio) and caption settings,
  // prioritize showing the active captions during playback
  const shouldShowAutoCaptions = showCaptions && captionText;
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Get aspect ratio class
  const aspectRatioInfo = aspectRatioDimensions[aspectRatio as keyof typeof aspectRatioDimensions] || 
                         aspectRatioDimensions["9:16"];
  
  // Check if the background is a video
  const isVideoBackground = backgroundType === 'video';
  
  // Sync video with audio playback when audioPlaybackState is available
  useEffect(() => {
    const videoElement = videoRef.current;
    if (isVideoBackground && videoElement && audioPlaybackState) {
      if (audioPlaybackState.isPlaying) {
        // If audio is playing, play the video and try to sync its position
        if (videoElement.duration > 0) { // Make sure video has loaded
          videoElement.currentTime = audioPlaybackState.currentTime % videoElement.duration;
          
          // Only play if video is paused to avoid restarting already playing video
          if (videoElement.paused) {
            videoElement.play().catch(err => {
              console.error('Failed to play video:', err);
            });
          }
        }
      } else {
        // If audio is not playing, pause the video
        videoElement.pause();
      }
    }
  }, [
    audioPlaybackState?.isPlaying, 
    audioPlaybackState?.currentTime, 
    isVideoBackground
  ]);
  
  // Loop the video as needed
  useEffect(() => {
    const videoElement = videoRef.current;
    if (isVideoBackground && videoElement) {
      const handleVideoEnded = () => {
        // If audio is still playing when video ends, restart the video
        if (audioPlaybackState?.isPlaying) {
          videoElement.currentTime = 0;
          videoElement.play().catch(err => {
            console.error('Failed to restart video:', err);
          });
        }
      };
      
      videoElement.addEventListener('ended', handleVideoEnded);
      
      return () => {
        videoElement.removeEventListener('ended', handleVideoEnded);
      };
    }
  }, [audioPlaybackState?.isPlaying, isVideoBackground]);

  return (
    <div 
      className={`relative w-full h-full overflow-hidden rounded-lg flex items-center justify-center ${aspectRatioInfo.class}`} 
      ref={containerRef} 
      id="phone-preview-content"
    >
      {isVideoBackground ? (
        <video
          ref={videoRef}
          src={backgroundSrc}
          playsInline={true}
          muted={true}
          className="w-full h-full object-cover"
        />
      ) : (
        <img
          src={backgroundSrc || "/placeholder.svg?height=480&width=240"}
          alt="Video background"
          className="w-full h-full object-cover"
        />
      )}
      
      {/* Auto-generated captions from audio playback */}
      {shouldShowAutoCaptions && (
        <AutoCaptions text={captionText} isVisible={true} />
      )}
      
      {/* Manual caption editor preview (only shown when auto captions aren't active) */}
      {!shouldShowAutoCaptions && captionSettings && (
        <AnimatePresence>
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: `${captionSettings.position.x}%`,
              top: `${captionSettings.position.y}%`,
              transform: "translate(-50%, -50%)",
              maxWidth: "90%",
            }}
            drag={!!onCaptionPositionChange}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (onCaptionPositionChange && containerRef.current) {
                // Calculate position as percentage of container
                const rect = containerRef.current.getBoundingClientRect();
                const x = (info.point.x - rect.left) / rect.width * 100;
                const y = (info.point.y - rect.top) / rect.height * 100;
                onCaptionPositionChange({ 
                  x: Math.max(0, Math.min(100, x)),
                  y: Math.max(0, Math.min(100, y))
                });
              }
            }}
          >
            <div
              className={`px-4 py-3 rounded-lg shadow-xl text-center ${onCaptionPositionChange ? 'cursor-move' : ''}`}
              style={{
                color: captionSettings.fontColor,
                backgroundColor: `${captionSettings.backgroundColor}${Math.round(captionSettings.opacity * 255).toString(16).padStart(2, '0')}`,
                fontSize: `${captionSettings.fontSize}px`,
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                borderBottom: "2px solid rgba(255,255,255,0.15)"
              }}
            >
              {captionSettings.text || "Caption Preview"}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
