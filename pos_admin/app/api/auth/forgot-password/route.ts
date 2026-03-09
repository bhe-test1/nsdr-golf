import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// 비밀번호 찾기
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // 필수 필드 검증
    if (!email) {
      return NextResponse.json(
        { error: '이메일을 입력해주세요.' },
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

    // 점주 조회
    const owner = await prisma.owner.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!owner) {
      return NextResponse.json(
        { error: '등록된 이메일이 아닙니다. 점주 관리 페이지에 등록된 이메일만 사용 가능합니다.' },
        { status: 404 }
      )
    }

    // 활성 상태 확인
    if (owner.status !== 'active') {
      return NextResponse.json(
        { error: '비활성화된 계정입니다. 관리자에게 문의하세요.' },
        { status: 403 }
      )
    }

    // 임시 비밀번호 생성 (8자리 랜덤 문자열)
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // 비밀번호 업데이트
    await prisma.owner.update({
      where: { id: owner.id },
      data: { password: hashedPassword },
    })

    // TODO: 실제 이메일 발송 기능 구현
    // 현재는 콘솔에 임시 비밀번호 출력 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      console.log('=== 비밀번호 찾기 ===')
      console.log(`이메일: ${owner.email}`)
      console.log(`임시 비밀번호: ${tempPassword}`)
      console.log('==================')
    }

    // 실제 운영 환경에서는 이메일 발송 기능을 구현해야 합니다
    // 예: nodemailer, sendgrid, AWS SES 등을 사용

    return NextResponse.json(
      {
        message: `임시 비밀번호가 생성되었습니다. 시스템 관리자에게 문의하여 임시 비밀번호를 받으세요.\n\n개발 환경에서는 콘솔에 임시 비밀번호가 출력됩니다.`,
        // 개발 환경에서만 임시 비밀번호 반환 (보안상 운영 환경에서는 제거)
        ...(process.env.NODE_ENV === 'development' && { tempPassword }),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('비밀번호 찾기 에러:', error)
    const errorMessage = error?.message || '비밀번호 찾기 중 오류가 발생했습니다.'
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 }
    )
  }
}
