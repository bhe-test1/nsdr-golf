import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { validateObjectId } from '@/lib/mongodb-utils'

export const dynamic = 'force-dynamic'

// 매장 예약 가능 시간 조회
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

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // YYYY-MM-DD 형식

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
      }
      
      if (!store) {
        return NextResponse.json(
          { error: '매장을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      // 선택된 날짜의 평일/주말 구분
      const selectedDate = date || new Date().toISOString().split('T')[0]
      const selectedDateObj = new Date(selectedDate)
      const dayOfWeek = selectedDateObj.getDay() // 0 = 일요일, 6 = 토요일
      const dayType = (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'weekday'
      
      // ownerId로 오프라인 시간대 조회 (평일/주말 구분)
      // 새로운 구조: { [date: string]: { [time: string]: number[] } } - 각 시간대별 OFF인 방 번호 배열
      let offlineHours: { [date: string]: { [time: string]: number[] } } = {}
      if (store.ownerId) {
        try {
          const posAdminDb = client.db('pos_admin')
          // 평일이면 day_hours, 주말이면 weekend_hours 컬렉션 사용
          const collectionName = dayType === 'weekday' ? 'day_hours' : 'weekend_hours'
          const offlineHoursCollection = posAdminDb.collection(collectionName)
          const ownerIdObjectId = typeof store.ownerId === 'string' ? new ObjectId(store.ownerId) : store.ownerId
          const offlineHoursDoc = await offlineHoursCollection.findOne({ ownerId: ownerIdObjectId })
          if (offlineHoursDoc && offlineHoursDoc.offlineHours) {
            const hours = offlineHoursDoc.offlineHours
            
            // 기존 형식(날짜별 시간대 배열)을 새 형식으로 변환
            if (hours[selectedDate]) {
              const dateData = hours[selectedDate]
              if (Array.isArray(dateData)) {
                // 기존 형식: { '2024-12-30': ['01:00', '01:30'] }
                // 모든 방이 OFF인 것으로 간주 (totalRooms가 있으면 모든 방 번호 추가)
                const convertedData: { [time: string]: number[] } = {}
                dateData.forEach((time: string) => {
                  // totalRooms는 나중에 설정되므로 일단 빈 배열로 설정
                  convertedData[time] = []
                })
                offlineHours[selectedDate] = convertedData
              } else if (typeof dateData === 'object' && dateData !== null) {
                // 새 형식: { '2024-12-30': { '01:00': [1, 2], '01:30': [] } }
                offlineHours[selectedDate] = dateData as { [time: string]: number[] }
              }
            }
          }
        } catch (error) {
          console.warn('오프라인 시간대 조회 실패:', error)
        }
      }
      
      // 선택된 날짜의 오프라인 시간대 데이터 가져오기
      const dateOfflineHours = offlineHours[selectedDate] || {} // { [time: string]: number[] }
      
      // 한국 시간(KST, UTC+9) 기준으로 현재 시간 계산
      // 서버가 UTC 타임존일 수 있으므로 명시적으로 한국 시간으로 변환
      const now = new Date()
      const koreaTimeOffset = 9 * 60 // 한국은 UTC+9 (분 단위)
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)
      const koreaTime = new Date(utcTime + (koreaTimeOffset * 60 * 1000))
      
      // 한국 시간 기준으로 오늘 날짜 문자열 생성
      const todayYear = koreaTime.getFullYear()
      const todayMonth = String(koreaTime.getMonth() + 1).padStart(2, '0')
      const todayDay = String(koreaTime.getDate()).padStart(2, '0')
      const todayString = `${todayYear}-${todayMonth}-${todayDay}`
      
      // 선택된 날짜와 오늘 날짜를 직접 비교 (이미 YYYY-MM-DD 형식)
      const isToday = selectedDate === todayString
      
      // 현재 시간을 분으로 변환하고, 다음 30분 단위로 올림
      let minTimeMinutes = 0
      if (isToday) {
        const currentHours = koreaTime.getHours()
        const currentMinutes = koreaTime.getMinutes()
        const currentTotalMinutes = currentHours * 60 + currentMinutes
        
        // 다음 30분 단위로 올림 (예: 9시 18분 -> 9시 30분, 9시 30분 -> 10시 00분, 9시 45분 -> 10시 00분)
        if (currentMinutes === 0) {
          // 정각이면 다음 30분부터
          minTimeMinutes = currentTotalMinutes + 30
        } else if (currentMinutes <= 30) {
          // 30분 이하면 다음 30분부터
          minTimeMinutes = currentHours * 60 + 30
        } else {
          // 30분 초과면 다음 정각부터
          minTimeMinutes = (currentHours + 1) * 60
        }
      }
      // 다음날, 다다음날 등은 시간이 지나지 않았으므로 00:00부터 표시 (minTimeMinutes = 0 유지)
      
      // news 필드에서 totalRooms 정보 가져오기
      let totalRooms = 3 // 기본값
      if (store.news) {
        try {
          const parsed = typeof store.news === 'string' ? JSON.parse(store.news) : store.news
          if (typeof parsed === 'object' && parsed !== null && typeof parsed.totalRooms === 'number') {
            totalRooms = parsed.totalRooms
          }
        } catch (e) {
          console.warn('매장 메타데이터 파싱 실패:', e)
        }
      }
      
      // 모든 가능한 시간대 생성 (00:00 ~ 24:00, 30분 단위)
      const allTimeSlots: string[] = []
      for (let hour = 0; hour < 24; hour++) {
        allTimeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
        allTimeSlots.push(`${hour.toString().padStart(2, '0')}:30`)
      }
      allTimeSlots.push('24:00')
      
      // 오늘이면 현재 시간의 다음 30분 단위부터만 표시
      // 다음날, 다다음날 등은 00:00부터 표시 (pos_admin에서 OFF가 아니라면)
      let filteredTimeSlots = allTimeSlots
      if (isToday && minTimeMinutes > 0) {
        filteredTimeSlots = allTimeSlots.filter((time) => {
          if (time === '24:00') return true
          const [hours, minutes] = time.split(':').map(Number)
          const timeMinutes = hours * 60 + minutes
          // 현재 시간의 다음 30분 단위부터 표시 (예: 9시 45분이면 10시 00분부터)
          return timeMinutes >= minTimeMinutes
        })
      }
      // 다음날 이후는 minTimeMinutes가 0이므로 모든 시간대 표시 (00:00부터)
      
      // 룸 목록 생성
      const rooms = Array.from({ length: totalRooms }, (_, i) => `${i + 1}번 방`)

      // 실제 예약 정보 조회
      const reservations: any[] = []
      try {
        const golfAppDb = client.db('golf_app')
        const reservationsCollection = golfAppDb.collection('reservations')
        
        // 날짜 범위로 조회 (하루 전체)
        const startDate = new Date(selectedDate)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(selectedDate)
        endDate.setHours(23, 59, 59, 999)
        
        const reservationsList = await reservationsCollection
          .find({
            store_id: new ObjectId(id),
            date: {
              $gte: startDate,
              $lte: endDate
            },
            status: { $ne: 'CANCELLED' } // 취소된 예약 제외
          })
          .toArray()
        
        reservationsList.forEach((reservation) => {
          reservations.push({
            time: reservation.time,
            room: reservation.room || reservation.roomNumber || 1, // room 필드 또는 roomNumber 필드
            duration_minutes: reservation.duration_minutes ?? 60,
          })
        })
      } catch (error) {
        console.warn('예약 정보 조회 실패:', error)
      }
      
      // 예약된 시간대 + 이용시간(분)만큼 비활성화. 30분 단위 슬롯 N개 (N = duration_minutes / 30)
      const getBlockedTimeSlots = (reservationTime: string, durationMinutes: number): string[] => {
        const blockedSlots: string[] = [reservationTime] // 예약된 시간대 포함
        const slotCount = Math.max(1, Math.ceil(durationMinutes / 30)) // 최소 1슬롯(30분)
        
        const [hours, minutes] = reservationTime.split(':').map(Number)
        const totalMinutes = hours * 60 + minutes
        
        for (let i = 1; i < slotCount; i++) {
          const nextMinutes = totalMinutes + (i * 30)
          const nextHours = Math.floor(nextMinutes / 60)
          const nextMins = nextMinutes % 60
          
          if (nextHours < 24 || (nextHours === 24 && nextMins === 0)) {
            const nextTime = `${nextHours.toString().padStart(2, '0')}:${nextMins.toString().padStart(2, '0')}`
            if (filteredTimeSlots.includes(nextTime)) {
              blockedSlots.push(nextTime)
            }
          }
        }
        
        return blockedSlots
      }
      
      // 예약 정보를 방별로 그룹화 (예약된 시간대 + 이용시간만큼 포함)
      const blockedSlotsByRoom: { [roomNumber: number]: Set<string> } = {}
      reservations.forEach((reservation: { time: string; room: string | number; duration_minutes?: number }) => {
        const time = reservation.time
        const room = reservation.room
        const durationMinutes = reservation.duration_minutes ?? 60
        const roomNumber = typeof room === 'number' ? room : parseInt(String(room).replace(/[^0-9]/g, ''))
        
        if (!isNaN(roomNumber)) {
          if (!blockedSlotsByRoom[roomNumber]) {
            blockedSlotsByRoom[roomNumber] = new Set()
          }
          const blockedSlots = getBlockedTimeSlots(time, durationMinutes)
          blockedSlots.forEach(slot => blockedSlotsByRoom[roomNumber].add(slot))
        }
      })
      
      // 각 룸과 시간대의 예약 가능 여부 설정
      const availability: Record<string, boolean> = {}
      rooms.forEach((room) => {
        // 방 번호 추출 (예: "1번 방" -> 1)
        const roomNumber = parseInt(room.replace(/[^0-9]/g, ''))
        
        filteredTimeSlots.forEach((time) => {
          const key = `${room}-${time}`
          
          // 해당 시간대의 OFF인 방 목록 가져오기
          const offlineRooms = dateOfflineHours[time] || []
          
          // 해당 방이 예약으로 인해 비활성화된 시간대인지 확인
          const blockedSlots = blockedSlotsByRoom[roomNumber] || new Set()
          const isBlocked = blockedSlots.has(time)
          
          // 해당 방이 OFF 목록에 포함되어 있거나 예약으로 인해 비활성화되면 예약 불가능
          if (offlineRooms.includes(roomNumber) || isBlocked) {
            availability[key] = false
          } else {
            // 예약 가능
            availability[key] = true
          }
        })
      })
      
      // 모든 시간대를 표시 (예약 가능 여부와 관계없이)
      const timeSlots = filteredTimeSlots

      // 이미지 URL 처리 (여러 개일 수 있음)
      const imageUrl = store.imageUrl || store.image_url || ''
      const images = imageUrl 
        ? (imageUrl.includes(',') ? imageUrl.split(',') : [imageUrl])
        : []

      return NextResponse.json({
        images,
        timeSlots,
        rooms,
        availability,
      })
    } finally {
      await client.close()
    }
  } catch (error: any) {
    console.error('예약 가능 시간 조회 에러:', error)
    return NextResponse.json(
      { 
        error: '예약 가능 시간을 불러오는데 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

