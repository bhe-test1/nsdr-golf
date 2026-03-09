import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MongoClient, ObjectId } from 'mongodb'
import { createActivityLog, getAdminFromCookie } from '@/lib/activity-log'

export const dynamic = 'force-dynamic'

// 점주 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    return NextResponse.json(
      { error: '데이터베이스 연결 설정이 없습니다.' },
      { status: 500 }
    )
  }

  let posAdminClient: MongoClient | null = null

  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: '점주 ID가 필요합니다.' }, { status: 400 })
    }

    // ownerId를 ObjectId로 변환
    let ownerIdObjectId: ObjectId
    try {
      ownerIdObjectId = new ObjectId(id)
    } catch (e) {
      return NextResponse.json(
        { error: '유효하지 않은 점주 ID입니다.' },
        { status: 400 }
      )
    }

    // pos_admin 데이터베이스 URL 생성
    let posAdminUrl = databaseUrl
    if (databaseUrl.includes('/power_admin')) {
      posAdminUrl = databaseUrl.replace('/power_admin', '/pos_admin')
    } else if (databaseUrl.includes('/golf_app')) {
      posAdminUrl = databaseUrl.replace('/golf_app', '/pos_admin')
    } else {
      posAdminUrl = databaseUrl.replace(/(mongodb\+srv?:\/\/[^\/]+)(\/[^?]*)?(\?.*)?$/, `$1/pos_admin$3`)
    }

    // pos_admin 데이터베이스에서 점주 관련 정보 삭제
    posAdminClient = new MongoClient(posAdminUrl)
    await posAdminClient.connect()
    const posAdminDb = posAdminClient.db('pos_admin')

    // 1. store_info 컬렉션에서 삭제
    const storeInfoCollection = posAdminDb.collection('store_info')
    const storeInfoResult = await storeInfoCollection.deleteMany({ ownerId: ownerIdObjectId })
    console.log(`store_info 삭제: ${storeInfoResult.deletedCount}개`)

    // 2. price 컬렉션에서 삭제 (owner_id 또는 ownerId로 조회)
    const priceCollection = posAdminDb.collection('price')
    const priceResult = await priceCollection.deleteMany({
      $or: [
        { owner_id: ownerIdObjectId },
        { ownerId: ownerIdObjectId }
      ]
    })
    console.log(`price 삭제: ${priceResult.deletedCount}개`)

    // 3. day_hours 컬렉션에서 삭제
    const dayHoursCollection = posAdminDb.collection('day_hours')
    const dayHoursResult = await dayHoursCollection.deleteMany({ ownerId: ownerIdObjectId })
    console.log(`day_hours 삭제: ${dayHoursResult.deletedCount}개`)

    // 4. weekend_hours 컬렉션에서 삭제
    const weekendHoursCollection = posAdminDb.collection('weekend_hours')
    const weekendHoursResult = await weekendHoursCollection.deleteMany({ ownerId: ownerIdObjectId })
    console.log(`weekend_hours 삭제: ${weekendHoursResult.deletedCount}개`)

    // 5. golf_app 데이터베이스에서 점주 관련 매장 정보 삭제
    let golfAppUrl = databaseUrl
    if (databaseUrl.includes('/power_admin')) {
      golfAppUrl = databaseUrl.replace('/power_admin', '/golf_app')
    } else if (databaseUrl.includes('/pos_admin')) {
      golfAppUrl = databaseUrl.replace('/pos_admin', '/golf_app')
    } else {
      golfAppUrl = databaseUrl.replace(/(mongodb\+srv?:\/\/[^\/]+)(\/[^?]*)?(\?.*)?$/, `$1/golf_app$3`)
    }

    const golfAppClient = new MongoClient(golfAppUrl)
    let golfAppStoresResult = { deletedCount: 0 }
    try {
      await golfAppClient.connect()
      const golfAppDb = golfAppClient.db('golf_app')
      const storesCollection = golfAppDb.collection('stores')
      
      // ownerId 또는 owner_id로 매장 삭제
      golfAppStoresResult = await storesCollection.deleteMany({
        $or: [
          { ownerId: ownerIdObjectId },
          { owner_id: ownerIdObjectId }
        ]
      })
      console.log(`golf_app stores 삭제: ${golfAppStoresResult.deletedCount}개`)
    } catch (golfAppError) {
      console.error('golf_app stores 삭제 중 오류:', golfAppError)
    } finally {
      await golfAppClient.close()
    }

    // 삭제 전에 점주 정보 조회 (활동 로그용)
    const ownerToDelete = await prisma.owner.findUnique({
      where: { id },
      select: {
        id: true,
        representativeName: true,
        name: true,
        storeName: true,
      },
    })

    // 6. power_admin의 store_owner에서 점주 삭제 (마지막에 삭제)
    await prisma.owner.delete({
      where: { id },
    })

    // 활동 로그 생성
    const admin = await getAdminFromCookie()
    const ownerName = ownerToDelete?.representativeName || ownerToDelete?.name || ownerToDelete?.storeName || '점주'
    await createActivityLog({
      adminId: admin.id,
      adminName: admin.name,
      action: '점주 삭제',
      targetType: 'owner',
      targetId: id,
      targetName: ownerName,
      description: `${admin.name}님이 ${ownerName}에 대해 점주 삭제를(를) 수행했습니다.`,
    })

    return NextResponse.json(
      { 
        message: '점주가 성공적으로 삭제되었습니다.',
        deletedCounts: {
          store_info: storeInfoResult.deletedCount,
          price: priceResult.deletedCount,
          day_hours: dayHoursResult.deletedCount,
          weekend_hours: weekendHoursResult.deletedCount,
          golf_app_stores: golfAppStoresResult.deletedCount,
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('점주 삭제 에러:', error)
    const errorMessage = error?.message || '점주 삭제 중 오류가 발생했습니다.'
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 }
    )
  } finally {
    // pos_admin 클라이언트 연결 종료
    if (posAdminClient) {
      await posAdminClient.close()
    }
  }
}

