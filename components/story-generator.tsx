"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Sparkles, AlertCircle } from "lucide-react"

interface StoryGeneratorProps {
  onStoryGenerated: (story: string) => void
}

export function StoryGenerator({ onStoryGenerated }: StoryGeneratorProps) {
  const [theme, setTheme] = useState("Funny")
  const [length, setLength] = useState("Short (15s)")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ theme, length }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate story")
      }

      if (!data.story) {
        throw new Error("No story was returned from the API")
      }

      // Use the API story if available, otherwise use fallback
      const story = data.story;
      onStoryGenerated(story);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate story. Please try again.";
      console.error("Failed to generate story:", error);
      setError(errorMessage);

      // If there's an error, still show a fallback story to ensure the demo works
      const fallbackStories = {
        funny: "I couldn't believe what happened at the grocery store today. There I was, minding my own business in the produce section, when suddenly a banana peel appeared out of nowhere. Classic setup, right? But instead of slipping, I watched as the store manager—a serious guy who never smiles—rounded the corner and went down like a sack of potatoes.",
        dramatic: "The letter arrived on Tuesday. Plain envelope, no return address. My hands trembled as I opened it, knowing what it might contain. Three years I'd been running, changing names, cities, jobs. The single sheet of paper inside had just five words: 'I know where you are.'",
        inspirational: "Everyone said the mountain couldn't be climbed in winter. Too steep, too icy, too dangerous. But Sarah had never been good at listening to 'impossible.' After losing her leg in the accident, doctors said she'd never walk unaided again.",
        scary: "The knocking started at exactly 3:17 AM. Three sharp raps on my bedroom window—the window fourteen stories up, with no balcony. I froze under my covers, telling myself it was the wind, a bird, anything logical.",
        relationship: "We met in the comments section of a recipe blog. I said the cookies needed more vanilla; they argued for almond extract instead. Somehow that trivial disagreement turned into emails, then calls, then meeting halfway between our cities."
      };

      const fallbackStory = fallbackStories[theme.toLowerCase() as keyof typeof fallbackStories] || fallbackStories.funny;
      onStoryGenerated(fallbackStory);
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <Label htmlFor="theme" className="flex items-center">
          <span className="text-pink-400 mr-1">●</span> Story Theme
        </Label>
        <select
          id="theme"
          className="bg-gray-700 border-gray-600 rounded-md p-2 focus:border-purple-500"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          disabled={isLoading}
        >
          <option>Funny</option>
          <option>Dramatic</option>
          <option>Inspirational</option>
          <option>Scary</option>
          <option>Relationship</option>
        </select>
      </div>

      <div className="flex flex-col space-y-2">
        <Label htmlFor="length" className="flex items-center">
          <span className="text-purple-400 mr-1">●</span> Length
        </Label>
        <select
          id="length"
          className="bg-gray-700 border-gray-600 rounded-md p-2 focus:border-purple-500"
          value={length}
          onChange={(e) => setLength(e.target.value)}
          disabled={isLoading}
        >
          <option>Short (15s)</option>
          <option>Medium (30s)</option>
          <option>Long (60s)</option>
        </select>
      </div>

      <Button
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 border-0 py-6 text-base font-medium shadow-lg"
        onClick={handleGenerate}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
            Generating Story...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Generate Story
          </>
        )}
      </Button>

      {error && (
        <div className="text-red-400 text-sm p-2 bg-red-900 bg-opacity-20 rounded-md">
          {error}
          <div className="mt-1 text-gray-300 text-xs">
            Don't worry, we'll still show you a sample story!
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">Powered by Groq AI</p>
    </div>
  )
}
