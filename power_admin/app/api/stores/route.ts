import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// 매장 목록 조회 (store_owner에서 조회)
export async function GET(request: NextRequest) {
  try {
    // DATABASE_URL 확인
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL이 설정되지 않았습니다.')
      return NextResponse.json(
        { error: '데이터베이스 연결 설정이 없습니다.' },
        { status: 500 }
      )
    }

    // Prisma 연결 테스트
    await prisma.$connect().catch((err) => {
      console.error('Prisma 연결 실패:', err)
      throw new Error(`데이터베이스 연결 실패: ${err.message}`)
    })

    // store_owner에서 모든 점주 조회 (매장 정보 포함)
    const owners = await prisma.owner.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 매장 정보로 변환
    const stores = owners.map((owner) => {
      const storeName = (owner as any).storeName || owner.representativeName || '매장명 없음'
      const address = owner.address || ''
      const detailAddress = owner.detailAddress || ''
      const location = detailAddress ? `${address} ${detailAddress}` : address

      return {
        id: owner.id,
        name: storeName,
        ownerName: owner.representativeName || owner.name || '',
        ownerId: owner.id,
        location: location || '주소 없음',
        type: owner.storeType || '스크린골프',
        status: (owner.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
      }
    })

    return NextResponse.json({ stores }, { status: 200 })
  } catch (error: any) {
    console.error('매장 목록 조회 에러:', error)
    const errorMessage = error?.message || '매장 목록을 불러오는데 실패했습니다.'
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}

