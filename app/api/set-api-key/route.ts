import { type NextRequest, NextResponse } from "next/server"
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()
    
    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }
    
    // For security, don't log the actual API key
    console.log("Received request to set API key")
    
    // Set the API key in the environment for the current session
    process.env.GROQ_API_KEY = apiKey
    
    console.log("API key set in environment")
    
    // Try to create .env.local file if possible
    const envPath = path.join(process.cwd(), '.env.local')
    try {
      fs.writeFileSync(envPath, `GROQ_API_KEY=${apiKey}\n`)
      console.log(".env.local file created successfully")
    } catch (fileError) {
      console.error("Error creating .env.local file:", fileError)
      // Continue even if we couldn't create the file
    }
    
    return NextResponse.json({ 
      success: true,
      message: "API key set successfully" 
    })
  } catch (error) {
    console.error("Error setting API key:", error)
    return NextResponse.json(
      { success: false, error: "Failed to set API key" },
      { status: 500 }
    )
  }
} 