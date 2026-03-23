import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. Check if the user has a Supabase authentication cookie
  // Supabase automatically names its session cookies ending in '-auth-token'
  const cookies = request.cookies.getAll()
  const hasSession = cookies.some(cookie => cookie.name.includes('-auth-token'))

  const path = request.nextUrl.pathname

  // 2. Protect Private Routes
  // If they try to access these pages WITHOUT being logged in, kick them to /login
  if (!hasSession && (path.startsWith('/dashboard') || path.startsWith('/friends') || path.startsWith('/settings'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 3. Keep Logged-In Users Away From the Login Page
  // If they ALREADY have an account and try to go to /login, bounce them to the dashboard
  if (hasSession && path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 4. Otherwise, let them proceed normally
  return NextResponse.next()
}

// ⚙️ Tell Next.js exactly which routes this bouncer should watch
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/friends/:path*', 
    '/settings/:path*', 
    '/login'
  ],
}