import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { MongoClient, ObjectId } from 'mongodb'
import { createActivityLog, getAdminFromCookie } from '@/lib/activity-log'

export const dynamic = 'force-dynamic'

// Store 모델 제거됨 - store_owner에 통합됨
// syncStoreInfo 함수 제거
// pos_admin의 login 컬렉션 동기화 기능 제거됨 - store_owner만 사용

// 점주 목록 조회
export async function GET(request: NextRequest) {
  try {
    // DATABASE_URL 확인
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL이 설정되지 않았습니다.')
      return NextResponse.json(
        { error: '데이터베이스 연결 설정이 없습니다. DATABASE_URL 환경 변수를 확인하세요.' },
        { status: 500 }
      )
    }

    // Prisma 연결 테스트
    await prisma.$connect().catch((err) => {
      console.error('Prisma 연결 실패:', err)
      throw new Error(`데이터베이스 연결 실패: ${err.message}`)
    })

    const owners = await prisma.owner.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    // store_owner에 통합되었으므로 별도 조회 불필요
    const ownersWithStoreCount = owners.map((owner) => {
      return {
        id: owner.id,
        name: '', // name 필드는 더 이상 사용하지 않음
        email: '', // email 필드는 더 이상 사용하지 않음
        phone: owner.phone || '',
        branchNumber: owner.branchNumber || '',
        storeName: (owner as any).storeName || '-', // store_owner에서 직접 가져옴
        representativeName: owner.representativeName || '',
        businessRegistrationNumber: owner.businessRegistrationNumber || '',
        storeOpenDate: owner.storeOpenDate ? owner.storeOpenDate.toISOString().split('T')[0] : '',
        address: owner.address || '',
        detailAddress: owner.detailAddress || '',
        storeType: owner.storeType || '',
        platform: owner.platform || '',
        status: (owner as any).status || 'active',
        joinDate: owner.createdAt.toISOString(),
      }
    })

    return NextResponse.json({ owners: ownersWithStoreCount }, { status: 200 })
  } catch (error: any) {
    console.error('점주 목록 조회 에러:', error)
    console.error('에러 스택:', error?.stack)
    const errorMessage = error?.message || '점주 목록을 불러오는데 실패했습니다.'
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

// 점주 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // 지정된 필드만 추출 (이 외의 필드는 무시)
    const id = body.id
    const name = body.name // 대표자명
    const businessRegistrationNumber = body.businessRegistrationNumber // 사업자등록번호
    const storeName = body.storeName // 매장명
    const phone = body.phone // 전화번호
    const storeOpenDate = body.storeOpenDate // 설치일
    const status = body.status // 상태
    const storeType = body.storeType // 업장구분
    const platform = body.platform // 플랫폼
    const address = body.address // 주소
    const detailAddress = body.detailAddress // 상세주소
    const branchNumber = body.branchNumber // 지점번호
    const password = body.password // 비밀번호
    
    const isUpdate = Boolean(id)
    
    // 대표자명은 name 필드로 받음
    const representativeName = name

    // 필수 필드 검증 (등록/수정 분기)
    if (!name || !name.trim()) {
      return NextResponse.json({ error: '대표자명은 필수 항목입니다.' }, { status: 400 })
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: '전화번호는 필수 항목입니다.' }, { status: 400 })
    }

    if (!isUpdate) {
      // 신규 등록 시 필수값
      if (!password) {
        return NextResponse.json({ error: '비밀번호는 필수 항목입니다.' }, { status: 400 })
      }
      if (password.length < 4) {
        return NextResponse.json({ error: '비밀번호는 최소 4자 이상이어야 합니다.' }, { status: 400 })
      }
      if (!branchNumber || !branchNumber.trim()) {
        return NextResponse.json({ error: '지점번호는 필수 항목입니다.' }, { status: 400 })
      }
    } else {
      // 수정 시 비밀번호는 선택. 있으면 길이 체크.
      if (password && password.length < 4) {
        return NextResponse.json({ error: '비밀번호는 최소 4자 이상이어야 합니다.' }, { status: 400 })
      }
    }

    // 수정인지 확인
    if (id) {
      // 점주 수정
      const updateData: any = {
        name: representativeName || '', // name 필드는 대표자명으로 설정 (Prisma 스키마에서 required)
        phone: phone || null,
        branchNumber: branchNumber || null,
        businessRegistrationNumber: businessRegistrationNumber || null,
        representativeName: representativeName || null,
        storeOpenDate: storeOpenDate ? new Date(storeOpenDate) : null,
        address: address || null,
        detailAddress: detailAddress || null,
        storeType: storeType || null,
        platform: platform || null,
        status: status || 'active',
      }
      // email과 name 필드는 저장하지 않음

      // 비밀번호가 제공된 경우에만 업데이트
      if (password && password.length >= 4) {
        updateData.password = await bcrypt.hash(password, 10)
      }

      // storeName도 함께 업데이트
      updateData.storeName = storeName || null

      const owner = await prisma.owner.update({
        where: { id },
        data: updateData,
      })

      // storeType 또는 platform이 변경되었으면 golf_app stores 컬렉션도 업데이트
      if ((storeType !== undefined && storeType !== null) || (platform !== undefined && platform !== null)) {
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
              
              const ownerIdObjectId = id instanceof ObjectId ? id : new ObjectId(id)
              
              // 기존 매장 정보 조회
              const existingStore = await storesCollection.findOne({
                $or: [
                  { ownerId: ownerIdObjectId },
                  { owner_id: ownerIdObjectId }
                ]
              })
              
              const updateData: any = {
                updatedAt: new Date(),
              }
              
              // storeType이 변경되었으면 type 필드 업데이트
              if (storeType !== undefined && storeType !== null) {
                // 업장구분에 따라 type 필드 설정
                const getStoreType = (storeType: string | null | undefined): string => {
                  if (!storeType) return '스크린골프'
                  
                  // 업장구분 매핑: 스크린골프 → 스크린골프, 파크골프 → 파크골프, 연습장 → 골프연습장
                  if (storeType === '스크린골프') return '스크린골프'
                  if (storeType === '파크골프') return '파크골프'
                  if (storeType === '연습장') return '골프연습장'
                  
                  // 기존 값 그대로 사용 (이미 올바른 형식일 수 있음)
                  return storeType
                }
                
                const mappedType = getStoreType(storeType)
                updateData.type = mappedType
              }
              
              // platform이 변경되었으면 news 필드의 platform 업데이트
              if (platform !== undefined && platform !== null) {
                let newsData: any = {}
                
                // 기존 news 필드 파싱
                if (existingStore?.news) {
                  try {
                    newsData = typeof existingStore.news === 'string' 
                      ? JSON.parse(existingStore.news) 
                      : existingStore.news
                  } catch (e) {
                    console.warn('news 필드 파싱 실패, 새로 생성:', e)
                    newsData = {}
                  }
                }
                
                // platform 업데이트
                newsData.platform = platform || ''
                
                // 기존 news 필드의 다른 정보 유지
                if (existingStore?.news) {
                  try {
                    const existingNews = typeof existingStore.news === 'string' 
                      ? JSON.parse(existingStore.news) 
                      : existingStore.news
                    if (typeof existingNews === 'object' && existingNews !== null) {
                      // 기존 정보 유지 (platform만 업데이트)
                      newsData = {
                        ...existingNews,
                        platform: platform || '',
                      }
                    }
                  } catch (e) {
                    // 파싱 실패 시 platform만 포함
                    newsData = { platform: platform || '' }
                  }
                }
                
                updateData.news = JSON.stringify(newsData)
              }
              
              // golf_app stores 컬렉션 업데이트
              await storesCollection.updateOne(
                {
                  $or: [
                    { ownerId: ownerIdObjectId },
                    { owner_id: ownerIdObjectId }
                  ]
                },
                {
                  $set: updateData,
                }
              )
              
              console.log('golf_app stores 컬렉션 업데이트 완료 - storeType:', storeType, 'platform:', platform)
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

      const { password: _, ...ownerWithoutPassword } = owner

      // 활동 로그 생성
      const admin = await getAdminFromCookie()
      await createActivityLog({
        adminId: admin.id,
        adminName: admin.name,
        action: '점주 정보 수정',
        targetType: 'owner',
        targetId: owner.id,
        targetName: owner.representativeName || owner.name || storeName || '점주',
        description: `${admin.name}님이 ${owner.representativeName || owner.name || storeName || '점주'}에 대해 점주 정보 수정을(를) 수행했습니다.`,
      })

      return NextResponse.json(
        {
          message: '점주 정보가 성공적으로 수정되었습니다.',
          owner: ownerWithoutPassword,
        },
        { status: 200 }
      )
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10)

    // 점주 등록 데이터 준비 (지정된 필드만 저장, store_owner에 통합)
    const ownerData: any = {
      name: representativeName || '', // 대표자명 (Prisma 스키마에서 required)
      phone: phone || null, // 전화번호
      branchNumber: branchNumber || null, // 지점번호
      businessRegistrationNumber: businessRegistrationNumber || null, // 사업자등록번호
      representativeName: representativeName || null, // 대표자명
      storeName: storeName || null, // 매장명 (store_owner에 통합)
      storeOpenDate: storeOpenDate ? new Date(storeOpenDate) : null, // 설치일
      address: address || null, // 주소
      detailAddress: detailAddress || null, // 상세주소
      storeType: storeType || null, // 업장구분
      platform: platform || null, // 플랫폼
      password: hashedPassword, // 비밀번호
      status: (status || 'active') as string, // 상태
    }
    // email 필드는 저장하지 않음 (지정된 필드에 없음)

    // 점주 등록 (매장 정보도 함께 저장)
    const owner = await prisma.owner.create({
      data: ownerData,
    })

    // 비밀번호 제외하고 응답
    const { password: _, ...ownerWithoutPassword } = owner

    // 활동 로그 생성
    const admin = await getAdminFromCookie()
    await createActivityLog({
      adminId: admin.id,
      adminName: admin.name,
      action: '새 점주 등록',
      targetType: 'owner',
      targetId: owner.id,
      targetName: owner.representativeName || owner.name || storeName || '점주',
      description: `${admin.name}님이 ${owner.representativeName || owner.name || storeName || '점주'}에 대해 새 점주 등록을(를) 수행했습니다.`,
    })

    return NextResponse.json(
      {
        message: '점주가 성공적으로 등록되었습니다.',
        owner: ownerWithoutPassword,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('점주 등록 에러:', error)
    const errorMessage = error?.message || '점주 등록 중 오류가 발생했습니다.'
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 }
    )
  }
}

