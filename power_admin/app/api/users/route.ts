import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// golf_app의 users 컬렉션에서 사용자 목록 조회
export async function GET(request: NextRequest) {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      console.error('DATABASE_URL이 설정되지 않았습니다.')
      return NextResponse.json(
        { error: '데이터베이스 연결 설정이 없습니다.' },
        { status: 500 }
      )
    }

    // DATABASE_URL에서 데이터베이스 이름을 golf_app으로 변경
    let golfAppUrl = databaseUrl
    if (databaseUrl.includes('/power_admin')) {
      golfAppUrl = databaseUrl.replace('/power_admin', '/golf_app')
    } else if (databaseUrl.includes('/pos_admin')) {
      golfAppUrl = databaseUrl.replace('/pos_admin', '/golf_app')
    } else {
      // 데이터베이스 이름이 없는 경우 추가
      golfAppUrl = databaseUrl.replace(/(mongodb\+srv?:\/\/[^\/]+)(\/[^?]*)?(\?.*)?$/, `$1/golf_app$3`)
    }

    const client = new MongoClient(golfAppUrl)
    await client.connect()

    try {
      const db = client.db('golf_app')
      const collection = db.collection('users')

      // 사용자 목록 조회 (비밀번호 제외)
      const users = await collection
        .find({}, { projection: { password: 0 } })
        .sort({ created_at: -1 })
        .toArray()

      // 데이터 형식 변환
      const formattedUsers = users.map((user: any) => ({
        id: user._id?.toString() || '',
        email: user.email || '',
        name: user.name || '',
        phone: user.phone || '',
        createdAt: user.created_at ? new Date(user.created_at).toISOString() : '',
        updatedAt: user.updated_at ? new Date(user.updated_at).toISOString() : '',
      }))

      return NextResponse.json({ users: formattedUsers }, { status: 200 })
    } finally {
      await client.close()
    }
  } catch (error: any) {
    console.error('사용자 목록 조회 에러:', error)
    return NextResponse.json(
      {
        error: '사용자 목록을 불러오는데 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}

// golf_app의 users 컬렉션에 사용자 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phone } = body

    // 필수 필드 검증
    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        { error: '이름, 이메일, 비밀번호, 전화번호는 필수 입력 항목입니다.' },
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

    // 비밀번호 길이 검증
    if (password.length < 4) {
      return NextResponse.json(
        { error: '비밀번호는 최소 4자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      console.error('DATABASE_URL이 설정되지 않았습니다.')
      return NextResponse.json(
        { error: '데이터베이스 연결 설정이 없습니다.' },
        { status: 500 }
      )
    }

    // DATABASE_URL에서 데이터베이스 이름을 golf_app으로 변경
    let golfAppUrl = databaseUrl
    if (databaseUrl.includes('/power_admin')) {
      golfAppUrl = databaseUrl.replace('/power_admin', '/golf_app')
    } else if (databaseUrl.includes('/pos_admin')) {
      golfAppUrl = databaseUrl.replace('/pos_admin', '/golf_app')
    } else {
      // 데이터베이스 이름이 없는 경우 추가
      golfAppUrl = databaseUrl.replace(/(mongodb\+srv?:\/\/[^\/]+)(\/[^?]*)?(\?.*)?$/, `$1/golf_app$3`)
    }

    const client = new MongoClient(golfAppUrl)
    await client.connect()

    try {
      const db = client.db('golf_app')
      const collection = db.collection('users')

      // 이메일 중복 확인
      const existingUser = await collection.findOne({ email })
      if (existingUser) {
        return NextResponse.json(
          { error: '이미 등록된 이메일입니다.' },
          { status: 409 }
        )
      }

      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(password, 10)

      // 전화번호 정리 (하이픈 제거)
      const cleanPhone = phone.replace(/-/g, '').trim()

      // 현재 시간
      const now = new Date()

      // 사용자 생성
      const result = await collection.insertOne({
        email,
        password: hashedPassword,
        name,
        phone: cleanPhone,
        created_at: now,
        updated_at: now,
      })

      // 생성된 사용자 정보 반환 (비밀번호 제외)
      const newUser = await collection.findOne(
        { _id: result.insertedId },
        { projection: { password: 0 } }
      )

      return NextResponse.json(
        {
          user: {
            id: newUser?._id?.toString() || '',
            email: newUser?.email || '',
            name: newUser?.name || '',
            phone: newUser?.phone || '',
            createdAt: newUser?.created_at ? new Date(newUser.created_at).toISOString() : '',
            updatedAt: newUser?.updated_at ? new Date(newUser.updated_at).toISOString() : '',
          },
        },
        { status: 201 }
      )
    } finally {
      await client.close()
    }
  } catch (error: any) {
    console.error('사용자 등록 에러:', error)
    return NextResponse.json(
      {
        error: '사용자 등록에 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}

