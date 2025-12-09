import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

    // Skip middleware for API routes, static files, and Next.js internals
    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/icon') ||
      pathname.includes('.')
    ) {
      return NextResponse.next()
    }

    // Get NextAuth session cookie safely (Edge-compatible)
    const sessionToken =
      request.cookies.get('next-auth.session-token')?.value ??
      request.cookies.get('__Secure-next-auth.session-token')?.value

    const hasSession = !!sessionToken

    // Handle root path
    if (pathname === '/') {
      if (hasSession) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // Protect authenticated routes
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/stats') ||
      pathname.startsWith('/study') ||
      pathname.startsWith('/tasks') ||
      pathname.startsWith('/notes') ||
      pathname.startsWith('/reminders') ||
      pathname.startsWith('/chat') ||
      pathname.startsWith('/settings')
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
  } catch (error) {
    // On any error, allow request to proceed
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icon files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.*).*)',
  ],
}
