import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MongoClient, ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// 가격 정보 조회
export async function GET(request: NextRequest) {
  try {
    // 쿠키나 헤더에서 ownerId 가져오기
    const cookieHeader = request.headers.get('cookie')
    
    let ownerId: string | null = null
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)
      ownerId = cookies['ownerId'] || null
    }
    
    if (!ownerId) {
      ownerId = request.headers.get('x-owner-id')
    }
    
    if (!ownerId) {
      return NextResponse.json(
        { error: '인증이 필요합니다. 로그인해주세요.' },
        { status: 401 }
      )
    }

    try {
      // Prisma로 가격 정보 조회
      const price = await prisma.price.findUnique({
        where: {
          ownerId: ownerId,
        },
      })

      if (!price) {
        // 가격 정보가 없으면 빈 데이터 반환
        return NextResponse.json({
          gamePrices: { weekday: [], weekend: [] },
          foodPrices: [],
          golfPrices: [],
        })
      }

      return NextResponse.json({
        gamePrices: price.gamePrices || { weekday: [], weekend: [] },
        foodPrices: price.foodPrices || [],
        golfPrices: price.golfPrices || [],
      })
    } catch (error: any) {
      console.error('가격 정보 조회 오류:', error)
      return NextResponse.json(
        { error: '가격 정보를 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('가격 정보 조회 오류:', error)
    return NextResponse.json(
      { error: '가격 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 가격 정보 저장
export async function POST(request: NextRequest) {
  try {
    // 쿠키나 헤더에서 ownerId 가져오기
    const cookieHeader = request.headers.get('cookie')
    
    let ownerId: string | null = null
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)
      ownerId = cookies['ownerId'] || null
    }
    
    if (!ownerId) {
      ownerId = request.headers.get('x-owner-id')
    }
    
    if (!ownerId) {
      return NextResponse.json(
        { error: '인증이 필요합니다. 로그인해주세요.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { gamePrices, foodPrices, golfPrices } = body

    if (!gamePrices && !foodPrices && !golfPrices) {
      return NextResponse.json(
        { error: '가격 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    try {
      // 가격 정보 저장 또는 업데이트
      const price = await prisma.price.upsert({
        where: {
          ownerId: ownerId,
        },
        update: {
          gamePrices: gamePrices || undefined,
          foodPrices: foodPrices || undefined,
          golfPrices: golfPrices || undefined,
          updatedAt: new Date(),
        },
        create: {
          ownerId: ownerId,
          gamePrices: gamePrices || { weekday: [], weekend: [] },
          foodPrices: foodPrices || [],
          golfPrices: golfPrices || [],
        },
      })

      return NextResponse.json({
        message: '가격 정보가 저장되었습니다.',
        price: {
          gamePrices: price.gamePrices,
          foodPrices: price.foodPrices,
          golfPrices: price.golfPrices,
        },
      })
    } catch (error: any) {
      console.error('가격 정보 저장 오류:', error)
      return NextResponse.json(
        { error: '가격 정보를 저장하는데 실패했습니다.' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('가격 정보 저장 오류:', error)
    return NextResponse.json(
      { error: '가격 정보를 저장하는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

