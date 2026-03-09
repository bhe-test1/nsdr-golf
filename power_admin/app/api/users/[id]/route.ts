import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

function getGolfAppUrl(databaseUrl: string): string {
  if (databaseUrl.includes('/power_admin')) {
    return databaseUrl.replace('/power_admin', '/golf_app')
  }
  if (databaseUrl.includes('/pos_admin')) {
    return databaseUrl.replace('/pos_admin', '/golf_app')
  }
  return databaseUrl.replace(/(mongodb\+srv?:\/\/[^\/]+)(\/[^?]*)?(\?.*)?$/, `$1/golf_app$3`)
}

// golf_app의 users 컬렉션에서 사용자 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    let objectId: ObjectId
    try {
      objectId = new ObjectId(id)
    } catch {
      return NextResponse.json(
        { error: '유효하지 않은 사용자 ID입니다.' },
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

    const golfAppUrl = getGolfAppUrl(databaseUrl)
    const client = new MongoClient(golfAppUrl)
    await client.connect()

    try {
      const db = client.db('golf_app')
      const collection = db.collection('users')

      const result = await collection.deleteOne({ _id: objectId })
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { error: '사용자를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { message: '사용자가 삭제되었습니다.' },
        { status: 200 }
      )
    } finally {
      await client.close()
    }
  } catch (error: any) {
    console.error('사용자 삭제 에러:', error)
    return NextResponse.json(
      {
        error: '사용자 삭제에 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}
