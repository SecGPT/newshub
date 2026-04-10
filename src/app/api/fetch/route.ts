import { NextRequest, NextResponse } from 'next/server';
import { fetchAllSources, fetchSource } from '@/lib/fetcher';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const sourceId = body.sourceId as number | undefined;

    if (sourceId) {
      const result = await fetchSource(sourceId);
      return NextResponse.json({
        fetched: result.fetched,
        errors: result.error ? [result.error] : [],
      });
    } else {
      const result = await fetchAllSources();
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('[API /fetch] Error:', error);
    return NextResponse.json(
      { fetched: 0, errors: [String(error)] },
      { status: 500 }
    );
  }
}
