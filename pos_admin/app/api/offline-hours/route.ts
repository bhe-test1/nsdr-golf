import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// 오프라인 시간대 조회
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

    // 쿼리 파라미터에서 dayType 가져오기 (평일/주말 구분)
    const { searchParams } = new URL(request.url)
    const dayType = searchParams.get('dayType') || 'weekday' // 기본값은 평일

    if (dayType !== 'weekday' && dayType !== 'weekend') {
      return NextResponse.json(
        { error: '올바른 평일/주말 구분이 필요합니다.' },
        { status: 400 }
      )
    }

    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json(
        { error: '데이터베이스 연결 설정이 없습니다.' },
        { status: 500 }
      )
    }

    const client = new MongoClient(databaseUrl)
    try {
      await client.connect()
      const db = client.db('pos_admin')
      
      // 평일이면 day_hours, 주말이면 weekend_hours 컬렉션 사용
      const collectionName = dayType === 'weekday' ? 'day_hours' : 'weekend_hours'
      const hoursCollection = db.collection(collectionName)
      
      const ownerIdObjectId = new ObjectId(ownerId)
      const hoursDoc = await hoursCollection.findOne({ ownerId: ownerIdObjectId })
      
      const offlineHours = hoursDoc?.offlineHours || {}
      
      return NextResponse.json({ offlineHours })
    } finally {
      await client.close()
    }
  } catch (error: any) {
    console.error('오프라인 시간대 조회 오류:', error)
    return NextResponse.json(
      { error: '오프라인 시간대를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 오프라인 시간대 저장
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
    const { offlineHours, dayType } = body

    if (!offlineHours || typeof offlineHours !== 'object') {
      return NextResponse.json(
        { error: '오프라인 시간대 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    if (!dayType || (dayType !== 'weekday' && dayType !== 'weekend')) {
      return NextResponse.json(
        { error: '평일/주말 구분이 필요합니다.' },
        { status: 400 }
      )
    }

    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json(
        { error: '데이터베이스 연결 설정이 없습니다.' },
        { status: 500 }
      )
    }

    const client = new MongoClient(databaseUrl)
    try {
      await client.connect()
      const db = client.db('pos_admin')
      
      // 평일이면 day_hours, 주말이면 weekend_hours 컬렉션 사용
      const collectionName = dayType === 'weekday' ? 'day_hours' : 'weekend_hours'
      const hoursCollection = db.collection(collectionName)
      
      const ownerIdObjectId = new ObjectId(ownerId)
      
      // upsert로 저장 또는 업데이트
      await hoursCollection.updateOne(
        { ownerId: ownerIdObjectId },
        {
          $set: {
            ownerId: ownerIdObjectId,
            offlineHours: offlineHours,
            dayType: dayType,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      )
      
      return NextResponse.json({
        message: `${dayType === 'weekday' ? '평일' : '주말'} 시간대가 저장되었습니다.`,
        offlineHours,
        dayType,
      })
    } finally {
      await client.close()
    }
  } catch (error: any) {
    console.error('오프라인 시간대 저장 오류:', error)
    return NextResponse.json(
      { error: '오프라인 시간대를 저장하는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

