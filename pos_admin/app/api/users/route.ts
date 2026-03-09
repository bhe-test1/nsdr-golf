import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// ownerId 가져오기
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

// 회원 목록 조회
export async function GET(request: NextRequest) {
  try {
    // ownerId 가져오기
    const ownerId = getOwnerId(request)
    if (!ownerId) {
      return NextResponse.json(
        { error: '인증이 필요합니다. 로그인해주세요.' },
        { status: 401 }
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
      const golfAppDb = client.db('golf_app')
      const storesCollection = golfAppDb.collection('stores')
      const reservationsCollection = golfAppDb.collection('reservations')
      const usersCollection = golfAppDb.collection('users')
      
      const ownerIdObjectId = new ObjectId(ownerId)
      
      // 1. 해당 ownerId의 매장들 찾기
      const stores = await storesCollection.find({
        $or: [
          { ownerId: ownerIdObjectId },
          { owner_id: ownerIdObjectId }
        ]
      }).toArray()
      
      if (stores.length === 0) {
        return NextResponse.json({ users: [] })
      }
      
      const storeIds = stores.map(store => store._id)
      
      // 2. 해당 매장들에 예약한 사용자들의 user_id 찾기
      const reservations = await reservationsCollection.find({
        store_id: { $in: storeIds },
        status: { $ne: 'CANCELLED' }
      }).toArray()
      
      // 3. user_id 목록 추출 (중복 제거)
      const userIds = new Set<string>()
      reservations.forEach(reservation => {
        if (reservation.user_id) {
          userIds.add(reservation.user_id.toString())
        }
      })
      
      // 4. golf_app의 users 컬렉션에서 사용자 정보 가져오기
      const userIdsArray = Array.from(userIds).map(id => new ObjectId(id))
      const users = await usersCollection.find({
        _id: { $in: userIdsArray }
      }).toArray()
      
      // 5. 각 사용자별 예약 통계 계산
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const userId = user._id
          
          // 해당 사용자의 예약 목록 (해당 점주의 매장에 대한 예약만)
          const userReservations = reservations.filter(
            res => res.user_id && res.user_id.toString() === userId.toString()
          )
          
          const totalReservations = userReservations.length
          
          // 총 결제금액 계산
          const totalSpent = userReservations.reduce((sum, res) => {
            return sum + (res.amount || 0)
          }, 0)
          
          // 첫 예약 날짜 찾기 (가장 오래된 예약 날짜)
          let firstReservationDate: Date | null = null
          if (userReservations.length > 0) {
            const dates = userReservations
              .map(res => res.date ? new Date(res.date) : null)
              .filter((date): date is Date => date !== null)
            
            if (dates.length > 0) {
              firstReservationDate = new Date(Math.min(...dates.map(d => d.getTime())))
            }
          }
          
          return {
            id: userId.toString(),
            name: user.name || '',
            phone: user.phone || '',
            email: user.email || '',
            joinDate: firstReservationDate || user.created_at || user.createdAt || new Date(), // 첫 예약 날짜 또는 가입일
            totalReservations,
            totalSpent,
            status: '활성' as const,
          }
        })
      )
      
      // 첫 예약 날짜 기준 내림차순 정렬
      usersWithStats.sort((a, b) => {
        const dateA = new Date(a.joinDate).getTime()
        const dateB = new Date(b.joinDate).getTime()
        return dateB - dateA
      })
      
      return NextResponse.json({ users: usersWithStats })
    } finally {
      await client.close()
    }
  } catch (error: any) {
    console.error('회원 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '회원 목록을 불러오는데 실패했습니다.', details: error.message },
      { status: 500 }
    )
  }
}

// 회원 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, password } = body

    // 필수 필드 검증
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: '이름, 이메일, 비밀번호는 필수 입력 항목입니다.' },
        { status: 400 }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 전화번호 형식 검증 (선택적)
    if (phone) {
      const cleanPhone = phone.replace(/-/g, '')
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        return NextResponse.json(
          { error: '올바른 전화번호 형식을 입력해주세요.' },
          { status: 400 }
        )
      }
    }

    // 비밀번호 길이 검증
    if (password.length < 4) {
      return NextResponse.json(
        { error: '비밀번호는 최소 4자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 409 }
      )
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10)

    // 전화번호 정리 (하이픈 제거)
    const cleanPhone = phone ? phone.replace(/-/g, '') : null

    // 회원 생성
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone: cleanPhone,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        message: '회원이 성공적으로 추가되었습니다.',
        user: {
          id: newUser.id,
          name: newUser.name,
          phone: newUser.phone || '',
          email: newUser.email,
          joinDate: newUser.createdAt.toISOString(),
          totalReservations: 0,
          totalSpent: 0,
          status: '활성',
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('회원 추가 오류:', error)
    
    // Prisma 에러 처리
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: '회원 추가에 실패했습니다.', details: error.message },
      { status: 500 }
    )
  }
}

