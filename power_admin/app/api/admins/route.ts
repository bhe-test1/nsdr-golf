import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// 관리자 목록 조회
export async function GET(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL이 설정되지 않았습니다.')
      return NextResponse.json(
        { error: '데이터베이스 연결 설정이 없습니다. DATABASE_URL 환경 변수를 확인하세요.' },
        { status: 500 }
      )
    }

    await prisma.$connect().catch((err) => {
      console.error('Prisma 연결 실패:', err)
      throw new Error(`데이터베이스 연결 실패: ${err.message}`)
    })

    const admins = await prisma.admin.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    const adminsWithFormattedDate = admins.map((admin) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone || '',
      status: admin.status || 'active',
      joinDate: admin.createdAt.toISOString(),
      lastLoginAt: admin.lastLoginAt ? admin.lastLoginAt.toISOString() : null,
    }))

    return NextResponse.json({ admins: adminsWithFormattedDate }, { status: 200 })
  } catch (error: any) {
    console.error('관리자 목록 조회 에러:', error)
    console.error('에러 스택:', error?.stack)
    const errorMessage = error?.message || '관리자 목록을 불러오는데 실패했습니다.'
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

// 관리자 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, password } = body

    // 필수 필드 검증
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: '이름, 이메일, 비밀번호는 필수 항목입니다.' },
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

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      )
    }

    // 이메일 중복 확인
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 409 }
      )
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10)

    // 관리자 등록
    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
      },
    })

    // 비밀번호 제외하고 응답
    const { password: _, ...adminWithoutPassword } = admin

    return NextResponse.json(
      {
        message: '관리자가 성공적으로 등록되었습니다.',
        admin: adminWithoutPassword,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('관리자 등록 에러:', error)
    const errorMessage = error?.message || '관리자 등록 중 오류가 발생했습니다.'
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 }
    )
  }
}

