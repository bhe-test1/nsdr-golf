'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    naver: any
    navermap_authFailure?: () => void
  }
}

interface Marker {
  id: string
  name: string
  address: string
  lat: number
  lng: number
}

interface AddressToGeocode {
  id: string
  name: string
  address: string
}

interface DynamicNaverMapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: Marker[]
  addressesToGeocode?: AddressToGeocode[]
  onGeocodeComplete?: (markers: Marker[]) => void
  onMarkerClick?: (marker: Marker) => void
}

export default function DynamicNaverMap({
  center = { lat: 37.4979, lng: 127.0276 }, // 강남역 기본값
  zoom = 15,
  markers = [],
  addressesToGeocode = [],
  onGeocodeComplete,
  onMarkerClick,
}: DynamicNaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const geocodedMarkersRef = useRef<Marker[]>([])
  const processedAddressesRef = useRef<Set<string>>(new Set()) // 이미 처리한 주소 추적
  const golfIconRef = useRef<any>(null) // 골프 아이콘 캐싱
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)

  // 현재 위치 가져오기
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation이 지원되지 않습니다.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ lat: latitude, lng: longitude })
      },
      (error) => {
        // 위치 정보를 가져오지 못해도 지도는 표시 (에러 로그는 출력하지 않음)
        // console.warn('위치 정보를 가져올 수 없습니다:', error.message)
      },
      {
        enableHighAccuracy: false, // 정확도 낮춰서 빠른 응답
        timeout: 10000, // 타임아웃 10초로 증가
        maximumAge: 60000, // 1분간 캐시된 위치 정보 사용 가능
      }
    )
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    // Dynamic Map은 클라이언트 사이드에서 사용하므로 NEXT_PUBLIC_ 접두사 필요
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID || process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID

    if (!clientId) {
      setError('지도 서비스를 사용할 수 없습니다. 관리자에게 문의해주세요.')
      setIsLoading(false)
      return
    }

    // 네이버 지도 스크립트가 이미 로드되었는지 확인
    if (window.naver && window.naver.maps) {
      // 현재 위치를 기다린 후 지도 초기화
      if (currentLocation) {
        initializeMap()
      } else {
        // 위치 정보를 기다리지 않고 바로 초기화 (위치가 나중에 업데이트됨)
        initializeMap()
      }
      return
    }

    // 인증 실패 처리 함수 등록
    window.navermap_authFailure = function () {
      setError('지도 서비스를 사용할 수 없습니다. 관리자에게 문의해주세요.')
      setIsLoading(false)
      console.error('네이버 지도 API 인증 실패')
    }

    // 네이버 지도 스크립트 로드 (신규 API v3 - ncpKeyId 사용)
    // geocoder 서브모듈 추가 필수!
    const script = document.createElement('script')
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`
    script.async = true
    script.onload = () => {
      if (window.naver && window.naver.maps) {
        initializeMap()
      } else {
        setError('네이버 지도 스크립트 로드 실패')
        setIsLoading(false)
      }
    }
    script.onerror = () => {
      setError('네이버 지도 스크립트 로드 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
    document.head.appendChild(script)

    return () => {
      // cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
      // 마커 제거
      markersRef.current.forEach((marker) => {
        marker.setMap(null)
      })
      markersRef.current = []
      
      // 아이콘 URL 정리
      if (golfIconRef.current && golfIconRef.current.url) {
        try {
          URL.revokeObjectURL(golfIconRef.current.url)
        } catch (e) {
          // 무시
        }
        golfIconRef.current = null
      }
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy()
      }
      // 인증 실패 함수 제거
      if (window.navermap_authFailure) {
        delete window.navermap_authFailure
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // currentLocation이 변경되면 지도 재초기화 (아직 지도가 초기화되지 않았을 때)
  useEffect(() => {
    if (currentLocation && mapInstanceRef.current && !mapInstanceRef.current.getCenter) {
      // 지도가 아직 초기화되지 않았고 현재 위치가 있으면 초기화
      if (window.naver && window.naver.maps) {
        initializeMap()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation])

  const initializeMap = () => {
    if (!mapRef.current || !window.naver || !window.naver.maps) return

    try {
      // 현재 위치가 있으면 그 위치를 중심으로, 없으면 기본 center 사용
      const mapCenter = currentLocation || center

      // 지도 생성 (로고·저작권·스케일 바 비표시)
      const map = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(mapCenter.lat, mapCenter.lng),
        zoom: currentLocation ? 15 : zoom, // 사용자 위치일 때는 줌 레벨 15
        zoomControl: false,
        logoControl: false,
        mapDataControl: false,
        scaleControl: false,
      })

      mapInstanceRef.current = map

      // 마커 표시
      updateMarkers()

      setIsLoading(false)
      setError('')
    } catch (err) {
      console.error('지도 초기화 오류:', err)
      setError('지도 초기화 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
  }

  // 블루 계열(#00ACEE) 골프 핀 마커 아이콘 생성
  const createGolfMarkerIcon = () => {
    const uid = `pin-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const svg = `
      <svg width="48" height="60" viewBox="0 0 48 60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="${uid}-shadow" x="-40%" y="-20%" width="180%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0088c2" flood-opacity="0.4"/>
          </filter>
          <linearGradient id="${uid}-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#33bdff"/>
            <stop offset="40%" style="stop-color:#00ACEE"/>
            <stop offset="100%" style="stop-color:#0088c2"/>
          </linearGradient>
          <linearGradient id="${uid}-hl" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.45"/>
            <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0"/>
          </linearGradient>
          <radialGradient id="${uid}-ball" cx="35%" cy="35%" r="60%">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.95"/>
            <stop offset="70%" style="stop-color:#e8f4fc;stop-opacity:0.7"/>
            <stop offset="100%" style="stop-color:#cce5f2"/>
          </radialGradient>
        </defs>
        <path d="M 24 0 C 37.255 0 48 10.745 48 24 C 48 36 24 60 24 60 C 24 60 0 36 0 24 C 0 10.745 10.745 0 24 0 Z" 
              fill="url(#${uid}-grad)" filter="url(#${uid}-shadow)" stroke="#007ab8" stroke-width="1.2" stroke-opacity="0.7"/>
        <path d="M 24 4 C 34 4 42 12 42 22 C 42 30 28 48 24 52 L 24 4 Z" 
              fill="url(#${uid}-hl)" opacity="0.9"/>
        <circle cx="24" cy="22" r="12" fill="url(#${uid}-ball)" stroke="#ffffff" stroke-width="2" opacity="0.98"/>
        <circle cx="24" cy="22" r="8" fill="none" stroke="#94a3b8" stroke-width="0.8" opacity="0.5"/>
        <circle cx="20" cy="19" r="1.2" fill="#94a3b8" opacity="0.45"/>
        <circle cx="28" cy="20" r="1" fill="#94a3b8" opacity="0.4"/>
        <circle cx="22" cy="25" r="1" fill="#94a3b8" opacity="0.35"/>
      </svg>
    `
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    return {
      url: url,
      size: new window.naver.maps.Size(48, 60),
      scaledSize: new window.naver.maps.Size(36, 45), // 조금 더 작게 표시
      anchor: new window.naver.maps.Point(18, 45), // 축소된 크기에 맞춰 핀 끝이 위치를 가리킴
    }
  }

  // 마커 업데이트 함수
  const updateMarkers = () => {
    if (!mapInstanceRef.current || !window.naver || !window.naver.maps) return

    // 기존 마커 제거
    markersRef.current.forEach((marker) => {
      marker.setMap(null)
    })
    markersRef.current = []

    // 모든 마커 합치기 (기존 markers + geocoded markers)
    const allMarkers = [...markers, ...geocodedMarkersRef.current]

    // 골프공 아이콘 생성 (한 번만 생성하여 재사용)
    if (!golfIconRef.current) {
      golfIconRef.current = createGolfMarkerIcon()
    }

    // 새 마커 추가
    if (allMarkers.length > 0) {
      allMarkers.forEach((markerData) => {
        if (markerData.lat && markerData.lng) {
          const marker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(markerData.lat, markerData.lng),
            map: mapInstanceRef.current,
            title: markerData.name,
            icon: golfIconRef.current,
            zIndex: 1000, // 다른 요소 위에 표시
          })
          if (onMarkerClick && typeof onMarkerClick === 'function') {
            window.naver.maps.Event.addListener(marker, 'click', () => {
              onMarkerClick(markerData)
            })
          }
          markersRef.current.push(marker)
        }
      })
    }
  }

  // 현재 위치가 변경되면 지도 중심 이동 및 줌 조정
  useEffect(() => {
    if (mapInstanceRef.current && currentLocation && window.naver && window.naver.maps) {
      const map = mapInstanceRef.current
      const location = new window.naver.maps.LatLng(currentLocation.lat, currentLocation.lng)
      
      // 지도 중심 이동 및 줌 조정
      map.setCenter(location)
      map.setZoom(15)
    }
  }, [currentLocation])

  // center prop이 변경되면 지도 중심 이동
  useEffect(() => {
    if (mapInstanceRef.current && window.naver && window.naver.maps) {
      const map = mapInstanceRef.current
      const location = new window.naver.maps.LatLng(center.lat, center.lng)
      
      // 지도 중심 이동
      map.setCenter(location)
    }
  }, [center])

  // markers prop 또는 onMarkerClick 변경 시 마커 업데이트
  useEffect(() => {
    if (mapInstanceRef.current && window.naver && window.naver.maps) {
      updateMarkers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, onMarkerClick])

  // addressesToGeocode가 변경되면 geocoder로 변환
  useEffect(() => {
    if (addressesToGeocode.length === 0) {
      return
    }
    
    if (!window.naver || !window.naver.maps) {
      return
    }

    if (!mapInstanceRef.current) {
      return
    }

    // 이미 처리한 주소는 제외
    const newAddresses = addressesToGeocode.filter(item => !processedAddressesRef.current.has(item.address))
    
    if (newAddresses.length === 0) {
      return // 모든 주소가 이미 처리됨
    }

    const geocodeAddresses = async () => {
      const geocodedMarkers: Marker[] = []
      
      for (const item of newAddresses) {
        try {
          // 이미 처리한 주소는 건너뛰기
          if (processedAddressesRef.current.has(item.address)) {
            continue
          }
          
          // 네이버 지도 JavaScript API v3의 geocoder 사용
          if (window.naver.maps.Service && window.naver.maps.Service.geocode) {
            await new Promise<void>((resolve) => {
              window.naver.maps.Service.geocode({
                query: item.address,
              }, (status: string, response: any) => {
                if (status === window.naver.maps.Service.Status.ERROR) {
                  // 에러 발생 시에도 처리 완료로 표시하여 재시도 방지
                  processedAddressesRef.current.add(item.address)
                  resolve()
                  return
                }

                if (response.v2 && response.v2.meta && response.v2.meta.totalCount > 0) {
                  const result = response.v2.addresses[0]
                  const lat = parseFloat(result.y)
                  const lng = parseFloat(result.x)
                  
                  if (lat && lng) {
                    geocodedMarkers.push({
                      id: item.id,
                      name: item.name,
                      address: item.address,
                      lat,
                      lng,
                    })
                    // 성공한 주소는 처리 완료로 표시
                    processedAddressesRef.current.add(item.address)
                  }
                }
                resolve()
              })
            })
          }
        } catch (error) {
          // 에러 발생 시에도 처리 완료로 표시
          processedAddressesRef.current.add(item.address)
        }
      }

      if (geocodedMarkers.length > 0) {
        // 기존 geocoded markers에 추가 (중복 방지)
        const existingIds = new Set(geocodedMarkersRef.current.map(m => m.id))
        const newMarkers = geocodedMarkers.filter(m => !existingIds.has(m.id))
        
        if (newMarkers.length > 0) {
          geocodedMarkersRef.current = [...geocodedMarkersRef.current, ...newMarkers]
          
          if (onGeocodeComplete) {
            onGeocodeComplete(newMarkers)
          }
          // 마커 업데이트
          if (mapInstanceRef.current) {
            updateMarkers()
          }
        }
      }
    }

    // 지도가 로드된 후에만 geocoder 실행
    geocodeAddresses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // addressesToGeocode 배열의 내용이 실제로 바뀌었는지 확인하기 위해 ID 문자열로 변환
    addressesToGeocode.map(a => a.id).join(',')
  ])

  // 모바일에서만 네이버 로고 DOM 숨김 (API 옵션만으로 안 숨겨질 때 대비)
  useEffect(() => {
    if (isLoading || !mapRef.current || typeof window === 'undefined') return
    const isMobile = window.innerWidth <= 768
    if (!isMobile) return

    const hideLogo = () => {
      const root = mapRef.current
      if (!root) return
      const found = new Set<HTMLElement>()

      // 네이버 지도가 주입하는 로고 img (new-naver-logo-normal.png) 및 부모 a
      root.querySelectorAll('img[src*="naver-logo"], img[src*="new-naver-logo-normal"], img[alt="NAVER"]').forEach((el) => {
        found.add(el as HTMLElement)
        const parent = (el as HTMLElement).parentElement
        if (parent && parent.tagName === 'A') found.add(parent)
      })

      const check = (el: Element, scope: Element) => {
        const htmlEl = el as HTMLElement
        const text = (htmlEl.textContent || '').trim()
        if (!text || text.length > 50) return
        if (text === 'NAVER' || text.includes('NAVER Corp') || /^NAVER\s*$/.test(text)) {
          found.add(htmlEl)
          let p = htmlEl.parentElement
          while (p && p !== scope) {
            const rect = p.getBoundingClientRect()
            if (rect.width < 400 && rect.height < 120) {
              found.add(p as HTMLElement)
              p = p.parentElement
            } else break
          }
        }
      }
      root.querySelectorAll('*').forEach((el) => check(el, root))
      // 지도 div 밖에 로고가 붙은 경우: 화면 하단 근처의 NAVER 요소
      if (typeof document !== 'undefined') {
        document.querySelectorAll('*').forEach((el) => {
          const htmlEl = el as HTMLElement
          if (root.contains(htmlEl)) return
          if ((htmlEl.textContent || '').trim() !== 'NAVER') return
          const rect = htmlEl.getBoundingClientRect()
          if (rect.bottom >= window.innerHeight - 100 && rect.width < 200) found.add(htmlEl)
        })
      }
      found.forEach((el) => {
        el.style.setProperty('visibility', 'hidden', 'important')
        el.style.setProperty('display', 'none', 'important')
      })
    }

    const map = mapInstanceRef.current
    if (map && typeof map.setOptions === 'function') {
      map.setOptions({ logoControl: false, mapDataControl: false })
    }

    hideLogo()
    const timers = [100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000].map((ms) => setTimeout(hideLogo, ms))
    const interval = setInterval(hideLogo, 500)
    const stopInterval = setTimeout(() => clearInterval(interval), 15000)
    const observer = new MutationObserver(hideLogo)
    observer.observe(mapRef.current, { childList: true, subtree: true })
    return () => {
      timers.forEach((t) => clearTimeout(t))
      clearTimeout(stopInterval)
      clearInterval(interval)
      observer.disconnect()
    }
  }, [isLoading])

  return (
    <div className="w-full h-full relative bg-gray-200 naver-map-wrap">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-gray-600 text-lg">네이버 지도 로딩 중...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center p-4 max-w-md">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-gray-600 text-lg mb-2">지도를 불러올 수 없습니다</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <p className="text-gray-400 text-xs">
              지도 기능은 현재 사용할 수 없지만, 다른 기능은 정상적으로 이용하실 수 있습니다.
            </p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full relative" />
      {/* 모바일: 지도 로딩 후 나중에 주입되는 네이버 로고를 가리기 (z-index 높게 해서 로고 위에 표시) */}
      <div
        className="naver-logo-cover absolute bottom-0 right-0 w-[90px] h-14 bg-white z-[9999] pointer-events-none md:hidden"
        aria-hidden
      />
    </div>
  )
}

