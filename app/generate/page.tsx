"use client"

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryGenerator } from "@/components/story-generator";
import { VideoPreview } from "@/components/video-preview";
import { TextToSpeech } from "@/components/text-to-speech";
import { AudioPlayer } from "@/components/audio-player";
import { Input } from "@/components/ui/input";
import {
  Key,
  AlertCircle,
  Download,
  Sparkles,
  Play,
  Video,
  FileVideo,
  Wand2,
  Headphones,
  Layers,
  Settings,
  Share2,
  Palette,
} from "lucide-react";
import { CaptionEditor } from "@/components/caption-editor";
import { ExportVideoButton } from "@/components/export-video-button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function GeneratePage() {
  const [story, setStory] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoGenerated, setVideoGenerated] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(1);
  const [backgroundType, setBackgroundType] = useState<"image" | "video">("image");
  const [audioData, setAudioData] = useState<string | null>(null);
  const [activeCaption, setActiveCaption] = useState("");
  const [captionSegments, setCaptionSegments] = useState<any[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [apiKeyStatus, setApiKeyStatus] = useState<"idle" | "setting" | "success" | "error">("idle");
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [transcriptionSource, setTranscriptionSource] = useState<string | undefined>(undefined);
  const [isDownloading, setIsDownloading] = useState(false);
  const [captionSettings, setCaptionSettings] = useState({
    text: "Sample Caption Text",
    fontColor: "#FFFFFF",
    backgroundColor: "#000000",
    opacity: 0.7,
    fontSize: 16,
    position: { x: 50, y: 50 },
    style: "default",
  });
  const [aspectRatio, setAspectRatio] = useState<string>("9:16");
  const [minecraftThumbnail, setMinecraftThumbnail] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);

  // Audio playback state for video synchronization
  const [audioPlaybackState, setAudioPlaybackState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  });

  const handleStoryGenerated = useCallback((generatedStory: string) => {
    console.log("Story generated:", generatedStory);
    setStory(generatedStory);
  }, []);

  const handleGenerateVideo = useCallback(() => {
    setIsGeneratingVideo(true);
    // Simulate video generation
    setTimeout(() => {
      setIsGeneratingVideo(false);
      setVideoGenerated(true);
    }, 3000);
  }, []);

  // Handle background selection
  const handleBackgroundSelect = useCallback((index: number) => {
    setSelectedBackground(index);

    // Determine if the selected background is a video (for now, we know index 6 is the Minecraft video)
    const isVideo = index === 6;
    setBackgroundType(isVideo ? "video" : "image");
  }, []);

  // Handle audio generation from text
  const handleAudioGenerated = useCallback(
    (audioData: string, captions: any[] = [], text?: string, demo?: boolean, transcriptionSource?: string) => {
      console.log(
        `Audio generated with ${captions?.length || 0} captions, transcription source: ${transcriptionSource || "none"}`,
      );
      if (captions && captions.length > 0) {
        console.log("First caption:", captions[0]);
        console.log("Last caption:", captions[captions.length - 1]);
      }

      setAudioData(audioData);
      setIsDemoMode(demo || audioData === "fakeDummyAudioDataForDemonstration");
      setTranscriptionSource(transcriptionSource);

      // Set captions with validation
      if (captions && Array.isArray(captions) && captions.length > 0) {
        // Make sure all captions have the expected properties
        const validCaptions = captions.filter(
          (caption) =>
            caption &&
            typeof caption.text === "string" &&
            typeof caption.startTime === "number" &&
            typeof caption.endTime === "number",
        );

        if (validCaptions.length !== captions.length) {
          console.warn(`Filtered out ${captions.length - validCaptions.length} invalid caption segments`);
        }

        setCaptionSegments(validCaptions);
      } else {
        setCaptionSegments([]);
        console.warn("No valid captions received");
      }
    },
    [],
  );

  // Handle active caption change from audio player
  const handleCaptionChange = useCallback((captionText: string) => {
    console.log(`Caption changed to: "${captionText}"`);
    setActiveCaption(captionText);
  }, []);

  // Set Groq API key
  const handleSetApiKey = useCallback(async () => {
    if (!apiKey.trim()) {
      setApiKeyError("Please enter a valid API key");
      return;
    }

    setApiKeyStatus("setting");
    setApiKeyError(null);

    try {
      const response = await fetch("/api/set-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to set API key");
      }

      setApiKeyStatus("success");
      setTimeout(() => {
        setShowApiKeyInput(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to set API key:", error);
      setApiKeyStatus("error");
      setApiKeyError(error instanceof Error ? error.message : "Failed to set API key. Please try again.");
    }
  }, [apiKey]);

  // Fetch Minecraft thumbnail on mount
  useEffect(() => {
    const fetchThumbnail = async () => {
      try {
        setThumbnailLoading(true);
        // Update path to /videos/minecraft-v1.mp4
        const response = await fetch("/api/extract-frame?path=/videos/minecraft-v1.mp4");
        const data = await response.json();
        if (data.success && data.frameData) {
          setMinecraftThumbnail(data.frameData);
        } else {
          console.error("Failed to fetch thumbnail:", data.error);
          // Optionally set a fallback image or keep it null
        }
      } catch (error) {
        console.error("Error fetching thumbnail:", error);
      } finally {
        setThumbnailLoading(false);
      }
    };

    fetchThumbnail();
  }, []);

  // Handle audio playback state changes from the AudioPlayer component
  const handlePlaybackStateChange = useCallback(
    (state: { isPlaying: boolean; currentTime: number; duration: number }) => {
      setAudioPlaybackState(state);
    },
    [],
  );

  // Get background source URL for preview or video display
  const getBackgroundSrc = useCallback(() => {
    if (selectedBackground === 6) {
      if (backgroundType === "video" && audioPlaybackState.isPlaying) {
        // Return the actual video path when playing audio
        // Update path to /videos/minecraft-v1.mp4
        return "/videos/minecraft-v1.mp4";
      } else {
        // Return the fetched thumbnail or a placeholder when not playing
        return minecraftThumbnail || "/placeholder.svg?height=480&width=240&text=Minecraft+Preview";
      }
    }
    // Return regular placeholder for other backgrounds
    return `/placeholder.svg?height=480&width=240&text=BG${selectedBackground}`;
  }, [selectedBackground, backgroundType, audioPlaybackState.isPlaying, minecraftThumbnail]);

  // This function determines whether to show a video or image in the preview
  const getPreviewBackgroundType = useCallback(() => {
    // Use video type only when audio is playing and it's the Minecraft background
    if (selectedBackground === 6 && audioPlaybackState.isPlaying) {
      return "video";
    }
    // Otherwise, treat it as an image (thumbnail or placeholder)
    return "image";
  }, [selectedBackground, audioPlaybackState.isPlaying]);

  // Handle caption position changes from VideoPreview
  const handleCaptionPositionChange = useCallback((position: { x: number; y: number }) => {
    setCaptionSettings((prev) => ({
      ...prev,
      position,
    }));
  }, []);

  // Handle caption updates from CaptionEditor
  const handleCaptionUpdate = useCallback((newSettings: typeof captionSettings) => {
    setCaptionSettings(newSettings);
  }, []);

  // Add this before the download buttons
  const aspectRatioOptions = [
    { value: "16:9", label: "Landscape (16:9) - YouTube" },
    { value: "9:16", label: "Vertical (9:16) - Reels/Shorts/TikTok" },
    { value: "1:1", label: "Square (1:1) - Instagram" },
    { value: "4:5", label: "Portrait (4:5) - Instagram Post" },
  ];

  // Handle download of the generated video
  const handleDownload = useCallback(async () => {
    try {
      setIsDownloading(true);

      console.log("Downloading video...");

      // Call our export API with the current settings
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioData,
          backgroundSrc: getBackgroundSrc(),
          captions: captionSegments,
          captionSettings,
          aspectRatio, // Include selected aspect ratio
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate video: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to generate video");
      }

      // Trigger download with the URL from the API
      console.log("Video ready, downloading from:", data.videoUrl);
      window.location.href = data.videoUrl;
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download video. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [audioData, getBackgroundSrc, captionSegments, captionSettings, aspectRatio]);


  return (
    <main className="min-h-screen bg-[#0A0A0F] text-zinc-100">
      {/* Gradient background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-violet-900/20 via-transparent to-transparent" />
        <div className="absolute bottom-0 right-0 w-full h-[500px] bg-gradient-to-tl from-cyan-900/20 via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <header className="mb-10">
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full blur-md bg-gradient-to-r from-violet-600 to-cyan-600 opacity-70"></div>
                <div className="relative bg-black rounded-full p-2">
                  <Video className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 text-transparent bg-clip-text">
              Nebula
            </h1>
            <p className="text-center text-zinc-400 max-w-md mx-auto">
              Create stunning AI-powered videos with automatic captions and professional editing
            </p>
          </div>
        </header>

        {showApiKeyInput && (
          <Card className="bg-[#12121A] border-[#2A2A35] shadow-xl mb-8 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-cyan-500"></div>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3 mb-4">
                <AlertCircle className="h-5 w-5 text-amber-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-zinc-200 text-sm mb-1 font-medium">API Key Required</p>
                  <p className="text-zinc-400 text-sm">
                    For this app to work properly, you need to set your Groq API key. The key has been pre-filled for
                    you.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 items-center">
                <div className="relative flex-grow">
                  <Key className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                  <Input
                    type="text"
                    value={apiKey || ""}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Groq API key"
                    className="pl-9 bg-[#1A1A25] border-[#2A2A35] focus:border-violet-500 focus:ring-violet-500/20"
                  />
                </div>

                <Button
                  className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white border-0 shadow-lg shadow-violet-900/20"
                  onClick={handleSetApiKey}
                  disabled={apiKeyStatus === "setting"}
                >
                  {apiKeyStatus === "setting" ? (
                    <span className="flex items-center">
                      <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                      Setting...
                    </span>
                  ) : apiKeyStatus === "success" ? (
                    "Set Successfully!"
                  ) : (
                    "Set API Key"
                  )}
                </Button>
              </div>

              {apiKeyError && <div className="mt-2 text-red-400 text-sm">{apiKeyError}</div>}
            </CardContent>
          </Card>
        )}

        {/* Updated Grid Layout */}
        <div className="grid lg:grid-cols-2 gap-8 items-start"> {/* Added items-start */}
          {/* Sticky Phone Preview on the Left */}
          <div className="lg:sticky lg:top-8 space-y-8"> {/* Added sticky positioning */}
            <div className="relative mx-auto overflow-hidden shadow-2xl">
              {/* Phone frame */}
              <div
                className={`relative bg-black rounded-[36px] border-4 border-[#2A2A35] overflow-hidden shadow-2xl mx-auto transition-all duration-300 ease-in-out ${
                  aspectRatio === "9:16"
                    ? "w-[350px] h-[700px]"
                    : aspectRatio === "1:1"
                      ? "w-[425px] h-[425px]"
                      : aspectRatio === "4:5"
                        ? "w-[400px] h-[500px]"
                        : "w-[550px] h-[312px]"
                }`}
              >
                {/* ... phone internals ... */}
                <div className="absolute top-0 left-0 w-full h-12 bg-black flex justify-center">
                  <div className="w-32 h-6 bg-black rounded-b-xl"></div>
                </div>
                {/* Export Border Indicator */}
                <div className="absolute top-12 left-2 right-2 bottom-4 border-2 border-violet-500 border-dashed rounded-lg pointer-events-none z-10 opacity-60"></div>
                <div className="w-full h-full pt-12 pb-4 px-2">
                  {videoGenerated ? (
                    <img
                      src="/placeholder.svg?height=480&width=240&text=Generated+Video"
                      alt="Generated video"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full">
                      <VideoPreview
                        backgroundSrc={getBackgroundSrc()}
                        captionText={activeCaption}
                        showCaptions={!!audioData && !!activeCaption}
                        captionSettings={captionSettings}
                        onCaptionPositionChange={handleCaptionPositionChange}
                        aspectRatio={aspectRatio}
                        backgroundType={getPreviewBackgroundType()}
                        audioPlaybackState={audioPlaybackState}
                      />
                    </div>
                  )}

                  {isGeneratingVideo && (
                    <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-t-violet-500 border-r-violet-500 border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-violet-300 font-medium">Generating video...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Export Options (conditionally rendered) */}
            {videoGenerated && (
              <div className="space-y-6">
                <Card className="bg-[#12121A] border-[#2A2A35] shadow-xl overflow-hidden">
                  <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-cyan-500"></div>
                  <CardContent className="pt-6">
                    <div className="flex items-center mb-4">
                      <h2 className="text-xl font-semibold bg-gradient-to-r from-violet-400 to-cyan-400 text-transparent bg-clip-text">
                        Export Options
                      </h2>
                      <Layers className="ml-2 h-4 w-4 text-zinc-400" />
                    </div>

                    <div className="space-y-6">
                      <div className="flex flex-col space-y-4">
                        <div className="flex justify-between items-center">
                          <Button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-900/20 w-full"
                          >
                            {isDownloading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="mr-2 h-4 w-4" />
                                Download Video
                              </>
                            )}
                          </Button>
                        </div>

                        <ExportVideoButton
                          audioData={audioData || ""}
                          backgroundSrc={
                            selectedBackground === 6
                              ? "/videos/minecraft-v1.mp4"
                              : `/placeholder.svg?height=480&width=240&text=BG${selectedBackground}`
                          }
                          captions={captionSegments}
                          captionSettings={captionSettings}
                          aspectRatio={aspectRatio}
                          className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0 shadow-lg shadow-violet-900/20"
                        />
                      </div>

                      <Separator className="bg-[#2A2A35]" />

                      <div className="text-center">
                        <Link href="/share">
                          <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-lg shadow-emerald-900/20 w-full">
                            <Share2 className="mr-2 h-4 w-4" />
                            Continue to Share
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Scrollable Settings Cards on the Right */}
          <div className="space-y-8">
            {/* Story Generation Card */}
            <Card className="bg-[#12121A] border-[#2A2A35] shadow-xl overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500"></div>
              <CardContent className="pt-6">
                <Tabs defaultValue="ai-generate" className="w-full">
                  <TabsList className="bg-[#1A1A25] mb-6 w-full">
                    <TabsTrigger
                      value="ai-generate"
                      className="flex-1 data-[state=active]:bg-[#2A2A35] data-[state=active]:text-white"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI Generate
                    </TabsTrigger>
                    <TabsTrigger
                      value="your-story"
                      className="flex-1 data-[state=active]:bg-[#2A2A35] data-[state=active]:text-white"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Your Story
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="ai-generate">
                    <div className="flex items-center mb-4">
                      <h2 className="text-xl font-semibold bg-gradient-to-r from-violet-400 to-fuchsia-400 text-transparent bg-clip-text">
                        Generate Story
                      </h2>
                      <Badge variant="outline" className="ml-3 text-xs bg-[#1A1A25] text-zinc-400 border-[#2A2A35]">
                        Powered by Groq
                      </Badge>
                    </div>

                    <div className="mb-6 p-5 bg-[#1A1A25] rounded-lg border border-[#2A2A35]">
                      <StoryGenerator onStoryGenerated={handleStoryGenerated} />
                    </div>

                    {story && (
                      <div className="mt-6 p-5 bg-[#1A1A25] rounded-lg border border-[#2A2A35]">
                        <h3 className="font-medium text-lg mb-3 text-zinc-200">Your Generated Story</h3>
                        <ScrollArea className="h-[200px] rounded-md">
                          <p className="text-zinc-300 whitespace-pre-line pr-4">{story}</p>
                        </ScrollArea>

                        {/* Text-to-Speech section */}
                        <div className="mt-6 pt-5 border-t border-[#2A2A35]">
                          <div className="bg-[#12121A] p-5 rounded-lg border border-[#2A2A35] shadow-lg">
                            <div className="flex items-center mb-3">
                              <Headphones className="w-5 h-5 mr-2 text-cyan-400" />
                              <h3 className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                                Convert to Speech
                              </h3>
                            </div>
                            <TextToSpeech text={story} onAudioGenerated={handleAudioGenerated} />
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="your-story">
                    <div className="flex items-center mb-4">
                      <h2 className="text-xl font-semibold bg-gradient-to-r from-violet-400 to-fuchsia-400 text-transparent bg-clip-text">
                        Write Your Own Story
                      </h2>
                    </div>
                    <textarea
                      className="w-full p-4 bg-[#1A1A25] border border-[#2A2A35] rounded-md text-zinc-200 min-h-[200px] focus:border-violet-500 focus:ring-violet-500/20"
                      placeholder="Write your story here..."
                      onChange={(e) => handleStoryGenerated(e.target.value)}
                    />

                    {story && story.trim() !== "" && (
                      <div className="mt-6">
                        <div className="bg-[#12121A] p-5 rounded-lg border border-[#2A2A35] shadow-lg">
                          <div className="flex items-center mb-3">
                            <Headphones className="w-5 h-5 mr-2 text-cyan-400" />
                            <h3 className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                              Convert to Speech
                            </h3>
                          </div>
                          <TextToSpeech text={story} onAudioGenerated={handleAudioGenerated} />
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Audio Player Card */}
            {audioData && (
              <Card className="bg-[#12121A] border-[#2A2A35] shadow-xl overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    <h2 className="text-xl font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 text-transparent bg-clip-text">
                      Audio with Auto-Captions
                    </h2>
                    <Badge variant="outline" className="ml-3 text-xs bg-[#1A1A25] text-zinc-400 border-[#2A2A35]">
                      AI Generated
                    </Badge>
                  </div>
                  <AudioPlayer
                    audioData={audioData}
                    onCaptionChange={handleCaptionChange}
                    captions={captionSegments}
                    text={story || ""}
                    isDemoMode={isDemoMode}
                    transcriptionSource={transcriptionSource}
                    onPlaybackStateChange={handlePlaybackStateChange}
                  />
                </CardContent>
              </Card>
            )}

            {/* Video Settings Card */}
            {story && (
              <Card className="bg-[#12121A] border-[#2A2A35] shadow-xl overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-fuchsia-500 to-violet-500"></div>
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    <h2 className="text-xl font-semibold bg-gradient-to-r from-fuchsia-400 to-violet-400 text-transparent bg-clip-text">
                      Video Settings
                    </h2>
                    <Settings className="ml-2 h-4 w-4 text-zinc-400" />
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-zinc-300">Background Selection</label>
                        <Badge variant="outline" className="text-xs bg-[#1A1A25] text-zinc-400 border-[#2A2A35]">
                          {selectedBackground === 6 ? "Video Background" : "Image Background"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <TooltipProvider key={i}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`aspect-video bg-[#1A1A25] rounded-md overflow-hidden cursor-pointer transition-all ${
                                    selectedBackground === i
                                      ? "ring-2 ring-violet-500 shadow-lg shadow-violet-900/20"
                                      : "hover:ring-2 hover:ring-violet-400/50"
                                  }`}
                                  onClick={() => handleBackgroundSelect(i)}
                                >
                                  {i === 6 ? (
                                    // Minecraft video thumbnail with play icon overlay
                                    <div className="relative w-full h-full bg-[#0A0A0F] flex items-center justify-center">
                                      {thumbnailLoading ? (
                                        <div className="w-6 h-6 border-2 border-t-transparent border-violet-400 rounded-full animate-spin"></div>
                                      ) : minecraftThumbnail ? (
                                        <img
                                          src={minecraftThumbnail || "/placeholder.svg"}
                                          alt="Minecraft Video Thumbnail"
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        // Use a placeholder if thumbnail fails
                                        <img
                                          src="/placeholder.svg?height=80&width=120&text=Minecraft"
                                          alt="Minecraft Video Placeholder"
                                          className="w-full h-full object-cover opacity-50"
                                        />
                                      )}
                                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                                        <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                                          <Play className="w-3 h-3 text-white ml-0.5" />
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    // Regular background images
                                    <img
                                      src={`/placeholder.svg?height=80&width=120&text=BG${i}`}
                                      alt={`Background ${i}`}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{i === 6 ? "Minecraft Video Background" : `Background ${i}`}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-zinc-300">Video Format</label>
                        <Badge variant="outline" className="text-xs bg-[#1A1A25] text-zinc-400 border-[#2A2A35]">
                          {aspectRatio}
                        </Badge>
                      </div>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger className="w-full bg-[#1A1A25] border-[#2A2A35]">
                          <SelectValue placeholder="Select aspect ratio" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A25] border-[#2A2A35]">
                          {aspectRatioOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-zinc-500">
                        Select the aspect ratio for your video based on where you plan to share it
                      </p>
                    </div>

                    {/* Caption Editor */}
                 

                    <div className="mt-8 flex justify-between">
                      <Button
                        variant="outline"
                        className="border-[#2A2A35] text-zinc-300 hover:bg-[#1A1A25] hover:text-zinc-100"
                      >
                        Preview
                      </Button>
                      <Button
                        className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0 shadow-lg shadow-violet-900/20"
                        onClick={handleGenerateVideo}
                        disabled={isGeneratingVideo}
                      >
                        {isGeneratingVideo ? (
                          <span className="flex items-center">
                            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                            Generating...
                          </span>
                        ) : (
                          <>
                            <FileVideo className="w-4 h-4 mr-2" />
                            Generate Video
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
