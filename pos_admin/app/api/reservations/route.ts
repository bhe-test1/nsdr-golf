import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

function getOwnerId(request: NextRequest): string | null {
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)
    return cookies['ownerId'] || null
  }
  return request.headers.get('x-owner-id')
}

// 날짜가 평일인지 주말인지 판단하는 함수
function getDayType(dateString: string): 'weekday' | 'weekend' {
  const date = new Date(dateString)
  const day = date.getDay() // 0 = 일요일, 6 = 토요일
  return (day === 0 || day === 6) ? 'weekend' : 'weekday'
}

export async function GET(request: NextRequest) {
  try {
    const ownerId = getOwnerId(request)
    if (!ownerId) {
      return NextResponse.json({ message: '인증이 필요합니다.' }, { status: 401 })
    }

    // MongoDB 네이티브 쿼리로 예약 조회
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json(
        { error: '데이터베이스 연결 설정이 없습니다.' },
        { status: 500 }
      )
    }

    // golf_app 데이터베이스 URL 생성
    let golfAppUrl = databaseUrl
    if (databaseUrl.includes('/pos_admin')) {
      golfAppUrl = databaseUrl.replace('/pos_admin', '/golf_app')
    } else if (databaseUrl.includes('/power_admin')) {
      golfAppUrl = databaseUrl.replace('/power_admin', '/golf_app')
    } else {
      golfAppUrl = databaseUrl.replace(/(mongodb\+srv?:\/\/[^\/]+)(\/[^?]*)?(\?.*)?$/, `$1/golf_app$3`)
    }

      const client = new MongoClient(golfAppUrl)
    
    try {
      await client.connect()
      const db = client.db('golf_app')
      const reservationsCollection = db.collection('reservations')
      const storesCollection = db.collection('stores')
      
      // 점주의 매장 ID 찾기 - golf_app의 stores 컬렉션에서 직접 조회
      const ownerIdObjectId = new ObjectId(ownerId)
      
      // ownerId 또는 owner_id로 매장 찾기
      const stores = await storesCollection.find({
        $or: [
          { ownerId: ownerIdObjectId },
          { owner_id: ownerIdObjectId }
        ]
      }).toArray()
      
      if (stores.length === 0) {
        console.log('예약 조회 - 매장을 찾을 수 없음, ownerId:', ownerId)
        return NextResponse.json([])
      }
      
      const storeIds = stores.map(store => store._id)
      console.log('예약 조회 - 찾은 매장 수:', stores.length, '매장 IDs:', storeIds.map(id => id.toString()))

      // 예약 조회 (점주의 매장에 대한 예약만, 취소되지 않은 예약만)
      const reservations = await reservationsCollection
        .find({ 
          store_id: { $in: storeIds },
          status: { $ne: 'CANCELLED' } // 취소된 예약 제외
        })
        .sort({ date: 1, time: 1, created_at: 1 }) // 날짜, 시간 순으로 정렬
        .toArray()

      // 매장 정보 조회 및 결합
      const reservationsWithStore = await Promise.all(
        reservations.map(async (reservation) => {
          const store = await storesCollection.findOne({
            _id: reservation.store_id
          })
          
          // 날짜 문자열로 변환 (로컬 시간대 사용)
          let dateStr: string
          if (reservation.date instanceof Date) {
            const year = reservation.date.getFullYear()
            const month = String(reservation.date.getMonth() + 1).padStart(2, '0')
            const day = String(reservation.date.getDate()).padStart(2, '0')
            dateStr = `${year}-${month}-${day}`
          } else if (typeof reservation.date === 'string') {
            // 이미 문자열인 경우 그대로 사용하거나 파싱
            dateStr = reservation.date.split('T')[0]
          } else {
            const date = new Date(reservation.date)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            dateStr = `${year}-${month}-${day}`
          }
          
          // dayType이 없으면 자동 판단
          const dayType = reservation.day_type || getDayType(dateStr)
          
          // 방 번호 추출 (roomNumber 필드가 있으면 사용, 없으면 room 필드에서 추출)
          let roomNumber = 1
          if (reservation.roomNumber !== undefined && reservation.roomNumber !== null) {
            roomNumber = typeof reservation.roomNumber === 'number' 
              ? reservation.roomNumber 
              : parseInt(String(reservation.roomNumber)) || 1
          } else if (reservation.room !== undefined && reservation.room !== null) {
            // "3번방" 형식에서 숫자 추출
            const roomStr = String(reservation.room)
            const match = roomStr.match(/\d+/)
            roomNumber = match ? parseInt(match[0]) : 1
          }
          
          // status 필드를 올바른 타입으로 변환
          let status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' = 'PENDING'
          if (reservation.status === 'CONFIRMED' || reservation.status === 'PENDING' || reservation.status === 'CANCELLED') {
            status = reservation.status
          }
          
          // 시간 형식 정규화 (HH:MM 형식)
          let timeStr = String(reservation.time || '')
          // "15:00" 형식으로 정규화
          if (timeStr && !timeStr.includes(':')) {
            // 숫자만 있는 경우 "HH:00" 형식으로 변환
            const hour = parseInt(timeStr)
            if (!isNaN(hour)) {
              timeStr = `${hour.toString().padStart(2, '0')}:00`
            }
          } else if (timeStr.includes(':')) {
            // "HH:MM" 형식으로 정규화
            const parts = timeStr.split(':')
            if (parts.length >= 2) {
              const hour = parts[0].padStart(2, '0')
              const minute = parts[1].padStart(2, '0')
              timeStr = `${hour}:${minute}`
            }
          }
          
          return {
            id: reservation._id.toString(),
            date: dateStr,
            time: timeStr,
            customerName: reservation.reservator_name || reservation.customerName || '예약자 정보 없음',
            phone: reservation.contact_number || reservation.phone || '',
            players: reservation.players || 4,
            status: status,
            storeName: store?.name || store?.store_name || '매장',
            amount: reservation.amount != null ? reservation.amount : null,
            roomNumber: roomNumber,
            dayType: dayType,
            playType: reservation.play_type || null,
            holes: reservation.holes || null,
          }
        })
      )

      return NextResponse.json(reservationsWithStore)
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error('예약 조회 실패:', error)
    return NextResponse.json(
      { message: '예약 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ownerId = getOwnerId(request)
    if (!ownerId) {
      return NextResponse.json({ message: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { message: '예약 ID와 상태가 필요합니다.' },
        { status: 400 }
      )
    }

    // MongoDB 네이티브 쿼리로 예약 상태 변경
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json(
        { error: '데이터베이스 연결 설정이 없습니다.' },
        { status: 500 }
      )
    }

    // golf_app 데이터베이스 URL 생성
    let golfAppUrl = databaseUrl
    if (databaseUrl.includes('/pos_admin')) {
      golfAppUrl = databaseUrl.replace('/pos_admin', '/golf_app')
    } else if (databaseUrl.includes('/power_admin')) {
      golfAppUrl = databaseUrl.replace('/power_admin', '/golf_app')
    } else {
      golfAppUrl = databaseUrl.replace(/(mongodb\+srv?:\/\/[^\/]+)(\/[^?]*)?(\?.*)?$/, `$1/golf_app$3`)
    }

    const client = new MongoClient(golfAppUrl)
    
    try {
      await client.connect()
      const db = client.db('golf_app')
      const reservationsCollection = db.collection('reservations')
      const storesCollection = db.collection('stores')
      
      // 점주의 매장 ID 찾기
      const ownerIdObjectId = new ObjectId(ownerId)
      const stores = await storesCollection.find({
        $or: [
          { ownerId: ownerIdObjectId },
          { owner_id: ownerIdObjectId }
        ]
      }).toArray()
      
      if (stores.length === 0) {
        return NextResponse.json(
          { message: '매장을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      
      const storeIds = stores.map(store => store._id)
      
      // 예약 조회 및 소유권 확인
      const reservation = await reservationsCollection.findOne({
        _id: new ObjectId(id),
        store_id: { $in: storeIds }
      })

      if (!reservation) {
        return NextResponse.json(
          { message: '예약을 찾을 수 없거나 권한이 없습니다.' },
          { status: 404 }
        )
      }

      // 예약 상태 변경
      const result = await reservationsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: status,
            updated_at: new Date()
          }
        }
      )

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { message: '예약을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        message: '예약 상태가 변경되었습니다.',
        id: id,
        status: status
      })
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error('예약 상태 변경 실패:', error)
    return NextResponse.json(
      { message: '예약 상태 변경에 실패했습니다.' },
      { status: 500 }
    )
  }
}

