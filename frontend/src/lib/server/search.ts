import { VertexAI } from '@google-cloud/vertexai';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Types
export interface SearchParams {
  query: string;
  region?: string;
  limit?: number;
}

export interface GetAllVideosParams {
  region?: string;
  limit?: number;
}

export interface VideoResult {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  video_url: string;
  user_id: string;
  language: string;
  region: string;
  status: string;
  tags: string[];
  similarity?: number;
  user: {
    avatar_url: string | null;
    display_name: string;
    role: string;
  } | Array<{
    avatar_url: string | null;
    display_name: string;
    role: string;
  }>;
}

export interface SearchResult {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  video_url: string;
  user_id: string;
  language: string;
  region: string;
  status: string;
  tags: string[];
  similarity?: number;
  user: {
    avatar_url: string | null;
    display_name: string;
    role: string;
  };
}

// Constants
const SIMILARITY_THRESHOLD = 0.7;
const DEFAULT_LIMIT = 20;
const EMBEDDING_DIMENSION = 768;

// Initialize Vertex AI
const vertex = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT!,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
});

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const embeddingModel = vertex.getGenerativeModel({
      model: 'text-embedding-004',
    });

    // @ts-ignore - embedContent exists but types are not up to date
    const result = await embeddingModel.embedContent({ content: text });
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

async function semanticSearch(
  query: string,
  candidates: SearchResult[]
): Promise<SearchResult[]> {
  try {
    const model = vertex.getGenerativeModel({
      model: 'gemini-2.5-flash-002',
    });

    const prompt = `
Given this search query: "${query}"

Rank the following video entries by relevance (1-10 scale, where 10 is most relevant):
Return only a JSON array with video_url and relevance_score for each entry.

Videos:
${candidates.map((c, i) => `${i + 1}. URL: ${c.video_url}
Title: ${c.title}
Description: ${c.description}
Tags: ${c.tags?.join(', ') || 'No tags'}`).join('\n\n')}

Response format: [{"video_url": "url", "relevance_score": number}, ...]
Only include videos with relevance_score >= 7.
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    // @ts-ignore - text() exists but types are not up to date
    const text = await response.text();

    try {
      const rankings = JSON.parse(text);
      const filteredResults = rankings
        .map((rank: { video_url: string; relevance_score: number }) => {
          const original = candidates.find(c => c.video_url === rank.video_url);
          if (original) {
            return {
              ...original,
              similarity: rank.relevance_score / 10,
            };
          }
          return null;
        })
        .filter(Boolean) as SearchResult[];

      return filteredResults.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error with semantic search:', error);
    return [];
  }
}

export async function getAllVideos({
  region,
  limit = DEFAULT_LIMIT
}: GetAllVideosParams): Promise<SearchResult[]> {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let queryBuilder = supabase
    .from('videos')
    .select(`
      id,
      created_at,
      updated_at,
      title,
      description,
      video_url,
      user_id,
      language,
      region,
      status,
      tags,
      user:users (
        avatar_url,
        display_name,
        role
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (region) {
    queryBuilder = queryBuilder.eq('region', region);
  }

  const { data: videos, error } = await queryBuilder;

  if (error) {
    console.error('Error fetching videos:', error);
    return [];
  }

  return (videos || []).map((video: VideoResult) => ({
    ...video,
    user: Array.isArray(video.user) ? video.user[0] : video.user
  })) as SearchResult[];
}

export async function searchVideos({
  query,
  region,
  limit = DEFAULT_LIMIT
}: SearchParams): Promise<SearchResult[]> {
  if (!query) {
    return getAllVideos({ region, limit });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let queryBuilder = supabase
    .from('videos')
    .select(`
      id,
      created_at,
      updated_at,
      title,
      description,
      video_url,
      user_id,
      language,
      region,
      status,
      tags,
      user:users (
        avatar_url,
        display_name,
        role
      )
    `)
    .limit(limit * 2);

  if (region) {
    queryBuilder = queryBuilder.eq('region', region);
  }

  const embedding = await generateEmbedding(query);
  let results: SearchResult[] = [];

  if (embedding) {
    const { data: vectorResults, error: vectorError } = await supabase
      .rpc('match_videos', {
        query_embedding: embedding,
        similarity_threshold: SIMILARITY_THRESHOLD,
        match_count: limit * 2
      });

    if (!vectorError && vectorResults && vectorResults.length > 0) {
      results = vectorResults.map((result: VideoResult) => ({
        ...result,
        user: Array.isArray(result.user) ? result.user[0] : result.user
      })) as SearchResult[];
      return results.slice(0, limit);
    }
  }

  const { data: textResults, error: textError } = await queryBuilder
    .textSearch('search_doc', query, {
      type: 'websearch',
      config: 'english'
    });

  if (!textError && textResults && textResults.length > 0) {
    const candidates = textResults.map((result: VideoResult) => ({
      ...result,
      user: Array.isArray(result.user) ? result.user[0] : result.user
    })) as SearchResult[];

    results = await semanticSearch(query, candidates);
    return results.slice(0, limit);
  }

  return results;
}

export async function enhancedSearchVideos({
  query,
  region,
  limit = DEFAULT_LIMIT
}: SearchParams): Promise<SearchResult[]> {
  if (!query) {
    return getAllVideos({ region, limit });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let queryBuilder = supabase
    .from('videos')
    .select(`
      id,
      created_at,
      updated_at,
      title,
      description,
      video_url,
      user_id,
      language,
      region,
      status,
      tags,
      user:users (
        avatar_url,
        display_name,
        role
      )
    `)
    .limit(limit * 3);

  if (region) {
    queryBuilder = queryBuilder.eq('region', region);
  }

  const { data: candidates, error } = await queryBuilder
    .textSearch('search_doc', query, {
      type: 'websearch',
      config: 'english'
    });

  if (error || !candidates || candidates.length === 0) {
    return [];
  }

  const mappedCandidates = candidates.map((result: VideoResult) => ({
    ...result,
    user: Array.isArray(result.user) ? result.user[0] : result.user
  })) as SearchResult[];

  const rankedResults = await semanticSearch(query, mappedCandidates);
  return rankedResults.slice(0, limit);
} 