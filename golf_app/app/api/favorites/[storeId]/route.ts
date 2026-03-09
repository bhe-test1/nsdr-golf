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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ isFavorite: false })
    }

    const { storeId } = await params
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
    })

    return NextResponse.json({ isFavorite: !!favorite })
  } catch (error) {
    console.error('즐겨찾기 확인 실패:', error)
    return NextResponse.json({ isFavorite: false })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: '인증이 필요합니다.' }, { status: 401 })
    }

    const { storeId } = await params
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        storeId,
      },
    })

    return NextResponse.json(favorite, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: '이미 즐겨찾기에 추가되었습니다.' }, { status: 400 })
    }
    console.error('즐겨찾기 추가 실패:', error)
    return NextResponse.json(
      { message: '즐겨찾기 추가에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: '인증이 필요합니다.' }, { status: 401 })
    }

    const { storeId } = await params
    await prisma.favorite.delete({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
    })

    return NextResponse.json({ message: '즐겨찾기에서 제거되었습니다.' })
  } catch (error) {
    console.error('즐겨찾기 제거 실패:', error)
    return NextResponse.json(
      { message: '즐겨찾기 제거에 실패했습니다.' },
      { status: 500 }
    )
  }
}

