import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, password } = body

    if (!name || !phone || !password) {
      return NextResponse.json(
        { message: '이름, 핸드폰번호, 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 전화번호에서 하이픈 제거
    const cleanPhone = phone.replace(/-/g, '')

    // 사용자 찾기 (이름과 전화번호로)
    const user = await prisma.user.findFirst({
      where: {
        name: name,
        phone: cleanPhone,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: '이름, 핸드폰번호 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { message: '이름, 핸드폰번호 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 토큰 생성
    const token = Buffer.from(
      JSON.stringify({ userId: user.id, email: user.email })
    ).toString('base64')

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
    })
  } catch (error) {
    console.error('로그인 실패:', error)
    return NextResponse.json(
      { message: '로그인에 실패했습니다.' },
      { status: 500 }
    )
  }
}

