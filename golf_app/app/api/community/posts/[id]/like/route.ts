import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateObjectId } from '@/lib/mongodb-utils'

// 게시글 좋아요
export async function POST(
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

    const post = await prisma.post.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json(
        { message: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        likes: post.likes + 1,
      },
    })

    return NextResponse.json({ likes: updatedPost.likes })
  } catch (error) {
    console.error('좋아요 실패:', error)
    return NextResponse.json(
      { message: '좋아요 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}

