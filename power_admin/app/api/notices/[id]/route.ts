import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// 공지사항 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, content, type, targetAudience, imageUrl } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: '제목과 내용은 필수 항목입니다.' },
        { status: 400 }
      )
    }

    if (!targetAudience || (targetAudience !== '점주' && targetAudience !== '사용자')) {
      return NextResponse.json(
        { error: '발송대상을 선택해주세요. (점주 또는 사용자)' },
        { status: 400 }
      )
    }

    const notice = await prisma.notice.update({
      where: { id },
      data: {
        title,
        content,
        type: type || '공지',
        targetAudience: targetAudience,
        imageUrl: imageUrl || null,
      },
    })

    return NextResponse.json(
      {
        message: '공지사항이 성공적으로 수정되었습니다.',
        notice: {
          id: notice.id,
          title: notice.title,
          content: notice.content,
          type: notice.type || '공지',
          targetAudience: notice.targetAudience || null,
          imageUrl: notice.imageUrl || null,
          createdAt: notice.createdAt.toISOString(),
          updatedAt: notice.updatedAt.toISOString(),
          isImportant: notice.isImportant || false,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('공지사항 수정 에러:', error)
    const errorMessage = error?.message || '공지사항 수정 중 오류가 발생했습니다.'
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 }
    )
  }
}

// 공지사항 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.notice.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: '공지사항이 성공적으로 삭제되었습니다.' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('공지사항 삭제 에러:', error)
    const errorMessage = error?.message || '공지사항 삭제 중 오류가 발생했습니다.'
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 }
    )
  }
}

