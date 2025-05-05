import { NextResponse, NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only execute this middleware for the root path
  if (request.nextUrl.pathname === '/') {
    // This ensures the root path is properly handled and not redirected
    return NextResponse.next()
  }
  
  // For all other paths, continue normal processing
  return NextResponse.next()
}

// Configure the matcher to only run this middleware on the root path
export const config = {
  matcher: '/',
}