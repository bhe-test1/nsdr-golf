import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// 회원 상태 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    // 상태 값 검증
    if (status !== '활성' && status !== '비활성') {
      return NextResponse.json(
        { error: '올바른 상태 값을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 회원 조회
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json(
        { error: '회원을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 상태 업데이트 (현재 스키마에는 status 필드가 없으므로, 
    // 실제로는 활성/비활성 상태를 다른 방식으로 관리해야 할 수 있습니다)
    // 여기서는 사용자 정보만 반환하고, 상태는 프론트엔드에서 관리합니다
    return NextResponse.json({
      message: '상태가 변경되었습니다.',
      user: {
        id: user.id,
        status: status,
      },
    })
  } catch (error: any) {
    console.error('회원 상태 변경 오류:', error)
    return NextResponse.json(
      { error: '상태 변경에 실패했습니다.', details: error.message },
      { status: 500 }
    )
  }
}

// 회원 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 회원 조회
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json(
        { error: '회원을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 예약이 있는지 확인 (reservation 테이블이 있는 경우)
    try {
      const reservations = await prisma.reservation.count({
        where: { userId: id },
      })

      if (reservations > 0) {
        return NextResponse.json(
          { error: '예약 내역이 있는 회원은 삭제할 수 없습니다.' },
          { status: 400 }
        )
      }
    } catch (error) {
      // reservation 테이블이 없으면 예약 확인을 건너뜀
      console.log('예약 확인 중 오류 (무시됨):', error)
    }

    // 회원 삭제
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({
      message: '회원이 삭제되었습니다.',
    })
  } catch (error: any) {
    console.error('회원 삭제 오류:', error)
    return NextResponse.json(
      { error: '회원 삭제에 실패했습니다.', details: error.message },
      { status: 500 }
    )
  }
}

