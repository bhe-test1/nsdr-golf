import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { MongoClient, ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// 매장 정보 조회
export async function GET(request: NextRequest) {
  try {
    // 쿠키나 헤더에서 ownerId 가져오기
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    
    // 쿠키에서 ownerId 추출 시도
    let ownerId: string | null = null
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)
      ownerId = cookies['ownerId'] || null
    }
    
    // 헤더에서 가져오기 시도
    if (!ownerId) {
      ownerId = request.headers.get('x-owner-id')
    }
    
    // ownerId가 없으면 인증 오류 반환 (보안 강화)
    if (!ownerId) {
      return NextResponse.json(
        { 
          error: '인증이 필요합니다. 로그인해주세요.',
        },
        { status: 401 }
      )
    }

    // power_admin의 store_owner에서 직접 점주 정보 조회
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
    let owner: any = null
    let store: any = null
    let storeInfoDoc: any = null
    let ownerDoc: any = null // ownerDoc을 try 블록 밖에서 선언

    try {
      await client.connect()
      const powerAdminDb = client.db('power_admin')
      const storeOwnerCollection = powerAdminDb.collection('store_owner')
      
      let ownerIdObjectId
      try {
        ownerIdObjectId = new ObjectId(ownerId)
      } catch (e) {
        console.error('ownerId를 ObjectId로 변환 실패:', ownerId, e)
        return NextResponse.json(
          { error: '유효하지 않은 점주 ID입니다.' },
          { status: 400 }
        )
      }

      // 디버깅: ownerId 확인
      console.log('매장 정보 조회 - ownerId:', ownerId)
      console.log('매장 정보 조회 - ownerIdObjectId:', ownerIdObjectId)
      
      // power_admin의 store_owner에서 직접 조회
      ownerDoc = await storeOwnerCollection.findOne({ _id: ownerIdObjectId })
      
      if (!ownerDoc) {
        console.error('점주 정보를 찾을 수 없음 - ownerId:', ownerId)
        // 모든 점주 목록 출력 (디버깅용)
        const allOwners = await storeOwnerCollection.find({}).toArray()
        console.log('store_owner 컬렉션의 모든 점주:', allOwners.map((o: any) => ({
          _id: o._id?.toString(),
          name: o.name,
          representative_name: o.representative_name,
          phone: o.phone,
        })))
        return NextResponse.json(
          { error: '점주 정보를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      // 디버깅: 조회된 점주 정보 확인
      console.log('조회된 점주 정보:', {
        _id: ownerDoc._id?.toString(),
        name: ownerDoc.name,
        representative_name: ownerDoc.representative_name,
        phone: ownerDoc.phone,
        store_name: ownerDoc.store_name,
      })

      owner = {
        id: ownerDoc._id?.toString() || ownerId,
        name: ownerDoc.representative_name || ownerDoc.name || '',
        phone: ownerDoc.phone || '',
      }

      // store_owner에서 매장 정보 추출
      const imageUrlValue = ownerDoc.image_url || ownerDoc.imageUrl || null
      console.log('매장 정보 조회 - image_url:', imageUrlValue)
      console.log('매장 정보 조회 - store_name:', ownerDoc.store_name)
      
      store = {
        name: ownerDoc.store_name || '', // power_admin에서 관리자가 등록한 매장명 우선 사용
        type: ownerDoc.store_type || '스크린골프',
        location: ownerDoc.address 
          ? (ownerDoc.detail_address ? `${ownerDoc.address}|${ownerDoc.detail_address}` : ownerDoc.address)
          : '',
        description: '',
        notice: '',
        parking: '',
        imageUrl: imageUrlValue,
        news: JSON.stringify({
          businessNumber: ownerDoc.business_registration_number || '',
          platform: ownerDoc.platform || '',
          openDate: ownerDoc.store_open_date 
            ? (ownerDoc.store_open_date instanceof Date 
                ? ownerDoc.store_open_date.toISOString().split('T')[0]
                : new Date(ownerDoc.store_open_date).toISOString().split('T')[0])
            : '',
        }),
      }

      // pos_admin의 store_info 컬렉션에서 운영정보 조회
      try {
        const posAdminClient = new MongoClient(databaseUrl)
        await posAdminClient.connect()
        try {
          const posAdminDb = posAdminClient.db('pos_admin')
          const storeInfoCollection = posAdminDb.collection('store_info')
          storeInfoDoc = await storeInfoCollection.findOne({ ownerId: ownerIdObjectId })
          console.log('운영정보 조회 - store_info:', storeInfoDoc)
        } finally {
          await posAdminClient.close()
        }
      } catch (storeInfoError) {
        console.error('store_info 컬렉션 조회 에러:', storeInfoError)
        // 에러가 나도 계속 진행
      }
    } catch (dbError: any) {
      console.error('데이터베이스 조회 에러:', dbError)
      return NextResponse.json(
        { error: '매장 정보를 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    } finally {
      await client.close()
    }

    // store_info에서 운영정보 추출
    let totalRooms = 0
    let parkingAvailable = false
    let parkingSpaces = 0
    let facilities: string[] = []
    let oneLineIntro = ''
    let notice = ''

    if (storeInfoDoc) {
      totalRooms = typeof storeInfoDoc.totalRooms === 'number' ? storeInfoDoc.totalRooms : 0
      parkingAvailable = storeInfoDoc.parkingAvailable === true
      parkingSpaces = typeof storeInfoDoc.parkingSpaces === 'number' ? storeInfoDoc.parkingSpaces : 0
      facilities = Array.isArray(storeInfoDoc.facilities) ? storeInfoDoc.facilities : []
      oneLineIntro = typeof storeInfoDoc.oneLineIntro === 'string' ? storeInfoDoc.oneLineIntro : ''
      notice = typeof storeInfoDoc.notice === 'string' ? storeInfoDoc.notice : ''
    }

    // news 필드에서 플랫폼, 사업자등록번호, 매장 오픈일 데이터 파싱 (JSON 형식으로 저장됨)
    let platform = ''
    let businessNumber = ''
    let openDate = ''
    if (store?.news) {
      try {
        const parsed = JSON.parse(store.news)
        // 객체 형태 (새 버전: {platform: string, businessNumber: string, openDate: string})
        if (typeof parsed === 'object' && parsed !== null) {
          platform = typeof parsed.platform === 'string' ? parsed.platform : ''
          businessNumber = typeof parsed.businessNumber === 'string' ? parsed.businessNumber : ''
          openDate = typeof parsed.openDate === 'string' ? parsed.openDate : ''
        }
      } catch (e) {
        // JSON 파싱 실패 시 기본값 유지
        platform = ''
        businessNumber = ''
        openDate = ''
      }
    }

    // 매장이 없으면 기본값 반환
    if (!store) {
      return NextResponse.json({
        id: '',
        businessNumber: '',
        ownerName: owner.name,
        phone: owner.phone || '',
        storeNumber: '', // 매장 전화번호 추가
        address: '',
        detailAddress: '',
        openDate: '',
        storeType: '스크린골프',
        platform: '',
        email: '', // email 필드는 더 이상 사용하지 않음
        description: '',
        oneLineIntro: '',
        notice: '',
        totalRooms: 0,
        parkingAvailable: false,
        parkingSpaces: 0,
        facilities: [],
        photos: [],
      })
    }

    // 주소와 상세주소 분리 (store.location에 "|"로 구분되어 있을 수 있음)
    let mainAddress = store.location || ''
    let detailAddress = ''
    if (mainAddress.includes('|')) {
      const parts = mainAddress.split('|')
      mainAddress = parts[0] || ''
      detailAddress = parts[1] || ''
    }

    // photos 배열 생성
    let photosArray: string[] = []
    if (store.imageUrl) {
      if (typeof store.imageUrl === 'string') {
        photosArray = store.imageUrl.includes(',') 
          ? store.imageUrl.split(',').map((url: string) => url.trim()).filter((url: string) => url.length > 0)
          : [store.imageUrl.trim()].filter((url: string) => url.length > 0)
      } else if (Array.isArray(store.imageUrl)) {
        photosArray = store.imageUrl.filter((url: any) => url && typeof url === 'string' && url.trim().length > 0)
      }
    }
    
    console.log('매장 정보 조회 응답 - photos:', photosArray)
    console.log('매장 정보 조회 응답 - ownerName:', owner.name)
    console.log('매장 정보 조회 응답 - ownerId:', owner.id)

    return NextResponse.json({
      id: store.id,
      ownerId: owner.id, // ownerId 포함 (디버깅용)
      storeName: store.name || '',
      businessNumber: businessNumber,
      ownerName: owner.name,
      phone: owner.phone || '',
      storeNumber: ownerDoc?.store_phone || '', // 매장 전화번호 추가 (옵셔널 체이닝 사용)
      address: mainAddress,
      detailAddress: detailAddress,
      openDate: openDate,
      storeType: store.type || '스크린골프',
      platform: platform,
      email: '', // email 필드는 더 이상 사용하지 않음
      description: store.description || '',
      oneLineIntro: oneLineIntro, // store_info에서 가져온 한줄소개
      notice: notice, // store_info에서 가져온 공지사항
      totalRooms: totalRooms,
      parkingAvailable: parkingAvailable,
      parkingSpaces: parkingSpaces,
      facilities: facilities,
      photos: photosArray,
    })
  } catch (error: any) {
    console.error('매장 정보 조회 에러:', error)
    return NextResponse.json(
      { 
        error: '매장 정보를 불러오는데 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// 매장 정보 저장/수정
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      storeName,
      businessNumber,
      ownerName,
      phone,
      storeNumber, // 매장 전화번호 추가
      address,
      detailAddress,
      openDate,
      storeType,
      platform,
      description,
      oneLineIntro,
      notice,
      totalRooms,
      parkingAvailable,
      parkingSpaces,
      facilities,
      photos,
    } = body

    // 쿠키나 헤더에서 ownerId 가져오기
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    
    // 쿠키에서 ownerId 추출 시도
    let ownerId: string | null = null
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)
      ownerId = cookies['ownerId'] || null
    }
    
    // 헤더에서 가져오기 시도
    if (!ownerId) {
      ownerId = request.headers.get('x-owner-id')
    }
    
    // ownerId가 없으면 인증 오류 반환 (보안 강화)
    if (!ownerId) {
      return NextResponse.json(
        { 
          error: '인증이 필요합니다. 로그인해주세요.',
        },
        { status: 401 }
      )
    }

    // MongoDB 네이티브 쿼리로 점주 정보 업데이트 및 매장 정보 조회
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json(
        { error: '데이터베이스 연결 설정이 없습니다.' },
        { status: 500 }
      )
    }

    const client = new MongoClient(databaseUrl)
    let existingStore: any = null
    let db: any = null
    let ownerIdObjectId: ObjectId | null = null

    try {
      await client.connect()
      db = client.db('pos_admin')
      
      // ownerId를 ObjectId로 변환
      try {
        ownerIdObjectId = new ObjectId(ownerId)
      } catch (e) {
        console.error('ownerId를 ObjectId로 변환 실패:', ownerId, e)
        return NextResponse.json(
          { error: '유효하지 않은 점주 ID입니다.' },
          { status: 400 }
        )
      }

      // login 컬렉션 동기화 제거됨 - store_owner만 사용

      // store 컬렉션 제거됨 - power_admin의 store_owner에서 직접 정보 가져오기
      // power_admin 데이터베이스에서 점주 정보 조회
      let powerAdminUrl = databaseUrl
      if (databaseUrl.includes('/pos_admin')) {
        powerAdminUrl = databaseUrl.replace('/pos_admin', '/power_admin')
      } else if (databaseUrl.includes('/golf_app')) {
        powerAdminUrl = databaseUrl.replace('/golf_app', '/power_admin')
      } else {
        powerAdminUrl = databaseUrl.replace(/(mongodb\+srv?:\/\/[^\/]+)(\/[^?]*)?(\?.*)?$/, `$1/power_admin$3`)
      }

      const powerAdminClient = new MongoClient(powerAdminUrl)
      try {
        await powerAdminClient.connect()
        const powerAdminDb = powerAdminClient.db('power_admin')
        const storeOwnerCollection = powerAdminDb.collection('store_owner')
        
        existingStore = await storeOwnerCollection.findOne({ _id: ownerIdObjectId })
      } finally {
        await powerAdminClient.close()
      }
    } catch (dbError: any) {
      console.error('데이터베이스 조회 에러:', dbError)
      return NextResponse.json(
        { error: '매장 정보를 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    } finally {
      await client.close()
    }

    // 주소를 좌표로 변환 (지오코딩) - 선택적, 실패해도 계속 진행
    let latitude: number | null = null
    let longitude: number | null = null
    
    if (address) {
      try {
        const clientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID || process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
        const clientSecret = process.env.NAVER_MAPS_CLIENT_SECRET || process.env.NAVER_MAP_CLIENT_SECRET

        if (clientId && clientSecret) {
          const geocodeUrl = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`
          
          const geocodeResponse = await fetch(geocodeUrl, {
            headers: {
              'X-NCP-APIGW-API-KEY-ID': clientId,
              'X-NCP-APIGW-API-KEY': clientSecret,
            },
          })

          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json()
            if (geocodeData.status === 'OK' && geocodeData.addresses && geocodeData.addresses.length > 0) {
              const addressInfo = geocodeData.addresses[0]
              latitude = parseFloat(addressInfo.y)
              longitude = parseFloat(addressInfo.x)
            }
          }
        }
      } catch (geocodeError) {
        console.error('지오코딩 실패 (계속 진행):', geocodeError)
        // 지오코딩 실패해도 계속 진행
      }
    }

    // 문자열 필드 검증 및 정리
    const cleanString = (value: any): string | null => {
      if (!value) return null
      const str = String(value).trim()
      return str.length > 0 ? str : null
    }

    // 편의시설, 총 룸 수, 플랫폼, 사업자등록번호, 매장 오픈일 데이터를 JSON 문자열로 변환하여 news 필드에 저장
    const storeMetadata: any = {}
    if (facilities && Array.isArray(facilities) && facilities.length > 0) {
      storeMetadata.facilities = facilities
    }
    if (totalRooms !== undefined && totalRooms !== null) {
      storeMetadata.totalRooms = Number(totalRooms) || 0
    }
    if (platform && typeof platform === 'string' && platform.trim() !== '') {
      storeMetadata.platform = platform.trim()
    }
    if (businessNumber && typeof businessNumber === 'string' && businessNumber.trim() !== '') {
      storeMetadata.businessNumber = businessNumber.trim()
    }
    if (openDate && typeof openDate === 'string' && openDate.trim() !== '') {
      storeMetadata.openDate = openDate.trim()
    }
    const metadataJson = Object.keys(storeMetadata).length > 0 
      ? JSON.stringify(storeMetadata) 
      : null

    // 주소와 상세주소를 합쳐서 저장 (|로 구분)
    // 입력된 주소가 없으면 existingStore에서 가져오기
    let fullAddress = cleanString(address) 
      ? (cleanString(detailAddress) 
          ? `${cleanString(address)}|${cleanString(detailAddress)}` 
          : cleanString(address))
      : ''
    
    // 주소가 비어있으면 existingStore에서 가져오기
    if (!fullAddress && existingStore) {
      if (existingStore.address) {
        fullAddress = existingStore.detail_address 
          ? `${existingStore.address}|${existingStore.detail_address}`
          : existingStore.address
      }
    }

    // photos 배열을 문자열로 변환
    let imageUrlString: string | null = null
    if (photos && Array.isArray(photos) && photos.length > 0) {
      // 빈 문자열이 아닌 유효한 URL만 필터링
      const validPhotos = photos.filter(photo => photo && typeof photo === 'string' && photo.trim().length > 0)
      if (validPhotos.length > 0) {
        imageUrlString = validPhotos.join(',')
      }
    }
    
    console.log('매장 정보 저장 - photos 입력:', photos)
    console.log('매장 정보 저장 - imageUrl 변환:', imageUrlString)

    // power_admin의 store_owner에서 기존 매장명 가져오기 (기본값으로 사용)
    let defaultStoreName = ''
    if (existingStore && existingStore.store_name) {
      defaultStoreName = existingStore.store_name
      console.log('기존 매장명 가져오기:', defaultStoreName)
    }

    // 업장구분에 따라 type 필드 설정
    const getStoreType = (storeType: string | null | undefined): string => {
      const cleanedType = cleanString(storeType)
      if (!cleanedType) return '스크린골프'
      
      // 업장구분 매핑: 스크린골프 → 스크린골프, 파크골프 → 파크골프, 연습장 → 골프연습장
      if (cleanedType === '스크린골프') return '스크린골프'
      if (cleanedType === '파크골프') return '파크골프'
      if (cleanedType === '연습장') return '골프연습장'
      
      // 기존 값 그대로 사용 (이미 올바른 형식일 수 있음)
      return cleanedType
    }

    const storeData: any = {
      // power_admin에서 관리자가 등록한 매장명을 우선 사용, 없으면 입력된 storeName 사용, 그것도 없으면 기본값
      name: cleanString(storeName) || defaultStoreName || (address ? (address.split(' ')[0] || '매장') + ' 매장' : '매장'),
      location: fullAddress,
      type: getStoreType(storeType),
      description: cleanString(oneLineIntro) || cleanString(description) || null,
      notice: cleanString(notice) || null,
      parking: parkingAvailable ? (parkingSpaces ? `${parkingSpaces}대 가능` : '주차 가능') : '주차 불가',
      imageUrl: imageUrlString,
      news: metadataJson, // 편의시설 및 총 룸 수 데이터를 news 필드에 JSON으로 저장
    }

    console.log('매장 정보 저장:', {
      storeType: storeType,
      type: storeData.type,
      name: storeData.name,
      location: storeData.location,
      imageUrl: storeData.imageUrl,
    })

    // 좌표가 있으면 추가
    if (latitude !== null && longitude !== null) {
      storeData.latitude = latitude
      storeData.longitude = longitude
    }

    // store 컬렉션 제거됨 - power_admin의 store_owner에 직접 저장
    // power_admin 데이터베이스에 매장 정보 저장/업데이트
    let powerAdminUrl = databaseUrl
    if (databaseUrl.includes('/pos_admin')) {
      powerAdminUrl = databaseUrl.replace('/pos_admin', '/power_admin')
    } else if (databaseUrl.includes('/golf_app')) {
      powerAdminUrl = databaseUrl.replace('/golf_app', '/power_admin')
    } else {
      powerAdminUrl = databaseUrl.replace(/(mongodb\+srv?:\/\/[^\/]+)(\/[^?]*)?(\?.*)?$/, `$1/power_admin$3`)
    }

    const saveClient = new MongoClient(powerAdminUrl)
    try {
      await saveClient.connect()
      const db = saveClient.db('power_admin')
      const storeOwnerCollection = db.collection('store_owner')
      
      let ownerIdObjectId
      try {
        ownerIdObjectId = new ObjectId(ownerId)
      } catch (e) {
        console.error('ownerId를 ObjectId로 변환 실패:', ownerId, e)
        return NextResponse.json(
          { error: '유효하지 않은 점주 ID입니다.' },
          { status: 400 }
        )
      }

      // power_admin의 store_owner에 매장 정보 업데이트
      // store_name은 입력된 값이 있으면 업데이트, 없으면 기존 값 유지 (power_admin에서 관리자가 등록한 값 보존)
      const updateData: any = {
        // storeName이 입력되었을 때만 업데이트 (기존 power_admin의 store_name 보존)
        ...(cleanString(storeName) ? { store_name: storeData.name } : {}),
        address: address || undefined,
        detail_address: detailAddress || undefined,
        store_type: storeType || undefined,
        platform: platform || undefined,
        business_registration_number: businessNumber || undefined,
        store_open_date: openDate ? new Date(openDate) : undefined,
        store_phone: cleanString(storeNumber) || undefined, // 매장 전화번호 저장
        updated_at: new Date(),
      }
      
      // image_url은 null이어도 저장 (빈 배열을 의미)
      if (storeData.imageUrl !== null && storeData.imageUrl !== undefined) {
        updateData.image_url = storeData.imageUrl
      } else {
        updateData.image_url = null
      }
      
      console.log('매장 정보 저장 - 업데이트 데이터:', updateData)
      
      await storeOwnerCollection.updateOne(
        { _id: ownerIdObjectId },
        {
          $set: updateData,
        }
      )
      
      // 저장 후 확인
      const savedDoc = await storeOwnerCollection.findOne({ _id: ownerIdObjectId })
      console.log('매장 정보 저장 후 확인 - image_url:', savedDoc?.image_url)
    } catch (saveError: any) {
      console.error('매장 정보 저장 에러:', saveError)
      return NextResponse.json(
        { error: '매장 정보 저장에 실패했습니다.' },
        { status: 500 }
      )
    } finally {
      await saveClient.close()
    }

    // pos_admin의 store_info 컬렉션에 운영정보 저장
    // client가 이미 닫혔을 수 있으므로 새로운 연결 생성
    const storeInfoClient = new MongoClient(databaseUrl)
    try {
      await storeInfoClient.connect()
      const storeInfoDb = storeInfoClient.db('pos_admin')
      const storeInfoCollection = storeInfoDb.collection('store_info')
      
      const storeInfoOwnerId = new ObjectId(ownerId)
      const storeInfoData: any = {
        ownerId: storeInfoOwnerId,
        totalRooms: typeof totalRooms === 'number' ? totalRooms : 0,
        parkingAvailable: parkingAvailable === true,
        parkingSpaces: typeof parkingSpaces === 'number' ? parkingSpaces : 0,
        facilities: Array.isArray(facilities) ? facilities : [],
        oneLineIntro: typeof oneLineIntro === 'string' ? oneLineIntro : '',
        notice: typeof notice === 'string' ? notice : '',
        updatedAt: new Date(),
      }

      console.log('운영정보 저장 - store_info 데이터:', storeInfoData)

      // ownerId로 기존 문서 찾기
      const existingStoreInfo = await storeInfoCollection.findOne({ ownerId: storeInfoOwnerId })

      if (existingStoreInfo) {
        // 기존 문서가 있으면 업데이트
        await storeInfoCollection.updateOne(
          { ownerId: storeInfoOwnerId },
          {
            $set: storeInfoData,
          }
        )
        console.log('운영정보 업데이트 완료')
      } else {
        // 기존 문서가 없으면 생성
        storeInfoData.createdAt = new Date()
        await storeInfoCollection.insertOne(storeInfoData)
        console.log('운영정보 생성 완료')
      }
    } catch (storeInfoError: any) {
      console.error('운영정보 저장 에러:', storeInfoError)
      // 운영정보 저장 실패해도 계속 진행 (기본 정보 저장은 성공했으므로)
    } finally {
      await storeInfoClient.close()
    }

    // golf_app의 stores 컬렉션에 매장 정보 저장/업데이트
    let golfAppUrl = databaseUrl
    if (databaseUrl.includes('/pos_admin')) {
      golfAppUrl = databaseUrl.replace('/pos_admin', '/golf_app')
    } else if (databaseUrl.includes('/power_admin')) {
      golfAppUrl = databaseUrl.replace('/power_admin', '/golf_app')
    } else {
      golfAppUrl = databaseUrl.replace(/(mongodb\+srv?:\/\/[^\/]+)(\/[^?]*)?(\?.*)?$/, `$1/golf_app$3`)
    }

    const golfAppClient = new MongoClient(golfAppUrl)
    try {
      await golfAppClient.connect()
      const golfAppDb = golfAppClient.db('golf_app')
      const storesCollection = golfAppDb.collection('stores')
      
      // news 필드에 운영 정보도 포함
      // 입력된 값이 없으면 power_admin의 store_owner에서 가져온 값 사용
      const newsData: any = {
        facilities: Array.isArray(facilities) ? facilities : [],
        totalRooms: typeof totalRooms === 'number' ? totalRooms : 0,
      }
      
      // businessNumber: 입력값 우선, 없으면 existingStore에서 가져오기
      const cleanedBusinessNumber = cleanString(businessNumber)
      if (cleanedBusinessNumber) {
        newsData.businessNumber = cleanedBusinessNumber
      } else if (existingStore?.business_registration_number) {
        newsData.businessNumber = String(existingStore.business_registration_number).trim()
      }
      
      // platform: 입력값 우선, 없으면 existingStore에서 가져오기
      const cleanedPlatform = cleanString(platform)
      if (cleanedPlatform) {
        newsData.platform = cleanedPlatform
      } else if (existingStore?.platform) {
        newsData.platform = String(existingStore.platform).trim()
      }
      
      // openDate: 입력값 우선, 없으면 existingStore에서 가져오기
      const cleanedOpenDate = cleanString(openDate)
      if (cleanedOpenDate) {
        newsData.openDate = cleanedOpenDate
      } else if (existingStore?.store_open_date) {
        const storeOpenDate = existingStore.store_open_date instanceof Date 
          ? existingStore.store_open_date.toISOString().split('T')[0]
          : new Date(existingStore.store_open_date).toISOString().split('T')[0]
        newsData.openDate = storeOpenDate
      }
      
      const golfAppStoreData: any = {
        name: storeData.name,
        location: storeData.location,
        type: storeData.type,
        description: storeData.description,
        notice: storeData.notice,
        parking: storeData.parking,
        imageUrl: storeData.imageUrl, // 콤마로 구분된 이미지 URL 문자열
        news: JSON.stringify(newsData),
        ownerId: ownerIdObjectId,
        owner_id: ownerIdObjectId, // owner_id 필드도 함께 저장
        updated_at: new Date(),
      }
      
      // 좌표가 있으면 추가
      if (latitude !== null && longitude !== null) {
        golfAppStoreData.latitude = latitude
        golfAppStoreData.longitude = longitude
      }
      
      // ownerId 또는 owner_id로 기존 매장 찾기
      const existingGolfAppStore = await storesCollection.findOne({
        $or: [
          { ownerId: ownerIdObjectId },
          { owner_id: ownerIdObjectId }
        ]
      })
      
      console.log('golf_app stores 저장 - imageUrl:', storeData.imageUrl)
      console.log('golf_app stores 저장 - 기존 매장 존재:', !!existingGolfAppStore)
      
      if (existingGolfAppStore) {
        // 기존 매장이 있으면 업데이트
        await storesCollection.updateOne(
          {
            $or: [
              { ownerId: ownerIdObjectId },
              { owner_id: ownerIdObjectId }
            ]
          },
          {
            $set: golfAppStoreData,
          }
        )
        console.log('golf_app stores 컬렉션 업데이트 완료 - imageUrl:', storeData.imageUrl)
        
        // 업데이트 후 확인
        const updatedStore = await storesCollection.findOne({
          $or: [
            { ownerId: ownerIdObjectId },
            { owner_id: ownerIdObjectId }
          ]
        })
        console.log('golf_app stores 업데이트 후 확인 - imageUrl:', updatedStore?.imageUrl)
      } else {
        // 기존 매장이 없으면 생성
        golfAppStoreData._id = ownerIdObjectId
        golfAppStoreData.created_at = new Date()
        await storesCollection.insertOne(golfAppStoreData)
        console.log('golf_app stores 컬렉션 생성 완료 - imageUrl:', storeData.imageUrl)
      }
    } catch (golfAppError: any) {
      console.error('golf_app stores 컬렉션 저장 에러:', golfAppError)
      // golf_app 저장 실패해도 계속 진행 (다른 저장은 성공했으므로)
    } finally {
      await golfAppClient.close()
    }

    return NextResponse.json({
      success: true,
      message: '매장 정보가 저장되었습니다.',
    })
  } catch (error: any) {
    console.error('매장 정보 저장 에러:', error)
    return NextResponse.json(
      { 
        error: '매장 정보 저장에 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

