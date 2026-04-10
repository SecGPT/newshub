import { NextRequest, NextResponse } from 'next/server';
import { initDb, getSources, createSource, isAdmin, getDb } from '@/lib/db';
import type { SourceFormData } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    initDb();
    const database = getDb();

    const rows = database.prepare(`
      SELECT s.*, c.name as category_name
      FROM sources s
      LEFT JOIN categories c ON s.category_id = c.id
      ORDER BY s.name ASC
    `).all() as Record<string, unknown>[];

    const sources = rows.map((row) => ({
      id: row.id as number,
      name: row.name as string,
      feedUrl: row.feed_url as string,
      siteUrl: (row.site_url as string) || undefined,
      categoryId: (row.category_id as number) || 0,
      enabled: Boolean(row.enabled),
      refreshInterval: (row.refresh_interval as number) || 0,
      lastFetchedAt: (row.last_fetched_at as string) || undefined,
      lastError: (row.last_error as string) || undefined,
      articleCount: (row.article_count as number) || 0,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      categoryName: (row.category_name as string) || undefined,
    }));

    return NextResponse.json(sources);
  } catch (error) {
    console.error('[API /admin/sources GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sources' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    initDb();
    const body = (await request.json()) as SourceFormData;

    if (!body.name || !body.feedUrl || !body.categoryId) {
      return NextResponse.json(
        { error: 'name, feedUrl, and categoryId are required' },
        { status: 400 }
      );
    }

    const source = createSource(body);
    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    console.error('[API /admin/sources POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create source' },
      { status: 500 }
    );
  }
}
