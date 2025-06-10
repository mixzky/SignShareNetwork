import { NextResponse } from 'next/server'
import { VertexAI } from '@google-cloud/vertexai'

// Initialize Vertex AI
const vertex = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION,
})

const model = 'gemini-pro'

export async function POST(request: Request) {
  try {
    const { title, description } = await request.json()

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
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
    const prompt = `Given the following sign language video title and description, generate relevant tags that would help users find this video. Return only a JSON array of strings, with no additional text.

Title: ${title}
Description: ${description}

Generate tags that are:
1. Relevant to sign language and deaf culture
2. Specific to the content
3. Include any emotions or actions shown
4. Include the language and region if mentioned
5. Include any specific signs or phrases taught

Return only a JSON array of strings, like: ["tag1", "tag2", "tag3"]`

    // Generate content
    const result = await generativeModel.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse the response to get tags
    let tags: string[] = []
    try {
      // Extract JSON array from the response
      const jsonMatch = text.match(/\[.*\]/s)
      if (jsonMatch) {
        tags = JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('Error parsing tags:', error)
      return NextResponse.json(
        { error: 'Failed to parse generated tags' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Error generating tags:', error)
    return NextResponse.json(
      { error: 'Failed to generate tags' },
      { status: 500 }
    )
  }
} 