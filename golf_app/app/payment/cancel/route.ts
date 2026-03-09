import { NextRequest, NextResponse } from 'next/server'

/**
 * 결제 취소 시 PG에서 이 URL로 리다이렉트됨.
 * 파라미터/해시 없이 루트(/)로 깔끔하게 이동.
 */
export function GET(request: NextRequest) {
  const url = new URL('/', request.nextUrl.origin)
  return NextResponse.redirect(url, 302)
}

export function POST(request: NextRequest) {
  const url = new URL('/', request.nextUrl.origin)
  return NextResponse.redirect(url, 302)
}
