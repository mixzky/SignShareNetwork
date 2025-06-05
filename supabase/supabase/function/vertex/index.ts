import { createClient } from  'npm:@supabase/supabase-js@2.49.1'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { VertexAI } from '@google-cloud/vertexai'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, model = 'gemini-pro' } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Vertex AI
    const vertexAI = new VertexAI({
      project: Deno.env.get('GOOGLE_CLOUD_PROJECT'),
      location: Deno.env.get('GOOGLE_CLOUD_LOCATION') || 'us-central1',
    })

    // Get the model
    const generativeModel = vertexAI.preview.getGenerativeModel({
      model: model,
    })

    // Generate content
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    const response = await result.response
    const text = response.candidates[0].content.parts[0].text

    return new Response(
      JSON.stringify({ response: text }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 