import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { MongoClient } from 'mongodb'

export const dynamic = 'force-dynamic'

// 점주 로그인
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, password } = body

    // 필수 필드 검증
    if (!name || !password) {
      return NextResponse.json(
        { error: '이름과 비밀번호를 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()

    console.log('로그인 시도:', {
      name: trimmedName,
    })

    // power_admin의 store_owner 테이블에서 직접 조회
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

    let owner: any = null

    try {
      const client = new MongoClient(powerAdminUrl)
      await client.connect()
      
      try {
        const db = client.db('power_admin')
        const collection = db.collection('store_owner')
        
        const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        
        const allOwners = await collection.find({}).toArray()
        console.log('store_owner 컬렉션의 모든 점주:', allOwners.map((o: any) => ({
          _id: o._id?.toString(),
          name: o.name,
          representative_name: o.representative_name,
          phone: o.phone,
        })))
        
        // power_admin의 store_owner에서 직접 조회 (이름으로만 검색)
        // MongoDB에 저장된 실제 필드명 사용 (스네이크 케이스)
        const nameMatches = await collection.find({
          $or: [
            { representative_name: { $regex: new RegExp(`^${escapedName}$`, 'i') } },
            { representative_name: trimmedName },
            { name: { $regex: new RegExp(`^${escapedName}$`, 'i') } },
            { name: trimmedName }
          ]
        }).toArray()
        
        console.log('이름으로 찾은 점주:', nameMatches.length, '명')
        
        // 이름으로 찾은 점주 중 첫 번째 (이름이 동일한 점주가 여러 명이면 첫 번째 사용)
        owner = nameMatches[0] || null

        console.log('store_owner 조회 결과:', owner ? '찾음' : '없음')
        if (owner) {
          console.log('찾은 점주 정보:', {
            name: owner.name,
            representative_name: owner.representative_name,
            status: owner.status,
          })
        } else {
          console.log('조회 실패 - 입력값:', { name: trimmedName })
        }
      } finally {
        await client.close()
      }
    } catch (dbError) {
      console.error('데이터베이스 조회 에러:', dbError)
      return NextResponse.json(
        { error: '데이터베이스 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // store_owner에 없으면 로그인 실패
    if (!owner) {
      return NextResponse.json(
        { error: '등록된 점주만 로그인할 수 있습니다. 최고 관리자 페이지에서 먼저 점주를 등록해주세요.' },
        { status: 401 }
      )
    }

    // 활성 상태 확인
    if (owner.status !== 'active') {
      return NextResponse.json(
        { error: '비활성화된 계정입니다. 최고 관리자 페이지에서 활성 상태인 점주만 로그인할 수 있습니다. 관리자에게 문의하세요.' },
        { status: 403 }
      )
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, owner.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '이름 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // ownerId를 쿠키에 저장 (보안을 위해 HttpOnly 쿠키 사용)
    const ownerIdString = owner._id?.toString ? owner._id.toString() : String(owner._id)
    // MongoDB 필드명 (스네이크 케이스) 사용
    const ownerName = owner.representative_name || owner.name || ''
    
    console.log('로그인 성공 - 점주 정보:', {
      ownerId: ownerIdString,
      name: ownerName,
      representative_name: owner.representative_name,
      name_field: owner.name,
      phone: owner.phone,
      store_name: owner.store_name,
    })
    
    const response = NextResponse.json(
      {
        message: '로그인에 성공했습니다.',
        owner: {
          id: ownerIdString,
          name: ownerName,
          email: owner.email || '',
          phone: owner.phone || '',
          branchNumber: owner.branch_number || owner.branchNumber || '',
          status: owner.status || 'active',
        },
      },
      { status: 200 }
    )

    // 쿠키에 ownerId 저장 (30일 유효)
    console.log('쿠키에 ownerId 저장:', ownerIdString)
    response.cookies.set('ownerId', ownerIdString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30일
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('로그인 에러:', error)
    const errorMessage = error?.message || '로그인 중 오류가 발생했습니다.'
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 }
    )
  }
}
