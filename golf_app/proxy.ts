import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith('/payment/return') && pathname.length > '/payment/return'.length) {
    const rest = pathname.slice('/payment/return'.length)
    if (rest.startsWith('&') || rest.startsWith('&#63;')) {
      const queryPart = rest.replace(/^&#63;/, '?').replace(/^&/, '')
      const url = request.nextUrl.clone()
      url.pathname = '/payment/return'
      url.search = (url.search ? url.search + '&' : '?') + queryPart
      return NextResponse.rewrite(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/payment/:path*'],
}
