import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// 관리자 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { name, email, phone, password, status } = body
    const { id } = await params

    // 필수 필드 검증
    if (!name || !email) {
      return NextResponse.json(
        { error: '이름과 이메일은 필수 항목입니다.' },
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

    // 이메일 중복 확인 (자신 제외)
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    })

    if (existingAdmin && existingAdmin.id !== id) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 409 }
      )
    }

    // 업데이트 데이터 준비
    const updateData: any = {
      name,
      email,
      phone: phone || null,
      status: status || 'active',
    }

    // 비밀번호가 제공된 경우에만 업데이트
    if (password) {
      if (password.length < 4) {
        return NextResponse.json(
          { error: '비밀번호는 최소 4자 이상이어야 합니다.' },
          { status: 400 }
        )
      }
      updateData.password = await bcrypt.hash(password, 10)
    }

    // 관리자 수정
    const admin = await prisma.admin.update({
      where: { id },
      data: updateData,
    })

    // 비밀번호 제외하고 응답
    const { password: _, ...adminWithoutPassword } = admin

    return NextResponse.json(
      {
        message: '관리자 정보가 성공적으로 수정되었습니다.',
        admin: adminWithoutPassword,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('관리자 수정 에러:', error)
    const errorMessage = error?.message || '관리자 수정 중 오류가 발생했습니다.'
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 }
    )
  }
}

// 관리자 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.admin.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: '관리자가 성공적으로 삭제되었습니다.' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('관리자 삭제 에러:', error)
    const errorMessage = error?.message || '관리자 삭제 중 오류가 발생했습니다.'
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 }
    )
  }
}

