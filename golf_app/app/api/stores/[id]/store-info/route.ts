import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { validateObjectId } from '@/lib/mongodb-utils'

export const dynamic = 'force-dynamic'

// pos_admin에서 매장 정보 조회
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

    const client = new MongoClient(databaseUrl)
    
    try {
      await client.connect()
      const db = client.db('golf_app')
      const storesCollection = db.collection('stores')
      
      // 매장 조회
      const storeDoc = await storesCollection.findOne({ _id: new ObjectId(id) })
      
      if (!storeDoc) {
        return NextResponse.json(
          { error: '매장을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      // ownerId 가져오기
      const ownerId = storeDoc.ownerId || storeDoc.owner_id
      
      if (!ownerId) {
        return NextResponse.json({
          ownerName: '',
          storeName: '',
          address: '',
          detailAddress: '',
          storeType: '',
          platform: '',
        })
      }

      // pos_admin 데이터베이스에서 매장 정보 조회
      const posAdminDb = client.db('pos_admin')
      const storeInfoCollection = posAdminDb.collection('store_info')
      
      // ownerId를 ObjectId로 변환
      const ownerIdObjectId = ownerId instanceof ObjectId ? ownerId : new ObjectId(ownerId)
      
      // store_info에서 조회
      const storeInfoDoc = await storeInfoCollection.findOne({ ownerId: ownerIdObjectId })
      
      // power_admin에서 점주 정보 조회 (대표자명)
      let ownerName = ''
      let storeName = ''
      let address = ''
      let detailAddress = ''
      let storeType = ''
      let platform = ''
      
      try {
        // 같은 클라이언트를 사용하여 power_admin 데이터베이스 접근
        // MongoDB는 같은 연결에서 여러 데이터베이스에 접근 가능
        const powerAdminDb = client.db('power_admin')
        const storeOwnerCollection = powerAdminDb.collection('store_owner')
        
        const ownerDoc = await storeOwnerCollection.findOne({ _id: ownerIdObjectId })
        
        if (ownerDoc) {
          ownerName = ownerDoc.name || ''
          storeName = ownerDoc.store_name || ''
          address = ownerDoc.address || ''
          detailAddress = ownerDoc.detail_address || ''
          storeType = ownerDoc.store_type || ''
          platform = ownerDoc.platform || ''
        }
      } catch (error) {
        console.error('power_admin 조회 오류:', error)
        // 에러가 발생해도 계속 진행 (기본값 사용)
      }

      return NextResponse.json({
        ownerName,
        storeName,
        address,
        detailAddress,
        storeType,
        platform,
        parkingAvailable: storeInfoDoc?.parkingAvailable || false,
        parkingSpaces: storeInfoDoc?.parkingSpaces || 0,
        facilities: storeInfoDoc?.facilities || [],
      })
    } catch (error: any) {
      console.error('매장 정보 조회 오류:', error)
      return NextResponse.json(
        { error: '매장 정보를 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    } finally {
      await client.close()
    }
  } catch (error: any) {
    console.error('매장 정보 조회 오류:', error)
    return NextResponse.json(
      { error: '매장 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

