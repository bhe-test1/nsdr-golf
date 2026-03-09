import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

// 게시글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    const userId = searchParams.get('userId')

    const where: any = {}
    if (category !== 'all') {
      where.category = category
    }
    if (userId) {
      where.userId = userId
    }

    const posts = await prisma.post.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      likes: post.likes,
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
    }))

    return NextResponse.json(formattedPosts)
  } catch (error) {
    console.error('게시글 목록 조회 실패:', error)
    return NextResponse.json(
      { message: '게시글 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 게시글 작성
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, category } = body

    if (!title || !content) {
      return NextResponse.json(
        { message: '제목과 내용을 입력해주세요.' },
        { status: 400 }
      )
    }

    const post = await prisma.post.create({
      data: {
        userId,
        title,
        content,
        category: category || 'general',
        likes: 0,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      likes: post.likes,
      author: {
        id: post.user.id,
        name: post.user.name,
        email: post.user.email,
      },
      comments: [],
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('게시글 작성 실패:', error)
    return NextResponse.json(
      { message: '게시글 작성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

