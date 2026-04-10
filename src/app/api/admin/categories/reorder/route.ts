import { NextRequest, NextResponse } from 'next/server';
import { initDb, reorderCategories, isAdmin } from '@/lib/db';

export async function PATCH(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    initDb();
    const body = await request.json();
    const orderedIds = body.orderedIds as number[] | undefined;

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: 'orderedIds must be an array of numbers' },
        { status: 400 }
      );
    }

    reorderCategories(orderedIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API /admin/categories/reorder PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to reorder categories' },
      { status: 500 }
    );
  }
}
