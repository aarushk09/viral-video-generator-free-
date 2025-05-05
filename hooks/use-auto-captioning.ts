import { useState, useEffect, useRef } from 'react';

// Interface for caption segments
export interface CaptionSegment {
  text: string;
  startTime: number;
  endTime: number;
  words?: Array<{text: string, start: number, end: number}>; // Optional word-level timing info
}

export interface UseCaptioningProps {
  audioData?: string | null;
  isPlaying: boolean;
  currentTime: number;
  captions?: CaptionSegment[];
}

export function useAutoCaptioning({ audioData, isPlaying, currentTime, captions = [] }: UseCaptioningProps) {
  // Store generated captions
  const [captionSegments, setCaptionSegments] = useState<CaptionSegment[]>(captions);
  // Current active caption text
  const [activeCaption, setActiveCaption] = useState<string>('');
  // Loading state
  const [isGenerating, setIsGenerating] = useState(false);
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Reference to store the audio element
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
  // Timeout ref to ensure we don't stay in generating state forever
  const generatingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track the last seen caption to avoid unnecessary rerenders
  const lastActiveCaptionRef = useRef<string>('');
  
  // Add reference for animation frame to ensure smooth updates
  const rafRef = useRef<number | null>(null);
  
  // Update caption segments when captions prop changes
  useEffect(() => {
    // If we received captions, update them and reset generating state
    if (captions && captions.length > 0) {
      // Sort captions by start time to ensure correct sequence
      const sortedCaptions = [...captions].sort((a, b) => a.startTime - b.startTime);
      setCaptionSegments(sortedCaptions);
      setIsGenerating(false);
      
      // Clear any timeout if it exists
      if (generatingTimeoutRef.current) {
        clearTimeout(generatingTimeoutRef.current);
        generatingTimeoutRef.current = null;
      }
    }
  }, [captions]);
  
  // Initialize audio element when audio data changes
  useEffect(() => {
    if (!audioData) return;
    
    // Create audio element and preload
    const audio = new Audio(`data:audio/wav;base64,${audioData}`);
    audio.preload = 'metadata';
    audioElementRef.current = audio;
    
    // If we don't have captions yet (weren't provided as a prop), determine if we need to generate them
    if (captionSegments.length === 0) {
      setIsGenerating(true);
      
      // Attempt to generate captions using our new API
      fetch('/api/generate-captions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData,
          // We don't have text here, so we'll rely on the API's speech recognition
        }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.captions && data.captions.length > 0) {
          setCaptionSegments(data.captions);
        }
        setIsGenerating(false);
      })
      .catch(err => {
        console.error('Error generating captions:', err);
        setError('Failed to generate captions');
        setIsGenerating(false);
      });
      
      // Set a timeout as fallback to stop showing "generating" after a reasonable time
      generatingTimeoutRef.current = setTimeout(() => {
        setIsGenerating(false);
      }, 10000); // Longer timeout (10s) to account for API processing
    }
    
    return () => {
      audio.removeEventListener('loadedmetadata', () => {});
      // Clear timeout on cleanup
      if (generatingTimeoutRef.current) {
        clearTimeout(generatingTimeoutRef.current);
        generatingTimeoutRef.current = null;
      }
      
      // Cancel any animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [audioData, captionSegments.length]);
  
  // Update active caption based on current time during playback with smoother animation
  useEffect(() => {
    const updateCaption = () => {
      if (!isPlaying || captionSegments.length === 0) {
        // When not playing, clear the active caption
        if (activeCaption !== '') {
          setActiveCaption('');
          lastActiveCaptionRef.current = '';
        }
        return;
      }
      
      // Constants to improve caption display
      const LOOKAHEAD_TIME = 0.1; // 100ms lookahead for smoother transitions
      
      // Try to find the caption that should be displayed at the current time
      let currentCaption = captionSegments.find(
        caption => currentTime >= caption.startTime && currentTime <= caption.endTime
      );
      
      // If not found, check for nearby captions with lookahead
      if (!currentCaption) {
        currentCaption = captionSegments.find(
          caption => 
            currentTime >= caption.startTime - LOOKAHEAD_TIME && 
            currentTime <= caption.endTime
        );
      }
      
      if (currentCaption) {
        // Only update if the caption has changed to avoid unnecessary rerenders
        if (currentCaption.text !== lastActiveCaptionRef.current) {
          setActiveCaption(currentCaption.text);
          lastActiveCaptionRef.current = currentCaption.text;
        }
      } else if (activeCaption !== '') {
        // No caption found for current time
        setActiveCaption('');
        lastActiveCaptionRef.current = '';
      }
      
      // Continue animation loop for smooth updates
      rafRef.current = requestAnimationFrame(updateCaption);
    };
    
    // Start the animation loop if playing
    if (isPlaying) {
      updateCaption();
    } else {
      // Cancel animation frame when not playing
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      
      // Clear caption when stopped
      if (activeCaption !== '') {
        setActiveCaption('');
        lastActiveCaptionRef.current = '';
      }
    }
    
    // Cleanup animation frame on unmount or dependency change
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [captionSegments, currentTime, isPlaying, activeCaption]);
  
  return {
    captions: captionSegments,
    activeCaption,
    isGenerating,
    error
  };
}