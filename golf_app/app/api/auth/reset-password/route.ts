import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json(
        { message: '재설정 링크와 새 비밀번호가 필요합니다.' },
        { status: 400 }
      )
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { message: '비밀번호는 최소 4자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: '유효하지 않거나 만료된 링크입니다. 비밀번호 찾기를 다시 시도해 주세요.' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    return NextResponse.json({
      message: '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.',
    })
  } catch (error) {
    console.error('비밀번호 재설정 실패:', error)
    return NextResponse.json(
      { message: '비밀번호 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
