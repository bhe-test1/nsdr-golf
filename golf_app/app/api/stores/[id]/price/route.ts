import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { validateObjectId } from '@/lib/mongodb-utils'

export const dynamic = 'force-dynamic'

// 매장 가격 정보 조회
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

    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json(
        { error: '데이터베이스 연결 설정이 없습니다.' },
        { status: 500 }
      )
    }

    // MongoDB 연결 (같은 클러스터 내의 다른 데이터베이스에 접근 가능)
    const client = new MongoClient(databaseUrl)
    
    try {
      await client.connect()
      
      // golf_app 데이터베이스에서 매장 정보 조회
      const golfAppDb = client.db('golf_app')
      const storesCollection = golfAppDb.collection('stores')
      
      // 매장 조회
      const storeDoc = await storesCollection.findOne({ _id: new ObjectId(id) })
      
      if (!storeDoc) {
        return NextResponse.json(
          { error: '매장을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      // 매장의 업장구분 확인 (type 필드)
      const storeType = storeDoc.type || ''
      const isPracticeRange = storeType === '골프연습장' || storeType === '연습장'

      // ownerId 가져오기
      const ownerId = storeDoc.ownerId || storeDoc.owner_id
      
      if (!ownerId) {
        return NextResponse.json({
          gamePrices: { weekday: [], weekend: [] },
          foodPrices: { weekday: [], weekend: [] },
          golfPrices: [],
        })
      }

      // pos_admin 데이터베이스에서 가격 정보 조회
      const posAdminDb = client.db('pos_admin')
      const priceCollection = posAdminDb.collection('price')
      
      // ownerId를 ObjectId로 변환 (문자열이면 변환, 이미 ObjectId면 그대로 사용)
      const ownerIdObjectId = ownerId instanceof ObjectId ? ownerId : new ObjectId(ownerId)
      
      // owner_id로 조회 시도
      let priceDoc = await priceCollection.findOne({ owner_id: ownerIdObjectId })
      
      // 없으면 ownerId로도 시도 (Prisma가 저장할 때 경우에 따라 다를 수 있음)
      if (!priceDoc) {
        priceDoc = await priceCollection.findOne({ ownerId: ownerIdObjectId })
      }
      
      // 없으면 문자열로도 시도
      if (!priceDoc) {
        const ownerIdString = ownerId instanceof ObjectId ? ownerId.toString() : ownerId
        priceDoc = await priceCollection.findOne({ owner_id: ownerIdString })
      }
      
      if (!priceDoc) {
        console.log('가격 정보를 찾을 수 없습니다. ownerId:', ownerId, 'ownerIdObjectId:', ownerIdObjectId)
        return NextResponse.json({
          gamePrices: { weekday: [], weekend: [] },
          foodPrices: { weekday: [], weekend: [] },
          golfPrices: [],
        })
      }

      // 업장구분에 따라 다른 가격 필드 조회
      // pos_admin에서 연습장인 경우에도 "게임" 탭에 가격을 입력하므로 game_prices에 저장됨
      // 따라서 모든 업장구분에서 game_prices를 조회
      let gamePricesData = priceDoc.game_prices || priceDoc.gamePrices || { weekday: [], weekend: [] }
      
      // golf_prices도 함께 조회 (골프용품 가격)
      let golfPricesData: any[] = []
      golfPricesData = priceDoc.golf_prices || priceDoc.golfPrices || []
      // golfPrices가 객체 형태일 수도 있으므로 배열로 변환
      if (!Array.isArray(golfPricesData)) {
        golfPricesData = []
      }
      
      // foodPrices 필드 처리 (food_prices 또는 foodPrices)
      let foodPricesData = priceDoc.food_prices || priceDoc.foodPrices || { weekday: [], weekend: [] }
      
      // foodPrices가 배열 형태로 저장되어 있을 경우 weekday로 변환
      if (Array.isArray(foodPricesData)) {
        foodPricesData = {
          weekday: foodPricesData,
          weekend: []
        }
      }
      
      console.log('가격 정보 조회 성공:', { 
        ownerId, 
        storeType, 
        isPracticeRange,
        gamePricesData, 
        golfPricesData,
        foodPricesData 
      })
      
      return NextResponse.json({
        gamePrices: gamePricesData,
        foodPrices: foodPricesData,
        golfPrices: golfPricesData,
      })
    } catch (error: any) {
      console.error('가격 정보 조회 오류:', error)
      return NextResponse.json(
        { error: '가격 정보를 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    } finally {
      await client.close()
    }
  } catch (error: any) {
    console.error('가격 정보 조회 오류:', error)
    return NextResponse.json(
      { error: '가격 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

