import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MongoClient, ObjectId } from 'mongodb'
import { createActivityLog, getAdminFromCookie } from '@/lib/activity-log'

export const dynamic = 'force-dynamic'

// 매장 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, location, type } = body

    if (!name || !location) {
      return NextResponse.json(
        { error: '매장명과 위치는 필수 항목입니다.' },
        { status: 400 }
      )
    }

    const updatedStore = await prisma.store.update({
      where: { id },
      data: {
        name,
        location,
        type: type || null,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    })

    // golf_app의 stores 컬렉션도 함께 업데이트
    const ownerId = updatedStore.owner?.id
    if (ownerId) {
      try {
        const databaseUrl = process.env.DATABASE_URL
        if (databaseUrl) {
          // golf_app 데이터베이스 URL 생성
          let golfAppUrl = databaseUrl
          if (databaseUrl.includes('/power_admin')) {
            golfAppUrl = databaseUrl.replace('/power_admin', '/golf_app')
          } else if (databaseUrl.includes('/pos_admin')) {
            golfAppUrl = databaseUrl.replace('/pos_admin', '/golf_app')
          } else {
            golfAppUrl = databaseUrl.replace(/(mongodb\+srv?:\/\/[^\/]+)(\/[^?]*)?(\?.*)?$/, `$1/golf_app$3`)
          }

          const golfAppClient = new MongoClient(golfAppUrl)
          try {
            await golfAppClient.connect()
            const golfAppDb = golfAppClient.db('golf_app')
            const storesCollection = golfAppDb.collection('stores')
            
            const ownerIdObjectId = new ObjectId(ownerId)
            
            // golf_app stores 컬렉션 업데이트
            const golfAppUpdateData: any = {
              name: name,
              location: location,
              type: type || null,
              updatedAt: new Date(),
            }
            
            await storesCollection.updateOne(
              {
                $or: [
                  { ownerId: ownerIdObjectId },
                  { owner_id: ownerIdObjectId }
                ]
              },
              {
                $set: golfAppUpdateData,
              }
            )
            
            console.log('golf_app stores 컬렉션 업데이트 완료 - type:', type)
          } catch (golfAppError: any) {
            console.error('golf_app stores 컬렉션 업데이트 에러:', golfAppError)
            // golf_app 업데이트 실패해도 계속 진행 (power_admin 업데이트는 성공했으므로)
          } finally {
            await golfAppClient.close()
          }
        }
      } catch (syncError: any) {
        console.error('golf_app 동기화 에러:', syncError)
        // 동기화 실패해도 계속 진행
      }
    }

    const storeWithOwnerInfo = {
      id: updatedStore.id,
      name: updatedStore.name,
      ownerName: updatedStore.owner?.name ?? '없음',
      ownerId: updatedStore.owner?.id ?? null,
      location: updatedStore.location,
      type: updatedStore.type || '골프스크린',
      status: updatedStore.owner?.status === 'active' ? 'active' : 'inactive',
    }

    // 활동 로그 생성
    const admin = await getAdminFromCookie()
    await createActivityLog({
      adminId: admin.id,
      adminName: admin.name,
      action: '매장 정보 수정',
      targetType: 'store',
      targetId: updatedStore.id,
      targetName: updatedStore.name,
      description: `${admin.name}님이 ${updatedStore.name}에 대해 매장 정보 수정을(를) 수행했습니다.`,
    })

    return NextResponse.json(
      { message: '매장 정보가 성공적으로 수정되었습니다.', store: storeWithOwnerInfo },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('매장 수정 에러:', error)
    const errorMessage = error?.message || '매장 수정 중 오류가 발생했습니다.'
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 }
    )
  }
}

// 매장 삭제 (점주 삭제 - store_owner에 통합되어 있음)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: '매장 ID가 필요합니다.' },
        { status: 400 }
      )
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

    // store_owner에서 점주 삭제 (매장 정보가 점주와 통합되어 있음)
    await prisma.owner.delete({
      where: { id },
    })

    // 활동 로그 생성
    const admin = await getAdminFromCookie()
    const storeName = ownerToDelete?.storeName || ownerToDelete?.representativeName || ownerToDelete?.name || '매장'
    await createActivityLog({
      adminId: admin.id,
      adminName: admin.name,
      action: '매장 삭제',
      targetType: 'store',
      targetId: id,
      targetName: storeName,
      description: `${admin.name}님이 ${storeName}에 대해 매장 삭제를(를) 수행했습니다.`,
    })

    return NextResponse.json(
      { message: '매장이 성공적으로 삭제되었습니다.' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('매장 삭제 에러:', error)
    const errorMessage = error?.message || '매장 삭제 중 오류가 발생했습니다.'
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 }
    )
  }
}

