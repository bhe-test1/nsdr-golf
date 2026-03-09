import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// 세션 확인 및 비밀번호 변경 감지
export async function GET(request: NextRequest) {
  try {
    // 쿠키에서 ownerId 가져오기
    const cookieHeader = request.headers.get('cookie')
    let ownerId: string | null = null
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)
      ownerId = cookies['ownerId'] || null
    }

    if (!ownerId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.', authenticated: false },
        { status: 401 }
      )
    }

    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json(
        { error: '데이터베이스 연결 설정이 없습니다.' },
        { status: 500 }
      )
    }

    // power_admin 데이터베이스 URL 생성
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
      const collection = db.collection('store_owner')
      
      const { ObjectId } = require('mongodb')
      let ownerIdObjectId
      try {
        ownerIdObjectId = new ObjectId(ownerId)
      } catch (e) {
        return NextResponse.json(
          { error: '유효하지 않은 점주 ID입니다.', authenticated: false },
          { status: 400 }
        )
      }

      // 점주 정보 조회
      const owner = await collection.findOne({ _id: ownerIdObjectId })

      if (!owner) {
        return NextResponse.json(
          { error: '점주 정보를 찾을 수 없습니다.', authenticated: false },
          { status: 404 }
        )
      }

      // 활성 상태 확인
      if (owner.status !== 'active') {
        return NextResponse.json(
          { 
            error: '비활성화된 계정입니다.', 
            authenticated: false,
            passwordChanged: false 
          },
          { status: 403 }
        )
      }

      // 비밀번호 변경 감지 기능 제거됨
      const response = NextResponse.json(
        {
          authenticated: true,
          passwordChanged: false, // 항상 false 반환
          owner: {
            id: owner._id?.toString() || ownerId,
            name: owner.representative_name || owner.name || '',
            phone: owner.phone || '',
            status: owner.status || 'active',
          },
        },
        { status: 200 }
      )
      
      return response
    } finally {
      await client.close()
    }
  } catch (error: any) {
    console.error('세션 확인 에러:', error)
    return NextResponse.json(
      { error: '세션 확인 중 오류가 발생했습니다.', authenticated: false },
      { status: 500 }
    )
  }
}

