import { NextRequest, NextResponse } from 'next/server';
import { initDb, getCategoryById, updateCategory, deleteCategory, isAdmin } from '@/lib/db';
import type { CategoryFormData } from '@/lib/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    initDb();
    const { id } = await params;
    const categoryId = parseInt(id, 10);

    const body = (await request.json()) as CategoryFormData;
    const updated = updateCategory(categoryId, body);

    if (!updated) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[API /admin/categories/[id] PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    initDb();
    const { id } = await params;
    const categoryId = parseInt(id, 10);

    const deleted = deleteCategory(categoryId);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Category not found or has assigned sources' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API /admin/categories/[id] DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
