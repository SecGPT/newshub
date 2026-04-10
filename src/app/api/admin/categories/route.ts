import { NextRequest, NextResponse } from 'next/server';
import { initDb, getCategories, createCategory, isAdmin, getDb } from '@/lib/db';
import type { CategoryFormData } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    initDb();
    const database = getDb();

    const categories = getCategories();

    // Add source count for each category
    const categoriesWithCount = categories.map((cat) => {
      const countRow = database.prepare(
        'SELECT COUNT(*) as cnt FROM sources WHERE category_id = ?'
      ).get(cat.id) as Record<string, unknown>;
      return {
        ...cat,
        sourceCount: (countRow.cnt as number) || 0,
      };
    });

    return NextResponse.json(categoriesWithCount);
  } catch (error) {
    console.error('[API /admin/categories GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
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
    const body = (await request.json()) as CategoryFormData;

    if (!body.name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    const category = createCategory(body);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('[API /admin/categories POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
