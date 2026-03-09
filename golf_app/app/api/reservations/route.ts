import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { validateObjectId } from '@/lib/mongodb-utils'

export const dynamic = 'force-dynamic'

function getUserIdFromToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  // 간단한 토큰 검증 (실제로는 JWT 등을 사용해야 함)
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    return decoded.userId || null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request) // 로그인하지 않은 경우 null

    const body = await request.json()
    const { storeId, date, time, players, room, reservatorName, contactNumber, playType, holes, gameCount, durationMinutes } = body

    if (!storeId || !date || !time) {
      return NextResponse.json(
        { message: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 예약자명과 연락처는 필수 (로그인 없이 예약하는 경우)
    if (!reservatorName || !contactNumber) {
      return NextResponse.json(
        { message: '예약자명과 연락처를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 평일/주말 자동 판단 (0 = 일요일, 6 = 토요일)
    const reservationDate = new Date(date)
    const dayOfWeek = reservationDate.getDay()
    const dayType = (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'weekday'

    // userId가 있는 경우 ObjectID 검증
    if (userId) {
      const userIdValidation = validateObjectId(userId, '사용자 ID')
      if (!userIdValidation.valid) {
        return NextResponse.json(
          { message: userIdValidation.error },
          { status: 400 }
        )
      }
    }

    // storeId ObjectID 검증
    const storeIdValidation = validateObjectId(storeId, '매장 ID')
    if (!storeIdValidation.valid) {
      return NextResponse.json(
        { message: storeIdValidation.error },
        { status: 400 }
      )
    }

    // MongoDB 네이티브 쿼리로 예약 생성
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
      const reservationsCollection = db.collection('reservations')
      const storesCollection = db.collection('stores')
      
      // 매장 정보 조회 (ownerId 가져오기)
      const storeDoc = await storesCollection.findOne({ _id: new ObjectId(storeId) })
      if (!storeDoc) {
        return NextResponse.json(
          { message: '매장을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      
      // 방 번호를 숫자로 변환 (예: "1번방" -> 1, "1번 방" -> 1)
      let roomNumber: number | null = null
      if (room) {
        const roomMatch = room.match(/\d+/)
        if (roomMatch) {
          roomNumber = parseInt(roomMatch[0], 10)
        }
      }
      
      // 이용시간(분): 기본 1명 9홀=30분, 18홀=60분. 인원×홀에 따라 N배. 없으면 60분
      const durationMin = durationMinutes != null ? Number(durationMinutes) : 60

      const reservation: any = {
        store_id: new ObjectId(storeId),
        date: new Date(date),
        time,
        players: players || 4,
        status: 'CONFIRMED', // 결제 완료 시 바로 확정 상태로 변경
        room: room || null,
        roomNumber: roomNumber, // 숫자로 저장
        reservator_name: reservatorName,
        contact_number: contactNumber,
        play_type: playType || null,
        holes: holes || null,
        game_count: gameCount || null,
        duration_minutes: durationMin,
        day_type: dayType, // 평일/주말 구분
        created_at: new Date(),
        updated_at: new Date(),
      }

      // 로그인한 경우에만 user_id 추가
      if (userId) {
        reservation.user_id = new ObjectId(userId)
      }

      const result = await reservationsCollection.insertOne(reservation)
      
      // pos_admin의 users 컬렉션에 사용자 정보 등록 (전화번호 기준)
      if (storeDoc.ownerId || storeDoc.owner_id) {
        try {
          const posAdminDb = client.db('pos_admin')
          const usersCollection = posAdminDb.collection('users')
          const ownerId = storeDoc.ownerId || storeDoc.owner_id
          const ownerIdObjectId = ownerId instanceof ObjectId ? ownerId : new ObjectId(ownerId)
          
          // 전화번호 정리 (하이픈 제거)
          const cleanPhone = contactNumber.replace(/-/g, '')
          
          // 전화번호로 기존 사용자 확인
          const existingUser = await usersCollection.findOne({
            phone: cleanPhone,
            ownerId: ownerIdObjectId, // 같은 점주의 사용자만 확인
          })
          
          if (!existingUser) {
            // 새 사용자 등록
            await usersCollection.insertOne({
              ownerId: ownerIdObjectId,
              name: reservatorName,
              phone: cleanPhone,
              email: null, // 이메일은 선택사항
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          } else {
            // 기존 사용자 정보 업데이트 (이름이 변경되었을 수 있음)
            await usersCollection.updateOne(
              { _id: existingUser._id },
              {
                $set: {
                  name: reservatorName,
                  updatedAt: new Date(),
                },
              }
            )
          }
        } catch (error) {
          console.warn('pos_admin 사용자 등록 실패 (예약은 정상 처리됨):', error)
          // 사용자 등록 실패해도 예약은 정상 처리
        }
      }
      
      return NextResponse.json({
        id: result.insertedId.toString(),
        ...reservation,
        userId: userId || null,
        storeId: storeId,
      }, { status: 201 })
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error('예약 생성 실패:', error)
    return NextResponse.json(
      { message: '예약 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: '인증이 필요합니다.' }, { status: 401 })
    }

    // userId ObjectID 검증
    const userIdValidation = validateObjectId(userId, '사용자 ID')
    if (!userIdValidation.valid) {
      return NextResponse.json(
        { message: userIdValidation.error },
        { status: 400 }
      )
    }

    // MongoDB 네이티브 쿼리로 예약 조회
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
      const reservationsCollection = db.collection('reservations')
      const storesCollection = db.collection('stores')
      
      // 예약 조회
      const reservations = await reservationsCollection
        .find({ user_id: new ObjectId(userId) })
        .sort({ date: -1, created_at: -1 })
        .toArray()

      // 매장 정보 조회 및 결합
      const reservationsWithStore = await Promise.all(
        reservations.map(async (reservation) => {
          const store = await storesCollection.findOne({
            _id: reservation.store_id
          })
          
          return {
            id: reservation._id.toString(),
            userId: reservation.user_id?.toString() || null,
            storeId: reservation.store_id.toString(),
            date: reservation.date,
            time: reservation.time,
            players: reservation.players,
            status: reservation.status,
            room: reservation.room || reservation.roomNumber ? `${reservation.roomNumber || reservation.room}번방` : null,
            reservatorName: reservation.reservator_name || null,
            contactNumber: reservation.contact_number || null,
            playType: reservation.play_type || null,
            holes: reservation.holes || null,
            gameCount: reservation.game_count || null,
            dayType: reservation.day_type || null,
            store: store ? {
              id: store._id.toString(),
              name: store.name,
              location: store.location,
            } : null,
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

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: '인증이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reservationId = searchParams.get('id')

    if (!reservationId) {
      return NextResponse.json(
        { message: '예약 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // reservationId ObjectID 검증
    const reservationIdValidation = validateObjectId(reservationId, '예약 ID')
    if (!reservationIdValidation.valid) {
      return NextResponse.json(
        { message: reservationIdValidation.error },
        { status: 400 }
      )
    }

    // userId ObjectID 검증
    const userIdValidation = validateObjectId(userId, '사용자 ID')
    if (!userIdValidation.valid) {
      return NextResponse.json(
        { message: userIdValidation.error },
        { status: 400 }
      )
    }

    // MongoDB 네이티브 쿼리로 예약 취소
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
      const reservationsCollection = db.collection('reservations')
      
      // 예약 조회 및 소유권 확인
      const reservation = await reservationsCollection.findOne({
        _id: new ObjectId(reservationId),
        user_id: new ObjectId(userId)
      })

      if (!reservation) {
        return NextResponse.json(
          { message: '예약을 찾을 수 없거나 취소할 권한이 없습니다.' },
          { status: 404 }
        )
      }

      // permanent 파라미터 확인 (완전 삭제 여부)
      const permanent = searchParams.get('permanent') === 'true'

      // 이미 취소된 예약이고 완전 삭제를 요청한 경우
      if (reservation.status === 'CANCELLED' && permanent) {
        // 예약 완전 삭제
        const deleteResult = await reservationsCollection.deleteOne({
          _id: new ObjectId(reservationId),
          user_id: new ObjectId(userId)
        })

        if (deleteResult.deletedCount === 0) {
          return NextResponse.json(
            { message: '예약을 찾을 수 없습니다.' },
            { status: 404 }
          )
        }

        return NextResponse.json({
          message: '예약이 삭제되었습니다.',
          id: reservationId
        })
      }

      // 이미 취소된 예약인지 확인
      if (reservation.status === 'CANCELLED') {
        return NextResponse.json(
          { message: '이미 취소된 예약입니다.' },
          { status: 400 }
        )
      }

      // 예약 취소 (상태를 CANCELLED로 변경)
      const result = await reservationsCollection.updateOne(
        { _id: new ObjectId(reservationId) },
        {
          $set: {
            status: 'CANCELLED',
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
        message: '예약이 취소되었습니다.',
        id: reservationId
      })
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error('예약 취소 실패:', error)
    return NextResponse.json(
      { message: '예약 취소에 실패했습니다.' },
      { status: 500 }
    )
  }
}

