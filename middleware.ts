import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl
    
    // Check for NextAuth session cookie (Edge-compatible)
    // NextAuth uses 'next-auth.session-token' or '__Secure-next-auth.session-token' cookie
    const sessionToken = request.cookies.get('next-auth.session-token') || 
                         request.cookies.get('__Secure-next-auth.session-token')
    
    const hasSession = !!sessionToken

    // Protect dashboard routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/study') || 
        pathname.startsWith('/tasks') || pathname.startsWith('/notes') ||
        pathname.startsWith('/chat')) {
      if (!hasSession) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // Redirect authenticated users away from login/register
    if ((pathname === '/login' || pathname === '/register') && hasSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, allow the request to proceed to avoid blocking the site
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

