import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// 주소를 좌표로 변환하는 API
export async function POST(request: NextRequest) {
  try {
    const { addresses } = await request.json()

    if (!addresses || !Array.isArray(addresses)) {
      return NextResponse.json(
        { error: '주소 배열이 필요합니다.' },
        { status: 400 }
      )
    }

    const clientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID || process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
    const clientSecret = process.env.NAVER_MAPS_CLIENT_SECRET || process.env.NAVER_MAP_CLIENT_SECRET || process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('지도 API 설정 오류:', {
        clientId: clientId ? '있음' : '없음',
        clientSecret: clientSecret ? '있음' : '없음',
        availableEnvKeys: Object.keys(process.env).filter(key => key.includes('NAVER')).join(', ')
      })
      return NextResponse.json(
        { 
          error: '지도 API 설정이 없습니다.',
          details: process.env.NODE_ENV === 'development' ? {
            clientIdExists: !!clientId,
            clientSecretExists: !!clientSecret
          } : undefined
        },
        { status: 500 }
      )
    }

    // 각 주소를 좌표로 변환
    const results = await Promise.all(
      addresses.map(async (address: string) => {
        try {
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
              return {
                address,
                latitude: parseFloat(addressInfo.y),
                longitude: parseFloat(addressInfo.x),
                success: true,
              }
            } else {
              console.warn(`주소 변환 실패 (${address}):`, geocodeData.status, geocodeData.errorMessage)
            }
          } else {
            const errorData = await geocodeResponse.json().catch(() => ({}))
            console.error(`Geocoding API 오류 (${address}):`, geocodeResponse.status, errorData)
          }
          
          return {
            address,
            latitude: null,
            longitude: null,
            success: false,
          }
        } catch (error) {
          console.error(`주소 변환 실패 (${address}):`, error)
          return {
            address,
            latitude: null,
            longitude: null,
            success: false,
          }
        }
      })
    )

    return NextResponse.json({ results })
  } catch (error: any) {
    console.error('주소 변환 API 에러:', error)
    return NextResponse.json(
      { 
        error: '주소를 좌표로 변환하는데 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

