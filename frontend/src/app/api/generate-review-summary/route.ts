import { NextResponse } from 'next/server'
import { VertexAI } from '@google-cloud/vertexai'
import { Database } from '@/types/database'

type Review = Database['public']['Tables']['reviews']['Row']

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
    const { reviews } = await request.json()

    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json(
        { error: 'Reviews array is required' },
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
    const prompt = `Given the following reviews for a sign language video, generate a concise summary that captures the overall sentiment and key points. Return only the summary text, with no additional formatting.

Reviews:
${reviews
  .map(
    (review: Review) =>
      `Rating: ${review.rating}/5\nComment: ${review.comment}`
  )
  .join('\n\n')}

Generate a single paragraph summary that:
1. Mentions the average rating
2. Highlights common themes or feedback
3. Notes any specific aspects that reviewers liked or disliked
4. Is concise and easy to read

Return only the summary text, nothing else.`

    // Generate content
    const result = await generativeModel.generateContent(prompt)
    const response = await result.response
    const text = response.candidates[0]?.content.parts[0]?.text

    if (!text) {
      throw new Error('No text generated from Vertex AI')
    }

    const summary = text.trim()

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Error generating review summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate review summary' },
      { status: 500 }
    )
  }
} 