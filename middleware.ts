import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get NextAuth session cookie safely
  const sessionToken =
    request.cookies.get('next-auth.session-token')?.value ??
    request.cookies.get('__Secure-next-auth.session-token')?.value

  const hasSession = !!sessionToken

  // Protect authenticated routes
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/study') ||
    pathname.startsWith('/tasks') ||
    pathname.startsWith('/notes') ||
    pathname.startsWith('/chat')
  ) {
    if (!hasSession) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Prevent logged-in users from visiting login/register
  if ((pathname === '/login' || pathname === '/register') && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/study/:path*',
    '/tasks/:path*',
    '/notes/:path*',
    '/chat/:path*',
    '/login',
    '/register'
  ]
}
