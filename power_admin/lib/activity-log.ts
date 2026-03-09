import { prisma } from './prisma'
import { cookies } from 'next/headers'

interface CreateActivityLogParams {
  adminId?: string
  adminName: string
  action: string
  targetType?: string
  targetId?: string
  targetName?: string
  description: string
}

/**
 * 활동 로그 생성 헬퍼 함수
 */
export async function createActivityLog(params: CreateActivityLogParams) {
  try {
    await prisma.activityLog.create({
      data: {
        adminId: params.adminId || null,
        adminName: params.adminName,
        action: params.action,
        targetType: params.targetType || null,
        targetId: params.targetId || null,
        targetName: params.targetName || null,
        description: params.description,
      },
    })
  } catch (error) {
    // 활동 로그 생성 실패해도 메인 작업은 계속 진행
    console.error('활동 로그 생성 실패:', error)
  }
}

/**
 * 쿠키에서 관리자 정보 가져오기
 */
export async function getAdminFromCookie(): Promise<{ id?: string; name: string }> {
  try {
    const cookieStore = await cookies()
    const adminCookie = cookieStore.get('admin')
    
    if (adminCookie) {
      try {
        const adminData = JSON.parse(adminCookie.value)
        return {
          id: adminData.id,
          name: adminData.name || '시스템 관리자',
        }
      } catch {
        return { name: '시스템 관리자' }
      }
    }
  } catch (error) {
    console.error('쿠키에서 관리자 정보 가져오기 실패:', error)
  }
  
  return { name: '시스템 관리자' }
}

