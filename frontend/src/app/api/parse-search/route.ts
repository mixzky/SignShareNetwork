import { NextResponse } from 'next/server'
import { VertexAI } from '@google-cloud/vertexai'

if (!process.env.GOOGLE_CLOUD_PROJECT || !process.env.GOOGLE_CLOUD_LOCATION) {
  throw new Error('Missing required environment variables for Vertex AI')
}

// Initialize Vertex AI
const vertex = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION,
})

const model = 'gemini-pro'

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // Initialize the model
    const generativeModel = vertex.preview.getGenerativeModel({
      model: model,
      generation_config: {
        max_output_tokens: 2048,
        temperature: 0.4,
        top_p: 0.8,
        top_k: 40,
      },
    })

    // Create the prompt
    const prompt = `Given the following natural language search query about sign language, extract the most relevant keyword or phrase that would help find matching videos. Return only the keyword/phrase, with no additional text.

Query: ${query}

Examples:
- "How do you say sorry in Thai Sign Language?" -> "sorry"
- "Show me the sign for thank you in ASL" -> "thank you"
- "What's the sign for hello in British Sign Language?" -> "hello"

Return only the keyword/phrase, nothing else.`

    // Generate content
    const result = await generativeModel.generateContent(prompt)
    const response = await result.response
    const text = response.candidates[0]?.content.parts[0]?.text

    if (!text) {
      throw new Error('No text generated from Vertex AI')
    }

    const keyword = text.trim()

    return NextResponse.json({ keyword })
  } catch (error) {
    console.error('Error parsing search query:', error)
    return NextResponse.json(
      { error: 'Failed to parse search query' },
      { status: 500 }
    )
  }
} 