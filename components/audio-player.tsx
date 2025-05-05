"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, Volume1, VolumeX, AlertCircle, Subtitles } from "lucide-react"
import { CaptionSegment } from "@/hooks/use-auto-captioning"

interface AudioPlayerProps {
  audioData: string;
  onCaptionChange?: (caption: string) => void;
  onPlaybackStateChange?: (state: { isPlaying: boolean; currentTime: number; duration: number }) => void;
  captions?: CaptionSegment[];
  text?: string;
  isDemoMode?: boolean;
  transcriptionSource?: string;
}

export function AudioPlayer({
  audioData,
  onCaptionChange,
  onPlaybackStateChange,
  captions: initialCaptions = [], // Renamed destructured prop
  text = "",
  isDemoMode: propIsDemoMode,
  transcriptionSource
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [captionsEnabled, setCaptionsEnabled] = useState(true) // Defined here
  const [activeCaption, setActiveCaption] = useState("")

  const audioRef = useRef<HTMLAudioElement>(null)
  const captionsRef = useRef<CaptionSegment[]>(initialCaptions) // Use renamed prop

  // Notify parent component about playback state changes
  useEffect(() => {
    if (onPlaybackStateChange) {
      onPlaybackStateChange({ isPlaying, currentTime, duration });
    }
  }, [isPlaying, currentTime, duration, onPlaybackStateChange]);

  // Define updateActiveCaption function
  const updateActiveCaption = useCallback((time: number) => {
    if (!captionsEnabled || !captionsRef.current || captionsRef.current.length === 0) {
      if (activeCaption) {
        setActiveCaption("");
        if (onCaptionChange) onCaptionChange("");
      }
      return;
    }

    // Find the caption that covers the current time
    const currentCaption = captionsRef.current.find(
      caption => time >= caption.startTime && time <= caption.endTime
    );

    // Set caption text or clear it if no matching caption
    let captionText = '';
    if (currentCaption) {
      captionText = currentCaption.text;
    }

    // Only update if changed
    if (captionText !== activeCaption) {
      setActiveCaption(captionText);
      if (onCaptionChange) onCaptionChange(captionText);
    }
  }, [activeCaption, onCaptionChange, captionsEnabled]); // Added captionsEnabled dependency

  // Sort and validate captions when they change
  useEffect(() => {
    // Use renamed prop 'initialCaptions'
    if (initialCaptions && initialCaptions.length > 0) {
      // Validate captions to make sure they have required properties
      const validCaptions = initialCaptions.filter(
        caption => caption &&
                  typeof caption.text === 'string' &&
                  typeof caption.startTime === 'number' &&
                  typeof caption.endTime === 'number' &&
                  caption.endTime > caption.startTime
      );

      if (validCaptions.length !== initialCaptions.length) {
        console.warn(`Filtered out ${initialCaptions.length - validCaptions.length} invalid caption segments`);
      }

      // Sort by start time
      const sortedCaptions = [...validCaptions].sort((a, b) => a.startTime - b.startTime);

      // Store the valid, sorted captions
      captionsRef.current = sortedCaptions;

      // Make sure captions are enabled by default
      setCaptionsEnabled(true);
    } else {
      // Handle case where initialCaptions might be undefined or empty
      captionsRef.current = [];
      // Optionally disable captions if none are provided initially
      // setCaptionsEnabled(false);
    }
    // Update dependency array to use renamed prop
  }, [initialCaptions]);

  // Handle demo mode detection
  useEffect(() => {
    // Set from props if provided
    if (propIsDemoMode !== undefined) {
      setIsDemoMode(propIsDemoMode);
    } 
    // Otherwise detect from audio data
    else if (audioData === "fakeDummyAudioDataForDemonstration" || !audioData) {
      setIsDemoMode(true);
    }

    // Set fake duration for demo mode
    if (isDemoMode) {
      setDuration(30); // 30 seconds default demo duration
    }
  }, [audioData, propIsDemoMode, isDemoMode]); // Removed duplicate isDemoMode

  // Update caption when playing status or current time changes
  useEffect(() => {
    if (isPlaying) {
      updateActiveCaption(currentTime);
    }
  }, [isPlaying, currentTime, updateActiveCaption]);

  // Handlers for HTML Audio element
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const newTime = audioRef.current.currentTime;
      setCurrentTime(newTime);
      updateActiveCaption(newTime);
    }
  };

  const handleVolumeUIUpdate = () => {
    if (audioRef.current) {
      setVolume(audioRef.current.volume);
    }
  };

  // Play function
  const play = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(error => console.error("Error playing audio:", error));
      setIsPlaying(true);
    }
  };

  // Pause function
  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      // State is updated by the onPause event handler in <audio>
      // Explicitly clear caption state on pause
      setActiveCaption("");
      if (onCaptionChange) onCaptionChange(""); // Also notify parent if needed
    }
  };

  // Handle seeking
  const handleSeek = (value: number[]) => {
    const newTime = value[0];

    // Update the UI immediately for responsiveness
    setCurrentTime(newTime);

    if (isDemoMode) {
      // Reset the reference time for demo mode
      audioRef.current!.currentTime = newTime;

      // Update captions immediately
      updateActiveCaption(newTime);
    } else if (audioRef.current) {
      audioRef.current.currentTime = newTime;

      // Also ensure captions update immediately
      updateActiveCaption(newTime);
    }
  };

  // Handle volume changes
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);

    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Toggle captions
  const toggleCaptions = () => {
    const newState = !captionsEnabled;
    setCaptionsEnabled(newState);

    if (!newState && activeCaption) {
      setActiveCaption("");
      if (onCaptionChange) onCaptionChange("");
    } else if (newState && audioRef.current) {
      // Update caption immediately if enabling
      updateActiveCaption(audioRef.current.currentTime);
    }
  };

  // Get volume icon based on current volume
  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX className="h-4 w-4" />;
    if (volume < 0.5) return <Volume1 className="h-4 w-4" />;
    return <Volume2 className="h-4 w-4" />;
  };

  // Format time as MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Clean up all resources on unmount
  useEffect(() => {
    // No specific cleanup needed for HTML audio element itself
    // Audio element events will be handled by React
    return () => {};
  }, []);

  return (
    <div className="bg-gray-800 p-3 rounded-md space-y-2">
      {isDemoMode && (
        <div className="mb-3 p-2 bg-yellow-900 bg-opacity-20 rounded-md flex items-center text-yellow-400 text-xs">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Demo Mode: Audio playback disabled</span>
        </div>
      )}

      {!isDemoMode && transcriptionSource === "groq-whisper-large-v3" && (
        <div className="mb-3 p-2 bg-blue-900 bg-opacity-20 rounded-md flex items-center text-blue-400 text-xs">
          <div className="h-3 w-3 rounded-full bg-blue-400 mr-2 animate-pulse"></div>
          <span>Enhanced transcription with Whisper Large V3</span>
        </div>
      )}

      {/* Use initialCaptions.length to check if captions were provided */}
      {initialCaptions.length === 0 && !isDemoMode && (
        <div className="mb-3 p-2 bg-blue-900 bg-opacity-20 rounded-md flex items-center text-blue-400 text-xs">
          <div className="h-3 w-3 rounded-full border-2 border-t-transparent border-blue-400 animate-spin mr-2"></div>
          <span>Using simple timed captions (no speech recognition available)</span>
        </div>
      )}

      <div className="flex justify-between mb-2">
        <div className="text-sm text-gray-300">Audio Player</div>
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 ${captionsEnabled ? 'text-blue-400' : 'text-gray-500'}`}
          onClick={toggleCaptions}
          title={captionsEnabled ? "Turn off captions" : "Turn on captions"}
          disabled={isDemoMode}
        >
          <Subtitles className="h-4 w-4" />
        </Button>
      </div>

      {/* HTML5 Audio Element (hidden) */}
      {!isDemoMode && (
        <audio
          ref={audioRef}
          src={audioData ? `data:audio/wav;base64,${audioData}` : undefined}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            // Optional: Reset time to 0 when finished
            // if(audioRef.current) audioRef.current.currentTime = 0;
            setCurrentTime(duration); // Show full duration at end
          }}
          onVolumeChange={handleVolumeUIUpdate}
          className="hidden"
          preload="metadata" // Preload metadata to get duration
        />
      )}

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-600"
          onClick={isPlaying ? pause : play}
          disabled={isDemoMode} // Disable play/pause in demo mode
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <div className="text-xs text-gray-400 w-14">
          {formatTime(currentTime)}
        </div>

        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 1} // Provide a default max value
          step={0.1} // Adjust step for smoother seeking
          onValueChange={handleSeek}
          className="flex-grow"
          disabled={isDemoMode || duration === 0} // Disable slider in demo or if no duration
        />

        <div className="text-xs text-gray-400 w-14">
          {formatTime(duration)}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-400 hover:text-white"
          onClick={() => handleVolumeChange([volume === 0 ? 0.5 : 0])} // Use handleVolumeChange for consistency
          disabled={isDemoMode} // Disable volume in demo mode
        >
          {getVolumeIcon()}
        </Button>

        <Slider
          value={[volume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
          className="flex-grow max-w-24"
          disabled={isDemoMode} // Disable volume slider in demo mode
        />
      </div>

      {/* Display Active Caption only when it has content */}
      {captionsEnabled && !isDemoMode && activeCaption && (
        <div className="mt-2 text-center text-sm text-gray-300">
          {activeCaption}
        </div>
      )}
    </div>
  )
}