import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId, password } = await req.json();
    const cleanUser = (userId || '').toString().trim().toLowerCase();
    const cleanPass = (password || '').toString().trim();

    const expectedUser = (process.env.ADMIN_USER || 'admin').toLowerCase();
    const expectedPass = process.env.ADMIN_PASSWORD || 'admin123';

    if (cleanUser === expectedUser && cleanPass === expectedPass) {
      const response = NextResponse.json({
        success: true,
        message: 'Admin authenticated successfully.'
      });

      response.cookies.set('jg_admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 12, // 12 hours
        path: '/'
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Invalid Admin User ID or Password.' },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Authentication error' },
      { status: 500 }
    );
  }
}
