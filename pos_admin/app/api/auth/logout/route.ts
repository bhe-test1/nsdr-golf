import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// 로그아웃 (쿠키 삭제)
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      { message: '로그아웃되었습니다.' },
      { status: 200 }
    )

    // 쿠키 삭제
    response.cookies.set('ownerId', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // 즉시 만료
      path: '/',
    })

    response.cookies.set('passwordHashPrefix', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // 즉시 만료
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('로그아웃 에러:', error)
    return NextResponse.json(
      { error: '로그아웃 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

