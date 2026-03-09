import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { validateObjectId } from '@/lib/mongodb-utils'

export const dynamic = 'force-dynamic'

// 매장 상세 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // ObjectID 형식 검증
    const validation = validateObjectId(id, '매장 ID')
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // MongoDB 네이티브 쿼리로 매장 조회
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json(
        { error: '데이터베이스 연결 설정이 없습니다.' },
        { status: 500 }
      )
    }

    const client = new MongoClient(databaseUrl)
    let store: any = null
    let ownerPhone: string | null = null

    try {
      await client.connect()
      const db = client.db('golf_app')
      const storesCollection = db.collection('stores')
      
      // ObjectId로 변환하여 매장 조회
      const storeDoc = await storesCollection.findOne({ _id: new ObjectId(id) })
      
      if (storeDoc) {
        // _id를 id로 변환
        store = {
          ...storeDoc,
          id: storeDoc._id.toString(),
        }

        // Owner 정보 조회 (전화번호를 위해)
        if (store.ownerId || store.owner_id) {
          try {
            const ownersCollection = db.collection('owners')
            const ownerId = store.ownerId || store.owner_id
            // ownerId가 ObjectId인 경우와 문자열인 경우 모두 처리
            const ownerObjectId = ownerId instanceof ObjectId ? ownerId : new ObjectId(ownerId)
            const ownerDoc = await ownersCollection.findOne({ 
              _id: ownerObjectId 
            })
            ownerPhone = ownerDoc?.phone || null
          } catch (error) {
            console.warn('Owner 정보 조회 실패:', error)
          }
        }
      }
    } finally {
      await client.close()
    }

    if (!store) {
      return NextResponse.json(
        { error: '매장을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // news 필드에서 메타데이터 파싱
    let facilities: string[] = []
    let totalRooms = 0
    let platform = ''
    let businessNumber = ''
    let openDate = ''
    
    if (store.news) {
      try {
        // 이미 객체인 경우와 문자열인 경우 모두 처리
        const parsed = typeof store.news === 'string' ? JSON.parse(store.news) : store.news
        // 배열 형태 (이전 버전 호환)
        if (Array.isArray(parsed)) {
          facilities = parsed
        }
        // 객체 형태 (새 버전: {facilities: [...], totalRooms: number, platform: string, businessNumber: string, openDate: string})
        else if (typeof parsed === 'object' && parsed !== null) {
          facilities = Array.isArray(parsed.facilities) ? parsed.facilities : []
          totalRooms = typeof parsed.totalRooms === 'number' ? parsed.totalRooms : 0
          platform = typeof parsed.platform === 'string' ? parsed.platform : ''
          businessNumber = typeof parsed.businessNumber === 'string' ? parsed.businessNumber : ''
          openDate = typeof parsed.openDate === 'string' ? parsed.openDate : ''
        }
      } catch (e) {
        // JSON 파싱 실패 시 기본값 유지
        console.warn('매장 메타데이터 파싱 실패:', e)
      }
    }

    // Store 타입에 맞게 변환 (필드명 매핑 처리)
    const formattedStore = {
      id: store.id,
      name: store.name,
      location: store.location,
      latitude: store.latitude,
      longitude: store.longitude,
      imageUrl: store.imageUrl || store.image_url || null,
      price: store.price ?? null,
      rating: store.rating ?? null,
      reviewCount: store.reviewCount ?? store.review_count ?? null,
      description: store.description,
      news: store.news,
      notice: store.notice,
      parking: store.parking,
      type: store.type,
      facilities: facilities.length > 0 ? facilities : undefined,
      totalRooms: totalRooms > 0 ? totalRooms : undefined,
      platform: platform || undefined,
      businessNumber: businessNumber || undefined,
      openDate: openDate || undefined,
      phone: ownerPhone || undefined,
    }

    return NextResponse.json(formattedStore)
  } catch (error: any) {
    console.error('매장 상세 조회 에러:', error)
    return NextResponse.json(
      { 
        error: '매장 정보를 불러오는데 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

