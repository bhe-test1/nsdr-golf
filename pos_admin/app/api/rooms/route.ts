import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// 룸 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 기본 10개의 룸 데이터 생성 (1-10번)
    const rooms = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      isActive: false,
      gameTime: undefined,
      remainingTime: undefined,
      players: undefined,
      gameName: undefined,
      paymentAmount: undefined,
    }))

    return NextResponse.json(rooms, { status: 200 })
  } catch (error: any) {
    console.error('룸 목록 조회 에러:', error)
    return NextResponse.json(
      { error: '룸 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

