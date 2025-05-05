import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

interface StoryGenerationOptions {
  theme: string
  length: string
}

export async function generateStory(options: StoryGenerationOptions): Promise<string> {
  try {
    console.log("Generating story with options:", options)
    // Determine token length based on the requested story length
    const maxTokens = getMaxTokensByLength(options.length)

    // Create the prompt based on the theme and length
    const prompt = `Generate a ${options.theme.toLowerCase()} story that would take about ${options.length.toLowerCase()} to read aloud. Make it engaging for social media.`

    // Use the AI SDK to generate text with Groq
    try {
      const { text } = await generateText({
        model: groq("llama3-70b-8192"),
        prompt,
        system:
          "You are a creative storyteller. Generate an engaging story based on the given theme and length. The story should be concise, engaging, and suitable for a social media video.",
        maxTokens,
      })
      console.log("Generated story successfully:", text.substring(0, 50) + "...")
      return text
    } catch (aiError) {
      console.error("Error from AI SDK:", aiError)
      // Return a fallback story if API call fails
      return generateFallbackStory(options.theme, options.length)
    }
  } catch (error) {
    console.error("Error generating story with Groq:", error)
    // Return a fallback story for demonstration purposes
    return generateFallbackStory(options.theme, options.length)
  }
}

// Helper function to determine max tokens based on length
function getMaxTokensByLength(length: string): number {
  switch (length.toLowerCase()) {
    case "short (15s)":
      return 100
    case "medium (30s)":
      return 200
    case "long (60s)":
      return 400
    default:
      return 200
  }
}

// Fallback story generator for demonstration
function generateFallbackStory(theme: string, length: string): string {
  console.log("Using fallback story generator for", theme, length)
  const themes = {
    funny:
      "I couldn't believe what happened at the grocery store today. There I was, minding my own business in the produce section, when suddenly a banana peel appeared out of nowhere. Classic setup, right? But instead of slipping, I watched as the store manager—a serious guy who never smiles—rounded the corner and went down like a sack of potatoes. The best part? He was carrying a cake for an employee celebration. Let's just say everyone got an equal share of frosting that day, including the ceiling.",

    dramatic:
      "The letter arrived on Tuesday. Plain envelope, no return address. My hands trembled as I opened it, knowing what it might contain. Three years I'd been running, changing names, cities, jobs. The single sheet of paper inside had just five words: 'I know where you are.' I packed my bags that night, left my apartment keys with the neighbor. Some secrets are worth running from forever.",

    inspirational:
      "Everyone said the mountain couldn't be climbed in winter. Too steep, too icy, too dangerous. But Sarah had never been good at listening to 'impossible.' After losing her leg in the accident, doctors said she'd never walk unaided again. Now, as she planted her flag at the summit, the wind whipping tears from her eyes, she took a photo to send to those same doctors. Sometimes the only limits that exist are the ones we choose to believe in.",

    scary:
      "The knocking started at exactly 3:17 AM. Three sharp raps on my bedroom window—the window fourteen stories up, with no balcony. I froze under my covers, telling myself it was the wind, a bird, anything logical. Then came the whisper, a child's voice: 'Please let me in. It's cold out here.' I haven't opened my curtains in three days. The knocking continues every night, but now it's at my bedroom door.",

    relationship:
      "We met in the comments section of a recipe blog. I said the cookies needed more vanilla; they argued for almond extract instead. Somehow that trivial disagreement turned into emails, then calls, then meeting halfway between our cities at a café where we baked both versions together. Sometimes love isn't about grand gestures or perfect compatibility—it's about finding someone who makes even the smallest disagreements feel like adventures worth having.",
  }

  // Default to funny if theme not found
  const themeKey = theme.toLowerCase() as keyof typeof themes
  const story = themes[themeKey] || themes.funny

  // Adjust length by truncating or repeating
  if (length.includes("Short")) {
    return story.split(".")[0] + "."
  } else if (length.includes("Long") && story.length < 300) {
    return story + " " + story
  }

  return story
}
