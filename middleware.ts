import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  try {
    // Check if NEXTAUTH_SECRET is configured
    if (!process.env.NEXTAUTH_SECRET) {
      console.error('NEXTAUTH_SECRET is not configured')
      // Allow the request to proceed - the auth route will handle the error
      return NextResponse.next()
    }

    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    const { pathname } = request.nextUrl

    // Protect dashboard routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/study') || 
        pathname.startsWith('/tasks') || pathname.startsWith('/notes') ||
        pathname.startsWith('/chat')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // Redirect authenticated users away from login/register
    if ((pathname === '/login' || pathname === '/register') && token) {
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

