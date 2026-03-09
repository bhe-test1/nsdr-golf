import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// 공지사항 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      console.error('DATABASE_URL이 설정되지 않았습니다.')
      return NextResponse.json(
        { error: '데이터베이스 연결 설정이 없습니다. DATABASE_URL 환경 변수를 확인하세요.' },
        { status: 500 }
      )
    }

    // power_admin 데이터베이스 URL로 변환
    let powerAdminUrl = databaseUrl
    if (databaseUrl.includes('/pos_admin')) {
      powerAdminUrl = databaseUrl.replace('/pos_admin', '/power_admin')
    } else if (databaseUrl.includes('/golf_app')) {
      powerAdminUrl = databaseUrl.replace('/golf_app', '/power_admin')
    } else {
      powerAdminUrl = databaseUrl.replace(/(mongodb\+srv?:\/\/[^\/]+)(\/[^?]*)?(\?.*)?$/, `$1/power_admin$3`)
    }

    const client = new MongoClient(powerAdminUrl)
    
    try {
      await client.connect()
      const db = client.db('power_admin')
      const noticesCollection = db.collection('notices')

      let noticeId
      try {
        noticeId = new ObjectId(id)
      } catch (e) {
        return NextResponse.json(
          { error: '유효하지 않은 공지사항 ID입니다.' },
          { status: 400 }
        )
      }

      const notice = await noticesCollection.findOne({ _id: noticeId })

      if (!notice) {
        return NextResponse.json(
          { error: '공지사항을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        notice: {
          id: notice._id.toString(),
          title: notice.title || '',
          content: notice.content || '',
          type: notice.type || '공지',
          imageUrl: notice.image_url || null,
          createdAt: notice.created_at ? new Date(notice.created_at).toISOString() : new Date().toISOString(),
          updatedAt: notice.updated_at ? new Date(notice.updated_at).toISOString() : new Date().toISOString(),
          isImportant: notice.is_important || false,
        },
      }, { status: 200 })
    } finally {
      await client.close()
    }
  } catch (error: any) {
    console.error('공지사항 상세 조회 에러:', error)
    const errorMessage = error?.message || '공지사항을 불러오는데 실패했습니다.'
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

