import { NextResponse } from 'next/server';
import { searchVideos, SearchParams } from '@/lib/search';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const searchParams: SearchParams = {
      query: body.query,
      region: body.region,
      limit: body.limit
    };

    const results = await searchVideos(searchParams);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
} 