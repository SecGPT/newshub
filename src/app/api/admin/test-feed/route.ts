import { NextRequest, NextResponse } from 'next/server';
import { testFeed } from '@/lib/fetcher';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const feedUrl = body.feedUrl as string | undefined;

    if (!feedUrl) {
      return NextResponse.json(
        { error: 'feedUrl is required' },
        { status: 400 }
      );
    }

    const result = await testFeed(feedUrl);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /admin/test-feed] Error:', error);
    return NextResponse.json(
      { valid: false, articles: [], error: String(error) },
      { status: 500 }
    );
  }
}
