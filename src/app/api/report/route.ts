import { NextRequest, NextResponse } from 'next/server';
import { generateDailyReport } from '@/lib/reporter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;

    const filePath = await generateDailyReport(date);
    return NextResponse.json({ path: filePath });
  } catch (error) {
    console.error('[API /report] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
