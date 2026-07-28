import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get('jg_admin_session')?.value;
  const isAuthenticated = sessionCookie === 'authenticated';

  return NextResponse.json({
    isAdmin: isAuthenticated
  });
}
