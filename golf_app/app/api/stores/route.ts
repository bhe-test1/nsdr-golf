import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

export const dynamic = 'force-dynamic'

// 노출 상태 확인 함수 (news 필드에서 정보 추출)
function checkStoreExposure(store: any): boolean {
  if (!store.news) {
    console.log('노출 체크 실패 - news 필드 없음:', store.id || store._id)
    return false
  }

  try {
    const newsData = typeof store.news === 'string' ? JSON.parse(store.news) : store.news
    
    // 매장 정보 체크
    const businessNumberOk = newsData?.businessNumber && String(newsData.businessNumber).trim() !== ''
    const platformOk = newsData?.platform && String(newsData.platform).trim() !== ''
    const openDateOk = newsData?.openDate && String(newsData.openDate).trim() !== ''
    
    // 운영 정보 체크
    const totalRoomsValue = Number(newsData?.totalRooms) || 0
    const totalRoomsOk = totalRoomsValue > 0
    // 편의시설은 선택사항이므로 항상 true (관리자 앱과 일치)
    const facilitiesOk = true
    
    // 매장 기본 정보 체크 (location, type 등)
    const locationOk = store.location && String(store.location).trim() !== ''
    const typeOk = store.type && String(store.type).trim() !== ''
    
    // 노출 상태 확인 (기본 정보 + 매장 정보 + 운영 정보)
    const isStoreInfoComplete = businessNumberOk && platformOk && openDateOk && locationOk && typeOk
    const isOperationInfoComplete = totalRoomsOk && facilitiesOk
    
    const isExposed = isStoreInfoComplete && isOperationInfoComplete
    
    // 디버깅: 노출되지 않는 경우 상세 정보 출력
    if (!isExposed) {
      console.log('노출 체크 실패 상세:', {
        storeId: store.id || store._id,
        storeName: store.name,
        businessNumber: { 값: newsData?.businessNumber, 체크: businessNumberOk },
        platform: { 값: newsData?.platform, 체크: platformOk },
        openDate: { 값: newsData?.openDate, 체크: openDateOk },
        totalRooms: { 값: totalRoomsValue, 체크: totalRoomsOk },
        location: { 값: store.location, 체크: locationOk },
        type: { 값: store.type, 체크: typeOk },
        isStoreInfoComplete,
        isOperationInfoComplete,
      })
    }
    
    return isExposed
  } catch (error) {
    console.error('노출 상태 확인 에러:', error, 'store:', store.id || store._id)
    return false
  }
}

// 매장 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') // 검색어
    const location = searchParams.get('location') // 지역
    const category = searchParams.get('category') // 카테고리
    const type = searchParams.get('type') // 타입 (스크린골프, 골프연습장 등)
    const district = searchParams.get('district') // 구/시

    // 매장 목록 조회
    const where: any = {}

    // 검색어 필터
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { location: { contains: q } },
      ]
    }

    // 지역 필터
    if (location) {
      where.location = { contains: location }
    }

    // 구/시 필터
    if (district) {
      where.location = { contains: district }
    }

    // 타입 필터
    if (type) {
      // 타입 매핑: screen -> 스크린골프, range -> 골프연습장, field -> 파크골프
      const typeMap: Record<string, string> = {
        screen: '스크린골프',
        range: '골프연습장',
        field: '파크골프',
      }
      where.type = typeMap[type] || type
    }

    // 카테고리 필터 (type과 동일하게 처리)
    if (category) {
      where.type = category
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
    let stores: any[] = []

    try {
      await client.connect()
      const db = client.db('golf_app')
      const storesCollection = db.collection('stores')
      
      // MongoDB 쿼리 조건 생성
      const mongoQuery: any = {}
      
      // 검색어 필터
      if (q) {
        mongoQuery.$or = [
          { name: { $regex: q, $options: 'i' } },
          { location: { $regex: q, $options: 'i' } },
        ]
      }
      
      // 지역 필터
      if (location) {
        mongoQuery.location = { $regex: location, $options: 'i' }
      }
      
      // 구/시 필터
      if (district) {
        mongoQuery.location = { $regex: district, $options: 'i' }
      }
      
      // 타입 필터
      if (type) {
        const typeMap: Record<string, string> = {
          screen: '스크린골프',
          range: '골프연습장',
          field: '파크골프',
        }
        mongoQuery.type = typeMap[type] || type
      }
      
      // 카테고리 필터
      if (category) {
        mongoQuery.type = category
      }
      
      console.log('매장 조회 조건:', mongoQuery)
      
      // 매장 조회
      stores = await storesCollection.find(mongoQuery).sort({ created_at: -1 }).toArray()
      
      // _id를 id로 변환
      stores = stores.map(store => ({
        ...store,
        id: store._id.toString(),
      }))
    } finally {
      await client.close()
    }

    // 노출 상태가 true인 매장만 필터링
    const exposedStores = stores.filter(store => checkStoreExposure(store))

    console.log('조회된 매장 수:', stores.length)
    console.log('노출된 매장 수:', exposedStores.length)
    if (exposedStores.length > 0) {
      console.log('매장 목록:', exposedStores.map(s => ({ id: s.id, name: s.name, type: s.type, location: s.location })))
    }

    // Store 타입에 맞게 변환
    const formattedStores = exposedStores.map((store: any) => ({
      id: store.id,
      name: store.name,
      location: store.location,
      latitude: store.latitude,
      longitude: store.longitude,
      imageUrl: store.imageUrl,
      price: store.price ?? null,
      rating: store.rating ?? null,
      reviewCount: store.reviewCount ?? null,
      description: store.description,
      news: store.news,
      notice: store.notice,
      parking: store.parking,
      type: store.type,
    }))

    return NextResponse.json(formattedStores)
  } catch (error: any) {
    console.error('매장 목록 조회 에러:', error)
    return NextResponse.json(
      { 
        error: '매장 목록을 불러오는데 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

