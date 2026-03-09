import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateObjectId } from '@/lib/mongodb-utils'

export const dynamic = 'force-dynamic'

// 공지사항 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // ObjectID 형식 검증
    const validation = validateObjectId(id, '공지사항 ID')
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const notice = await prisma.notice.findUnique({
      where: { id },
    })

    if (!notice) {
      return NextResponse.json(
        { error: '공지사항을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      type: notice.type || '공지',
      createdAt: notice.createdAt.toISOString(),
      updatedAt: notice.updatedAt.toISOString(),
      isImportant: notice.isImportant || false,
    }, { status: 200 })
  } catch (error: any) {
    console.error('공지사항 상세 조회 에러:', error)
    const errorMessage = error?.message || '공지사항을 불러오는데 실패했습니다.'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

