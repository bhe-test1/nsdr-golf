import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function getUserIdFromToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    return decoded.userId || null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: '인증이 필요합니다.' }, { status: 401 })
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        store: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(favorites)
  } catch (error) {
    console.error('즐겨찾기 조회 실패:', error)
    return NextResponse.json(
      { message: '즐겨찾기 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

