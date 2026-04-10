import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function hashToken(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = body.password as string | undefined;

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

    if (!password || password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    const token = hashToken(adminPassword);

    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_token', token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('[API /admin/login] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}

// GET: check if current session is authenticated
export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/admin_token=([^;]+)/);
  if (!match) {
    return NextResponse.json({ authenticated: false });
  }

  const expectedToken = hashToken(process.env.ADMIN_PASSWORD || 'admin');
  const authenticated = match[1] === expectedToken;
  return NextResponse.json({ authenticated });
}
