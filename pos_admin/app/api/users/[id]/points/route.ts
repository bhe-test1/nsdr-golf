import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// 포인트 지급
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { points, reason } = body

    if (!points || points <= 0) {
      return NextResponse.json(
        { error: '올바른 포인트를 입력해주세요.' },
        { status: 400 }
      )
    }

    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json(
        { error: '데이터베이스 연결 설정이 없습니다.' },
        { status: 500 }
      )
    }

    const client = new MongoClient(databaseUrl)
    try {
      await client.connect()
      const db = client.db('golf_app')
      const usersCollection = db.collection('users')
      
      // 사용자 조회
      const user = await usersCollection.findOne({ _id: new ObjectId(id) })
      
      if (!user) {
        return NextResponse.json(
          { error: '회원을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      // 현재 포인트 가져오기
      const currentPoints = user.points || 0
      const newPoints = currentPoints + points

      // 포인트 업데이트
      await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            points: newPoints,
            updatedAt: new Date(),
          },
        }
      )

      // 포인트 내역 저장 (선택사항)
      const pointsHistoryCollection = db.collection('points_history')
      await pointsHistoryCollection.insertOne({
        userId: new ObjectId(id),
        points: points,
        type: '지급',
        reason: reason || '관리자 지급',
        createdAt: new Date(),
      })

      return NextResponse.json({
        message: '포인트가 지급되었습니다.',
        points: newPoints,
      })
    } finally {
      await client.close()
    }
  } catch (error: any) {
    console.error('포인트 지급 오류:', error)
    return NextResponse.json(
      { error: '포인트 지급에 실패했습니다.', details: error.message },
      { status: 500 }
    )
  }
}


