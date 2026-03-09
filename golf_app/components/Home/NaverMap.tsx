'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    naver: any
  }
}

export default function NaverMap() {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 네이버 지도 API 스크립트 로드
    const script = document.createElement('script')
    script.src =
      'https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=YOUR_CLIENT_ID'
    script.async = true
    script.onload = () => {
      if (window.naver && mapRef.current) {
        const map = new window.naver.maps.Map(mapRef.current, {
          center: new window.naver.maps.LatLng(37.4979, 127.0276), // 강남역 좌표
          zoom: 15,
        })

        // 마커 추가 예시
        new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(37.4979, 127.0276),
          map: map,
          title: '강남역',
        })
      }
    }
    document.head.appendChild(script)

    return () => {
      // cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return <div ref={mapRef} className="w-full h-full" />
}

