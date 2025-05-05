"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Download, Camera } from "lucide-react"
import { toast } from "sonner"
import { toPng } from 'html-to-image'

// Define aspect ratio dimensions
const aspectRatioDimensions = {
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 }
};

interface ExportVideoButtonProps {
  audioData: string
  backgroundSrc: string
  backgroundType?: 'image' | 'video'
  captions: any[]
  captionSettings: any
  className?: string
  aspectRatio?: string | null
}

export function ExportVideoButton({
  audioData,
  backgroundSrc,
  backgroundType = 'image',
  captions,
  captionSettings,
  className = "",
  aspectRatio = "9:16"
}: ExportVideoButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // Get dimensions based on aspectRatio
  const safeAspectRatio = aspectRatio || "9:16";
  const dimensions = aspectRatioDimensions[safeAspectRatio as keyof typeof aspectRatioDimensions] || 
                    aspectRatioDimensions["9:16"]; // Default to 9:16

  // Handle direct capture and download
  const handleExport = async () => {
    console.log("Export button clicked");
    toast.info("Starting export...");
    
    try {
      setIsExporting(true);
      setExportError(null);

      // Get the phone preview content by ID
      const previewArea = document.getElementById('phone-preview-content');
      
      if (!previewArea) {
        console.error("Preview area not found");
        toast.error("Could not find the preview area");
        return;
      }
      
      console.log("Preview area found:", previewArea);
      toast.info("Capturing preview...");

      // For video backgrounds, we need to handle differently
      if (backgroundType === 'video') {
        // Use server API to export with video background
        try {
          const response = await fetch('/api/export', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              audioData,
              backgroundSrc,
              backgroundType,
              captions,
              captionSettings,
              aspectRatio: safeAspectRatio,
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.success) {
            toast.success("Video export initiated!");
            toast.info("Your video will be ready to download shortly...");
          } else {
            throw new Error(data.error || "Unknown error occurred");
          }
        } catch (error) {
          console.error("Export API error:", error);
          toast.error("Failed to export video");
          setExportError(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          setIsExporting(false);
        }
        return;
      }

      // For image backgrounds, use the existing canvas approach
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions based on the selected aspect ratio
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      
      // Scale for better resolution
      if (ctx) {
        // Fill with black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        
        // Create a temporary image from the preview background
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = backgroundSrc || '/placeholder.svg?height=480&width=240';
        
        // Once image is loaded, draw it and create the download
        img.onload = () => {
          // Draw the background image
          ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
          
          // Add the caption text if available
          if (captionSettings && captionSettings.text) {
            // Configure text style
            ctx.font = `${captionSettings.fontSize * (dimensions.width / 280)}px Arial`; // Scale font based on dimensions
            ctx.fillStyle = captionSettings.fontColor || '#FFFFFF';
            ctx.textAlign = 'center';
            
            // Calculate text position
            const textX = dimensions.width / 2;
            const textY = dimensions.height - (dimensions.height * 0.1); // Position near bottom
            
            // Add background to text for better readability
            const textWidth = ctx.measureText(captionSettings.text).width;
            ctx.fillStyle = captionSettings.backgroundColor || 'rgba(0,0,0,0.7)';
            ctx.fillRect(textX - textWidth/2 - 10, textY - 20, textWidth + 20, 30);
            
            // Draw the text
            ctx.fillStyle = captionSettings.fontColor || '#FFFFFF';
            ctx.fillText(captionSettings.text, textX, textY);
          }
          
          // Convert canvas to data URL and trigger download
          try {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `video-preview-${safeAspectRatio.replace(':', 'x')}-${Date.now()}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            
            console.log("Triggering download...");
            link.click();
            
            document.body.removeChild(link);
            toast.success("Image downloaded!");
          } catch (err) {
            console.error("Download error:", err);
            toast.error("Failed to download image");
          } finally {
            setIsExporting(false);
          }
        };
        
        // Handle image load error
        img.onerror = (err) => {
          console.error("Image load error:", err);
          toast.error("Failed to load background image");
          setIsExporting(false);
        };
      } else {
        throw new Error("Could not create canvas context");
      }
    } catch (error) {
      console.error("Error in export process:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setExportError(errorMessage);
      
      toast.error("Export failed", {
        description: errorMessage
      });
      setIsExporting(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        onClick={handleExport}
        disabled={isExporting}
        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 border-0"
      >
        {isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
            Exporting...
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" />
            {backgroundType === 'video' ? 'Export Video' : 'Export Preview'}
          </>
        )}
      </Button>
    </div>
  )
}