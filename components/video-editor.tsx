"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import { CaptionEditor, type CaptionSettings } from "./caption-editor"
import { toast } from "sonner"

interface VideoEditorProps {
  onGenerateVideo: () => void
  onBackgroundSelect?: (index: number) => void
  selectedBackground?: number
}

// Define background types including videos
const backgrounds = [
  { id: 1, type: 'image', src: '/placeholder.svg?height=80&width=120&text=BG1' },
  { id: 2, type: 'image', src: '/placeholder.svg?height=80&width=120&text=BG2' },
  { id: 3, type: 'image', src: '/placeholder.svg?height=80&width=120&text=BG3' },
  { id: 4, type: 'image', src: '/placeholder.svg?height=80&width=120&text=BG4' },
  { id: 5, type: 'image', src: '/placeholder.svg?height=80&width=120&text=BG5' },
  { 
    id: 6, 
    type: 'video', 
    src: '/components/videos/minecraft-v1.mp4', 
    thumbnail: '/placeholder.svg?height=80&width=120&text=Minecraft' // Fallback thumbnail
  }
];

export function VideoEditor({ onGenerateVideo, onBackgroundSelect, selectedBackground = 1 }: VideoEditorProps) {
  const [captionSettings, setCaptionSettings] = useState<CaptionSettings>({
    text: "Sample Caption Text",
    fontColor: "#FFFFFF",
    backgroundColor: "#000000",
    opacity: 0.7,
    fontSize: 16,
    position: { x: 50, y: 50 },
    style: "default",
  });

  // Track video thumbnails
  const [videoThumbnails, setVideoThumbnails] = useState<Record<number, string>>({});

  // Extract video thumbnails on component mount
  useEffect(() => {
    const extractVideoThumbnails = async () => {
      // Find all video backgrounds
      const videoBackgrounds = backgrounds.filter(bg => bg.type === 'video');
      
      for (const bg of videoBackgrounds) {
        try {
          // Call our extract-frame API
          const response = await fetch(`/api/extract-frame?path=${encodeURIComponent(bg.src)}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setVideoThumbnails(prev => ({
                ...prev,
                [bg.id]: data.frameData
              }));
            }
          }
        } catch (error) {
          console.error(`Failed to extract thumbnail for video ${bg.id}:`, error);
        }
      }
    };

    extractVideoThumbnails();
  }, []);

  const handleBackgroundSelect = (index: number) => {
    if (onBackgroundSelect) {
      onBackgroundSelect(index);
    }
  }

  const handleCaptionUpdate = (newSettings: CaptionSettings) => {
    setCaptionSettings(newSettings)
  }

  const handleCaptionPositionChange = (position: { x: number; y: number }) => {
    setCaptionSettings((prev) => ({
      ...prev,
      position,
    }))
  }

  // Generate background source based on selected index
  const getBackgroundSrc = () => {
    const selected = backgrounds.find(bg => bg.id === selectedBackground);
    return selected?.src || '/placeholder.svg?height=480&width=240&text=BG1';
  }

  // Get background type (image or video)
  const getBackgroundType = () => {
    const selected = backgrounds.find(bg => bg.id === selectedBackground);
    return selected?.type || 'image';
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Background Video</label>
        <div className="grid grid-cols-3 gap-2">
          {backgrounds.map((bg) => (
            <div
              key={bg.id}
              className={`aspect-video bg-gray-700 rounded-md overflow-hidden cursor-pointer transition-all ${
                selectedBackground === bg.id ? "ring-2 ring-pink-500" : "hover:ring-2 hover:ring-purple-400"
              }`}
              onClick={() => handleBackgroundSelect(bg.id)}
            >
              {bg.type === 'video' ? (
                <div className="relative w-full h-full">
                  <img 
                    src={videoThumbnails[bg.id] || bg.thumbnail} 
                    alt={`Background ${bg.id}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                      <div className="w-0 h-0 border-t-4 border-t-transparent border-l-8 border-l-pink-500 border-b-4 border-b-transparent ml-0.5"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={bg.src}
                  alt={`Background ${bg.id}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ))}
        </div>
      </div>


      <div className="mt-8 flex justify-between">
        <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
          Preview
        </Button>
        <Button
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 border-0"
          onClick={onGenerateVideo}
        >
          <Play className="mr-2 h-4 w-4" />
          Generate Video
        </Button>
      </div>
    </div>
  )
}
