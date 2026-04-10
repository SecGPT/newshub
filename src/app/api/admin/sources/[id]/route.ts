import { NextRequest, NextResponse } from 'next/server';
import { initDb, getSourceById, updateSource, deleteSource, isAdmin } from '@/lib/db';
import type { SourceFormData } from '@/lib/types';

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
    const sourceId = parseInt(id, 10);

    const body = (await request.json()) as SourceFormData;
    const updated = updateSource(sourceId, body);

    if (!updated) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[API /admin/sources/[id] PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update source' },
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
    const sourceId = parseInt(id, 10);

    const deleted = deleteSource(sourceId);
    if (!deleted) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API /admin/sources/[id] DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete source' },
      { status: 500 }
    );
  }
}
