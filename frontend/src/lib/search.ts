import { VertexAI } from '@google-cloud/vertexai';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Types
export interface SearchParams {
  query: string;
  region?: string;
  limit?: number;
}

export interface SearchResult {
  video_url: string;
  title: string;
  description: string;
  tags: string[];
  similarity?: number;
}

// Constants
const SIMILARITY_THRESHOLD = 0.7;
const DEFAULT_LIMIT = 10;
// Note: Gemini Flash 2.5 text embeddings have 768 dimensions
const EMBEDDING_DIMENSION = 768;

// Initialize Vertex AI
const vertex = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT!,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
});

/**
 * Generate embedding for a text using Gemini Flash 2.5
 * Note: This uses the text embedding capability, not the chat capability
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    // Use the text embedding model from Gemini family
    const embeddingModel = vertex.getGenerativeModel({
      model: 'text-embedding-004', // Latest text embedding model
    });

    const result = await embeddingModel.embedContent(text);
    
    const embedding = result.embedding;
    
    if (embedding?.values?.length === EMBEDDING_DIMENSION) {
      return embedding.values;
    }
    
    return null;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

/**
 * Alternative: Use Gemini Flash 2.5 for semantic search instead of embeddings
 * This approach uses the model's understanding to find relevant content
 */
async function semanticSearch(
  query: string, 
  candidates: Array<{video_url: string, title: string, description: string, tags: string[]}>
): Promise<SearchResult[]> {
  try {
    const model = vertex.getGenerativeModel({
      model: 'gemini-2.5-flash-002',
    });

    // Create a prompt for semantic ranking
    const prompt = `
Given this search query: "${query}"

Rank the following video entries by relevance (1-10 scale, where 10 is most relevant):
Return only a JSON array with video_url and relevance_score for each entry.

Videos:
${candidates.map((c, i) => `${i + 1}. URL: ${c.video_url}
Title: ${c.title}
Description: ${c.description}
Tags: ${c.tags.join(', ')}`).join('\n\n')}

Response format: [{"video_url": "url", "relevance_score": number}, ...]
Only include videos with relevance_score >= 7.
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    try {
      const rankings = JSON.parse(text);
      
      // Combine rankings with original data
      const rankedResults: SearchResult[] = rankings
        .map((rank: {video_url: string, relevance_score: number}) => {
          const original = candidates.find(c => c.video_url === rank.video_url);
          if (original) {
            return {
              ...original,
              similarity: rank.relevance_score / 10 // Convert to 0-1 scale
            };
          }
          return null;
        })
        .filter(Boolean)
        .sort((a: SearchResult, b: SearchResult) => (b.similarity || 0) - (a.similarity || 0));
      
      return rankedResults;
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      return [];
    }
    
  } catch (error) {
    console.error('Error with semantic search:', error);
    return [];
  }
}

/**
 * Search videos using vector similarity and/or full-text search
 */
export async function searchVideos({
  query,
  region,
  limit = DEFAULT_LIMIT
}: SearchParams): Promise<SearchResult[]> {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Build the base query
  let queryBuilder = supabase
    .from('videos')
    .select('video_url, title, description, tags')
    .limit(limit * 2); // Get more candidates for semantic ranking

  // Apply filters if provided
  if (region) {
    queryBuilder = queryBuilder.eq('region', region);
  }

  // First, try embedding-based search
  const embedding = await generateEmbedding(query);
  let results: SearchResult[] = [];

  if (embedding) {
    const { data: vectorResults, error: vectorError } = await queryBuilder
      .select('*, (embedding <#> $1) as similarity')
      .bind([embedding])
      .order('similarity')
      .lt('similarity', 1 - SIMILARITY_THRESHOLD);

    if (!vectorError && vectorResults && vectorResults.length > 0) {
      results = vectorResults.map(result => ({
        video_url: result.video_url,
        title: result.title,
        description: result.description,
        tags: result.tags,
        similarity: 1 - result.similarity // Convert distance to similarity
      }));
      return results.slice(0, limit);
    }
  }

  // Fallback to full-text search to get candidates
  const { data: textResults, error: textError } = await queryBuilder
    .textSearch('search_doc', query, {
      type: 'websearch',
      config: 'english'
    });

  if (!textError && textResults && textResults.length > 0) {
    // Use Gemini Flash 2.5 for semantic ranking of text search results
    const candidates = textResults.map(result => ({
      video_url: result.video_url,
      title: result.title,
      description: result.description,
      tags: result.tags
    }));
    
    results = await semanticSearch(query, candidates);
    return results.slice(0, limit);
  }

  return results;
}

/**
 * Enhanced search function that combines multiple approaches
 */
export async function enhancedSearchVideos({
  query,
  region,
  limit = DEFAULT_LIMIT
}: SearchParams): Promise<SearchResult[]> {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get initial candidates using full-text search
  let queryBuilder = supabase
    .from('videos')
    .select('video_url, title, description, tags')
    .limit(limit * 3); // Get more candidates

  // Apply filters
  if (region) {
    queryBuilder = queryBuilder.eq('region', region);
  };


  const { data: candidates, error } = await queryBuilder
    .textSearch('search_doc', query, {
      type: 'websearch',
      config: 'english'
    });

  if (error || !candidates || candidates.length === 0) {
    return [];
  }

  // Use Gemini Flash 2.5 for intelligent ranking
  const rankedResults = await semanticSearch(query, candidates);
  
  return rankedResults.slice(0, limit);
}