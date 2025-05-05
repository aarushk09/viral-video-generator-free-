import { type NextRequest, NextResponse } from "next/server"
import { generateStory } from "@/lib/groq-service"

export async function POST(request: NextRequest) {
  try {
    console.log("Received story generation request")
    
    const { theme, length } = await request.json()
    console.log("Request parameters:", { theme, length })

    if (!theme || !length) {
      console.error("Missing required parameters")
      return NextResponse.json({ error: "Theme and length are required" }, { status: 400 })
    }

    console.log("Calling generateStory function...")
    const story = await generateStory({ theme, length })
    
    if (!story) {
      console.error("No story was generated")
      return NextResponse.json({ error: "Failed to generate a story" }, { status: 500 })
    }
    
    console.log("Story generated successfully, length:", story.length)
    return NextResponse.json({ story })
  } catch (error) {
    console.error("Error in generate-story API route:", error)
    return NextResponse.json(
      { error: "Failed to generate story. Please check your Groq API key and try again." },
      { status: 500 },
    )
  }
}
