import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

const RESET_EXPIRY_HOURS = 1

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone } = body

    if (!email) {
      return NextResponse.json(
        { message: '이메일 주소를 입력해 주세요.' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { message: '해당 이메일로 등록된 계정이 없습니다.' },
        { status: 404 }
      )
    }

    if (phone) {
      const normalizedPhone = phone.replace(/\D/g, '')
      const userPhone = user.phone.replace(/\D/g, '')
      if (normalizedPhone !== userPhone) {
        return NextResponse.json(
          { message: '이메일과 전화번호가 일치하는 계정이 없습니다.' },
          { status: 400 }
        )
      }
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiresAt,
      },
    })

    // 서버 전용 환경 변수 우선 사용 (배포 시 런타임 값 보장, NEXT_PUBLIC_은 빌드 시점이라 Render에서 누락될 수 있음)
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      'http://localhost:3001'
    const resetLink = `${baseUrl}/reset-password?token=${token}`

    const hasEmailConfig =
      (process.env.SMTP_USER && process.env.SMTP_PASS) ||
      (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD)
    if (!hasEmailConfig) {
      console.error('SMTP_* 또는 EMAIL_* 이메일 환경 변수가 설정되지 않았습니다.')
      return NextResponse.json(
        { message: '이메일 발송 설정이 되어 있지 않습니다. 관리자에게 문의해 주세요.' },
        { status: 503 }
      )
    }

    await sendPasswordResetEmail(user.email, resetLink)

    return NextResponse.json({
      message: '비밀번호 재설정 링크를 이메일로 보냈습니다. 받은편지함과 스팸함을 확인해 주세요.',
    })
  } catch (error: unknown) {
    const err = error as { code?: string }
    console.error('비밀번호 재설정 요청 실패:', error)
    // SMTP 인증 실패 시 사용자에게 안내 (이메일 설정 문제)
    if (err?.code === 'EAUTH') {
      return NextResponse.json(
        { message: '이메일 발송 설정(계정 인증)에 문제가 있습니다. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.' },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { message: '요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
