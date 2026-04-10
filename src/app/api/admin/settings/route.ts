import { NextRequest, NextResponse } from 'next/server';
import { initDb, getSettings, updateSettings, isAdmin } from '@/lib/db';
import type { Settings } from '@/lib/types';

const FETCH_RELATED_KEYS: (keyof Settings)[] = [
  'fetchInterval',
  'reportTime',
  'autoFetch',
  'retentionEnabled',
  'retentionDays',
];

export async function GET(request: NextRequest) {
  try {
    initDb();
    const settings = getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('[API /admin/settings GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    initDb();
    const body = (await request.json()) as Partial<Settings>;

    const oldSettings = getSettings();
    const updated = updateSettings(body);

    // Check if fetch-related settings changed
    const shouldRestart = FETCH_RELATED_KEYS.some(
      (key) => body[key] !== undefined && body[key] !== oldSettings[key]
    );

    if (shouldRestart) {
      try {
        const { restartScheduler } = await import('@/lib/scheduler');
        restartScheduler();
      } catch {
        // Scheduler may not be running (e.g. during build)
        console.warn('[API /admin/settings] Could not restart scheduler');
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[API /admin/settings PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
