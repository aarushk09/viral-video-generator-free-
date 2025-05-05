import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if the API key exists - don't return the actual key value
    const apiKey = process.env.GROQ_API_KEY
    const keyExists = !!apiKey
    
    console.log("API key exists:", keyExists)
    console.log("API key length:", apiKey?.length || 0)
    
    return NextResponse.json({ 
      keyExists, 
      message: keyExists 
        ? "Groq API key is configured" 
        : "No Groq API key found - please set GROQ_API_KEY in .env.local" 
    })
  } catch (error) {
    console.error("Error checking API key:", error)
    return NextResponse.json(
      { keyExists: false, error: "Failed to check API key" },
      { status: 500 }
    )
  }
} 