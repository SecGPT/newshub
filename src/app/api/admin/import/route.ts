import { NextRequest, NextResponse } from 'next/server';
import { initDb, createSource, getCategoryBySlug, getCategories, isAdmin } from '@/lib/db';
import type { ImportItem } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    initDb();
    const body = await request.json();
    const items = body.sources as ImportItem[] | undefined;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'sources must be an array of ImportItem' },
        { status: 400 }
      );
    }

    const categories = getCategories();
    const errors: string[] = [];
    let imported = 0;

    for (const item of items) {
      if (!item.name || !item.feedUrl || !item.category) {
        errors.push(`Missing required fields for: ${item.name || 'unknown'}`);
        continue;
      }

      // Resolve category by slug first, then by name
      let category = getCategoryBySlug(item.category);
      if (!category) {
        category = categories.find((c) => c.name === item.category);
      }

      if (!category) {
        errors.push(`Category not found: ${item.category} (source: ${item.name})`);
        continue;
      }

      try {
        createSource({
          name: item.name,
          feedUrl: item.feedUrl,
          siteUrl: item.siteUrl,
          categoryId: category.id,
        });
        imported++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Failed to import ${item.name}: ${msg}`);
      }
    }

    return NextResponse.json({ imported, errors });
  } catch (error) {
    console.error('[API /admin/import] Error:', error);
    return NextResponse.json(
      { error: 'Failed to import sources' },
      { status: 500 }
    );
  }
}
