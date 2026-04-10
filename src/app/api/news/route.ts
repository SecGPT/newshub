import { NextRequest, NextResponse } from 'next/server';
import { initDb, getArticles } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    initDb();
    const { searchParams } = new URL(request.url);

    const categoryId = searchParams.get('categoryId');
    const sourceId = searchParams.get('sourceId');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');

    const result = getArticles({
      categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
      sourceId: sourceId ? parseInt(sourceId, 10) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /news] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
