import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 🔥 Notice the function is now called 'proxy' instead of 'middleware'
export function proxy(request: NextRequest) {
  const cookies = request.cookies.getAll()
  const hasSession = cookies.some(cookie => cookie.name.includes('-auth-token'))

  const path = request.nextUrl.pathname

  // Protect Private Routes
  if (!hasSession && (path.startsWith('/dashboard') || path.startsWith('/friends') || path.startsWith('/settings'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Keep Logged-In Users Away From the Login Page
  if (hasSession && path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/friends/:path*', 
    '/settings/:path*', 
    '/login'
  ],
}