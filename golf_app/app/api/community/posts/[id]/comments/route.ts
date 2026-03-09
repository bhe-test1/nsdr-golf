import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateObjectId } from '@/lib/mongodb-utils'

export const dynamic = 'force-dynamic'

function getUserIdFromToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    return decoded.userId || null
  } catch {
    return null
  }
}

// 댓글 작성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 })
    }

    // userId ObjectID 검증
    const userIdValidation = validateObjectId(userId, '사용자 ID')
    if (!userIdValidation.valid) {
      return NextResponse.json(
        { message: userIdValidation.error },
        { status: 400 }
      )
    }

    const { id } = await params

    // postId ObjectID 검증
    const postIdValidation = validateObjectId(id, '게시글 ID')
    if (!postIdValidation.valid) {
      return NextResponse.json(
        { message: postIdValidation.error },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { message: '댓글 내용을 입력해주세요.' },
        { status: 400 }
      )
    }

    const post = await prisma.post.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json(
        { message: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // MongoDB는 include를 지원하지 않으므로 수동으로 user 정보 조회
    const comment = await prisma.comment.create({
      data: {
        postId: id,
        userId,
        content,
      },
    })

    // 사용자 정보 수동 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
      },
    })

    return NextResponse.json({
      id: comment.id,
      content: comment.content,
      author: user
        ? {
            id: user.id,
            name: user.name,
          }
        : null,
      createdAt: comment.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('댓글 작성 실패:', error)
    return NextResponse.json(
      { message: '댓글 작성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

