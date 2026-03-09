import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// 공지사항 목록 조회
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

    const notices = await prisma.notice.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    const noticesWithFormattedDate = notices.map((notice) => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      type: notice.type || '공지',
      targetAudience: notice.targetAudience || null,
      imageUrl: notice.imageUrl || null,
      createdAt: notice.createdAt.toISOString(),
      updatedAt: notice.updatedAt.toISOString(),
      isImportant: notice.isImportant || false,
    }))

    return NextResponse.json({ notices: noticesWithFormattedDate }, { status: 200 })
  } catch (error: any) {
    console.error('공지사항 목록 조회 에러:', error)
    const errorMessage = error?.message || '공지사항 목록을 불러오는데 실패했습니다.'
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

// 공지사항 등록
export async function POST(request: NextRequest) {
  try {
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

    const notice = await prisma.notice.create({
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
        message: '공지사항이 성공적으로 등록되었습니다.',
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
      { status: 201 }
    )
  } catch (error: any) {
    console.error('공지사항 등록 에러:', error)
    const errorMessage = error?.message || '공지사항 등록 중 오류가 발생했습니다.'
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 }
    )
  }
}

