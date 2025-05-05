"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Volume2, Loader2, Info, Bug, AlertCircle, Eye, EyeOff } from "lucide-react"
import { CaptionSegment } from "@/hooks/use-auto-captioning"

interface TextToSpeechProps {
  text: string
  onAudioGenerated: (audioData: string, captions?: CaptionSegment[], text?: string, isDemoMode?: boolean, transcriptionSource?: string) => void
}

export function TextToSpeech({ text, onAudioGenerated }: TextToSpeechProps) {
  const [voice, setVoice] = useState("Fritz-PlayAI")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(false)
  const [showFallbackButton, setShowFallbackButton] = useState(false)
  const [rateLimitNotice, setRateLimitNotice] = useState<string | null>(null)
  const [requiresTermsAcceptance, setRequiresTermsAcceptance] = useState(false)

  // Add a debug log function
  const addDebugLog = (message: string) => {
    setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Handle voice selection change
  const handleVoiceChange = (newVoice: string) => {
    setVoice(newVoice);
  };

  // Initialize with checks
  useEffect(() => {
    addDebugLog("TTS component initialized")
    addDebugLog(`Text available: ${!!text}, length: ${text?.length || 0}`)
    
    // Check that text is valid
    if (!text || text.trim().length === 0) {
      addDebugLog("Warning: No text available for TTS")
    }
  }, [text])

  const generateSpeech = async () => {
    if (!text.trim()) {
      setError("Text is required")
      addDebugLog("Error: No text provided")
      return
    }

    setIsLoading(true)
    setError(null)
    setErrorDetails(null)
    setRateLimitNotice(null)
    setDebugLogs([])
    addDebugLog(`Starting speech generation with voice: ${voice}`)
    addDebugLog(`Text length: ${text.length} characters`)

    try {
      addDebugLog("Sending request to TTS API...")
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, voice }),
      })

      addDebugLog(`API response status: ${response.status}`)
      
      const data = await response.json()
      addDebugLog("Response data received")
      
      if (!response.ok) {
        const errorMsg = data.error || "Failed to generate speech"
        addDebugLog(`Error from API: ${errorMsg}`)
        
        // Extract and display detailed error information
        let details = data.details || "No details provided";
        addDebugLog(`Details: ${details}`)
        
        // Check for terms acceptance error
        if (data.requiresTermsAcceptance) {
          setRequiresTermsAcceptance(true)
          addDebugLog("Terms acceptance required for this model")
        }
        
        if (data.status === 429) {
          addDebugLog("Rate limit error detected, showing fallback button")
          setShowFallbackButton(true)
        }
        
        setError(errorMsg)
        setErrorDetails(details)
        throw new Error(errorMsg)
      }

      if (!data.audio) {
        addDebugLog("Error: No audio data in response")
        throw new Error("No audio data returned from the API")
      }

      // Check if we're in demo mode due to rate limiting
      if (data.isDemoMode && data.message) {
        setRateLimitNotice(data.message)
        addDebugLog(`Notice: ${data.message}`)
      }

      addDebugLog(`Audio data received, length: ${data.audio.length}`)
      
      // Get captions from API response or create empty array if none
      const captions = data.captions || []
      addDebugLog(`Caption segments received: ${captions.length}`)

      // Pass audio data, captions, and the original text to the parent
      onAudioGenerated(data.audio, captions, data.text || text, data.isDemoMode, data.transcriptionSource)
      addDebugLog("Audio generation complete")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate speech. Please try again."
      addDebugLog(`Error: ${errorMessage}`)
      console.error("Failed to generate speech:", error)
      setError(errorMessage)
      setShowFallbackButton(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Use a fallback audio generation for demo purposes
  const useFallbackAudio = () => {
    addDebugLog("Using fallback audio for demonstration")
    
    // Generate dummy audio data (just for UI demonstration)
    const dummyAudioData = "fakeDummyAudioDataForDemonstration"
    
    // Create fake captions for demo
    const words = text.split(/\s+/);
    const avgWordDuration = 0.3; 
    const wordsPerSegment = 7;
    const fakeCaptions: CaptionSegment[] = [];
    
    for (let i = 0; i < words.length; i += wordsPerSegment) {
      const segmentWords = words.slice(i, i + wordsPerSegment);
      const segmentText = segmentWords.join(' ');
      
      const startTime = i * avgWordDuration;
      const endTime = startTime + (segmentWords.length * avgWordDuration);
      
      fakeCaptions.push({
        text: segmentText,
        startTime,
        endTime
      });
    }
    
    onAudioGenerated(dummyAudioData, fakeCaptions, text, true, undefined)
    addDebugLog("Fallback audio simulation complete")
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-950 p-4 rounded-md mb-4 flex items-start border border-blue-800">
        <Info className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
        <p className="text-sm text-blue-200">
          Generate audio from your story. Select a voice that matches the tone of your content.
          Auto-captions will be generated for the audio in real-time.
        </p>
      </div>
      
      <div className="flex flex-col space-y-3">
        <Label htmlFor="voice" className="flex items-center text-blue-200">
          <Volume2 className="mr-2 h-4 w-4 text-blue-400" />
          Voice Selection
        </Label>
        <Select 
          value={voice}
          onValueChange={handleVoiceChange} 
          disabled={isLoading}
        >
          <SelectTrigger id="voice" className="bg-gray-800 border-gray-700">
            <SelectValue placeholder="Select a voice" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="Arista-PlayAI">Arista (Female)</SelectItem>
            <SelectItem value="Atlas-PlayAI">Atlas (Male)</SelectItem>
            <SelectItem value="Basil-PlayAI">Basil (Male)</SelectItem>
            <SelectItem value="Briggs-PlayAI">Briggs (Male)</SelectItem>
            <SelectItem value="Calum-PlayAI">Calum (Male)</SelectItem>
            <SelectItem value="Celeste-PlayAI">Celeste (Female)</SelectItem>
            <SelectItem value="Cheyenne-PlayAI">Cheyenne (Female)</SelectItem>
            <SelectItem value="Chip-PlayAI">Chip (Male)</SelectItem>
            <SelectItem value="Cillian-PlayAI">Cillian (Male)</SelectItem>
            <SelectItem value="Deedee-PlayAI">Deedee (Female)</SelectItem>
            <SelectItem value="Fritz-PlayAI">Fritz (Male)</SelectItem>
            <SelectItem value="Gail-PlayAI">Gail (Female)</SelectItem>
            <SelectItem value="Indigo-PlayAI">Indigo (Female)</SelectItem>
            <SelectItem value="Mamaw-PlayAI">Mamaw (Elderly Female)</SelectItem>
            <SelectItem value="Mason-PlayAI">Mason (Male)</SelectItem>
            <SelectItem value="Mikail-PlayAI">Mikail (Male)</SelectItem>
            <SelectItem value="Mitch-PlayAI">Mitch (Male)</SelectItem>
            <SelectItem value="Quinn-PlayAI">Quinn (Gender-Neutral)</SelectItem>
            <SelectItem value="Thunder-PlayAI">Thunder (Male)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 border-0 py-6 text-base font-medium shadow-lg"
        onClick={generateSpeech}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating Audio...
          </>
        ) : (
          <>
            <Volume2 className="mr-2 h-5 w-5" />
            Generate Speech
          </>
        )}
      </Button>

      {showFallbackButton && (
        <Button
          variant="outline"
          className="w-full border-yellow-500 text-yellow-400 hover:bg-yellow-900 hover:bg-opacity-20 mt-2"
          onClick={useFallbackAudio}
        >
          <AlertCircle className="mr-2 h-4 w-4" />
          Use Demonstration Mode
        </Button>
      )}

      {rateLimitNotice && (
        <div className="mb-3 p-2 bg-yellow-900 bg-opacity-20 rounded-md flex items-center text-yellow-400 text-xs">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{rateLimitNotice}</span>
        </div>
      )}

      {requiresTermsAcceptance && (
        <div className="mb-3 p-3 bg-blue-950 rounded-md flex flex-col items-start text-blue-200 text-sm border border-blue-800">
          <p className="mb-2">
            <span className="font-medium">Terms Acceptance Required:</span> The Groq TTS model requires terms acceptance before use.
          </p>
          <a 
            href="https://console.groq.com/playground?model=playai-tts" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-4 rounded text-sm flex items-center"
          >
            <span>Accept Terms on Groq Console</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm p-3 bg-red-950 rounded-md border border-red-800">
          <div className="font-medium">Error:</div>
          <div>{error}</div>
          {errorDetails && (
            <div className="mt-1 text-red-300 text-xs overflow-hidden text-ellipsis">
              <details>
                <summary>Technical details</summary>
                <div className="p-2 mt-1 bg-red-900 bg-opacity-30 rounded overflow-auto max-h-20">
                  {errorDetails}
                </div>
              </details>
            </div>
          )}
          <div className="mt-1 text-gray-300 text-xs">
            Use "Demonstration Mode" to see the feature without requiring an API key.
          </div>
        </div>
      )}

      {debugLogs.length > 0 && (
        <div className="mt-4 bg-gray-900 rounded border border-gray-800 overflow-hidden">
          <div 
            className="flex justify-between items-center p-2 bg-gray-800 cursor-pointer"
            onClick={() => setShowDebug(!showDebug)}
          >
           
            <button className="text-gray-400 hover:text-white flex items-center text-xs">
              {showDebug ? (
                <>
                  <EyeOff className="h-3.5 w-3.5 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Show
                </>
              )}
            </button>
          </div>
          
          {showDebug && (
            <div className="p-3 text-xs overflow-auto max-h-40 font-mono border-t border-gray-800">
              <div className="flex justify-end mb-2">
                <button 
                  className="text-gray-400 hover:text-white text-xs px-2 py-1 bg-gray-800 rounded"
                  onClick={() => setDebugLogs([])}
                >
                  Clear Logs
                </button>
              </div>
              {debugLogs.map((log, index) => (
                <div key={index} className="text-gray-300 mb-1 leading-5">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}