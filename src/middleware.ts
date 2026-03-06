import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Auth check relies on client-side zustand/localStorage;
  // redirect is done in client components.
  return NextResponse.next();
}

export const config = { matcher: ['/((?!api|_next|favicon.ico).*)'] };
