import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

export const dynamic = 'force-dynamic'

// 공지사항 목록 조회
export async function GET(request: NextRequest) {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      console.error('DATABASE_URL이 설정되지 않았습니다.')
      return NextResponse.json(
        { error: '데이터베이스 연결 설정이 없습니다. DATABASE_URL 환경 변수를 확인하세요.' },
        { status: 500 }
      )
    }

    // power_admin 데이터베이스 URL로 변환
    // URL 형식: mongodb+srv://username:password@host/database?options
    let powerAdminUrl = databaseUrl
    
    // URL 파싱하여 데이터베이스 이름 교체
    try {
      const urlMatch = powerAdminUrl.match(/^(mongodb\+srv?:\/\/[^\/]+)\/([^?]+)(\?.*)?$/)
      if (urlMatch) {
        const [, baseUrl, dbName, queryParams] = urlMatch
        // 데이터베이스 이름을 power_admin으로 변경
        powerAdminUrl = `${baseUrl}/power_admin${queryParams || ''}`
      } else {
        // 데이터베이스 이름이 없는 경우 추가
        powerAdminUrl = powerAdminUrl.replace(/(mongodb\+srv?:\/\/[^\/]+)(\?|$)/, '$1/power_admin$2')
      }
    } catch (e) {
      // 파싱 실패 시 간단한 replace 사용
      powerAdminUrl = powerAdminUrl.replace(/\/(golf_app|pos_admin)/, '/power_admin')
    }

    // 디버깅 로그는 제거 (필요시 주석 해제)
    // if (process.env.NODE_ENV === 'development') {
    //   const maskedUrl = powerAdminUrl.replace(/(mongodb\+srv?:\/\/)([^:]+):([^@]+)@/, '$1***:***@')
    //   console.log('변환된 Power Admin DB URL:', maskedUrl)
    // }

    const client = new MongoClient(powerAdminUrl)
    
    try {
      await client.connect()
      const db = client.db('power_admin')
      const noticesCollection = db.collection('notices')

      // 사용자 대상 공지사항 조회
      // 모든 공지사항을 먼저 조회한 후 필터링하여 필드명 불일치 문제 해결
      const allNotices = await noticesCollection
        .find({})
        .sort({ created_at: -1 })
        .toArray()
      
      // JavaScript에서 필터링하여 필드명 불일치 문제 해결
      const notices = allNotices.filter((notice) => {
        const targetAudience = notice.target_audience || notice.targetAudience
        return targetAudience === '사용자'
      })

      // 디버깅 로그는 제거 (필요시 주석 해제)
      // if (process.env.NODE_ENV === 'development') {
      //   console.log(`전체 공지사항: ${allNotices.length}개`)
      //   console.log(`사용자 대상 공지사항: ${notices.length}개`)
      // }

      const noticesWithFormattedDate = notices.map((notice) => ({
        id: notice._id.toString(),
        title: notice.title || '',
        content: notice.content || '',
        type: notice.type || '공지',
        imageUrl: notice.image_url || null,
        createdAt: notice.created_at ? new Date(notice.created_at).toISOString() : new Date().toISOString(),
        updatedAt: notice.updated_at ? new Date(notice.updated_at).toISOString() : new Date().toISOString(),
        isImportant: notice.is_important || false,
      }))

      return NextResponse.json({ notices: noticesWithFormattedDate }, { status: 200 })
    } finally {
      await client.close()
    }
  } catch (error: any) {
    console.error('공지사항 목록 조회 에러:', error)
    
    // 인증 오류인 경우 더 자세한 정보 제공
    let errorMessage = error?.message || '공지사항 목록을 불러오는데 실패했습니다.'
    if (error?.message?.includes('Authentication failed') || error?.message?.includes('bad auth')) {
      errorMessage = '데이터베이스 인증에 실패했습니다. DATABASE_URL 환경 변수를 확인하세요.'
      console.error('인증 실패 - DATABASE_URL:', process.env.DATABASE_URL ? '설정됨' : '설정되지 않음')
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        notices: [],
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

