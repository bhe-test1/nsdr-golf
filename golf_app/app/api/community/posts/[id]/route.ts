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

// 게시글 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // ObjectID 형식 검증
    const validation = validateObjectId(id, '게시글 ID')
    if (!validation.valid) {
      return NextResponse.json(
        { message: validation.error },
        { status: 400 }
      )
    }

    const post = await prisma.post.findFirst({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { message: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        likes: post.likes,
        isHot: post.isHot,
        author: {
          id: post.user.id,
          name: post.user.name,
          email: post.user.email,
        },
        comments: post.comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          author: {
            id: comment.user.id,
            name: comment.user.name,
          },
          createdAt: comment.createdAt.toISOString(),
        })),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('게시글 조회 실패:', error)
    return NextResponse.json(
      { message: '게시글을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

