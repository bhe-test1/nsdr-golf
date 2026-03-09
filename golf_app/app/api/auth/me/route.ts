import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
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

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: '인증이 필요합니다.' }, { status: 401 })
    }

    // ObjectID 형식 검증
    const validation = validateObjectId(userId, '사용자 ID')
    if (!validation.valid) {
      return NextResponse.json(
        { message: validation.error },
        { status: 400 }
      )
    }

    // MongoDB 네이티브 쿼리로 사용자 조회
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
      
      const userDoc = await usersCollection.findOne({ _id: new ObjectId(userId) })

      if (!userDoc) {
        return NextResponse.json({ message: '사용자를 찾을 수 없습니다.' }, { status: 404 })
      }

      return NextResponse.json({
        id: userDoc._id.toString(),
        email: userDoc.email,
        name: userDoc.name,
        phone: userDoc.phone,
        createdAt: userDoc.created_at || userDoc.createdAt,
      })
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error)
    return NextResponse.json(
      { message: '사용자 정보 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: '인증이 필요합니다.' }, { status: 401 })
    }

    const validation = validateObjectId(userId, '사용자 ID')
    if (!validation.valid) {
      return NextResponse.json(
        { message: validation.error },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { email, name, phone } = body

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

      const updateFields: Record<string, unknown> = {}
      if (typeof email === 'string' && email.trim()) updateFields.email = email.trim()
      if (typeof name === 'string') updateFields.name = name.trim()
      if (typeof phone === 'string') updateFields.phone = phone.trim() || null

      if (Object.keys(updateFields).length === 0) {
        return NextResponse.json({ message: '수정할 항목이 없습니다.' }, { status: 400 })
      }

      const result = await usersCollection.findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $set: updateFields },
        { returnDocument: 'after' }
      )

      if (!result) {
        return NextResponse.json({ message: '사용자를 찾을 수 없습니다.' }, { status: 404 })
      }

      const updated = result as { _id: ObjectId; email: string; name: string; phone?: string | null; created_at?: string; createdAt?: string }
      return NextResponse.json({
        id: updated._id.toString(),
        email: updated.email,
        name: updated.name,
        phone: updated.phone,
        createdAt: updated.created_at || updated.createdAt,
      })
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error('프로필 수정 실패:', error)
    return NextResponse.json(
      { message: '프로필 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

