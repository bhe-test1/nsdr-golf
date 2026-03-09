import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// 관리자 생성 (개발용)
export async function POST(request: NextRequest) {
  try {
    // 개발 환경에서만 허용
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: '프로덕션 환경에서는 사용할 수 없습니다.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '이메일, 비밀번호, 이름을 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    // 이미 존재하는 이메일인지 확인
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다.' },
        { status: 409 }
      )
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10)

    // 관리자 생성
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name,
        status: 'active',
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        message: '관리자 계정이 생성되었습니다.',
        admin,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('관리자 생성 에러:', error)
    return NextResponse.json(
      {
        error: '관리자 계정 생성에 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

