import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const sessionCookie = req.cookies.get('session')?.value;
  if (!sessionCookie) {
    const res = NextResponse.next();
    res.cookies.set('session', crypto.randomUUID(), {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.VERCEL_ENV === 'production',
      maxAge: 24 * 60 * 60, // 24 hours in seconds
    });
    return res;
  }
  return NextResponse.next();
}

// Apply to all routes
export const config = {
  matcher: ['/:path*'],
};
