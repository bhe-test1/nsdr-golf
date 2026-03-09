import { NextRequest, NextResponse } from 'next/server'

/**
 * KOVEN PG 결제 후 복귀 - 취소/성공 모두 기본 페이지(/)로 이동
 */
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/', request.nextUrl.origin), 302)
}

export async function POST(request: NextRequest) {
  try {
    return NextResponse.redirect(new URL('/', request.nextUrl.origin), 302)
  } catch {
    return NextResponse.redirect(new URL('/', request.nextUrl.origin), 302)
  }
}
