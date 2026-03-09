'use client'

import { useState, useEffect } from 'react'
import { FiMapPin, FiStar, FiCalendar, FiChevronLeft, FiChevronRight, FiCamera } from 'react-icons/fi'
import Image from 'next/image'
import type { Store } from '@/lib/types'
import ReservationModal from '@/components/Reservations/ReservationModal'
import ImageViewer from '@/components/Common/ImageViewer'

export type InitialDetailData = {
  storeInfo: {
    storeName: string
    storeType: string
    platform: string
    address: string
    detailAddress: string
    parkingAvailable: boolean
    parkingSpaces: number
    facilities: string[]
  } | null
  availabilityData: { images: string[]; timeSlots: string[]; rooms: string[]; availability: Record<string, boolean> }
  priceData: { gamePrices: any; foodPrices: any; golfPrices: any[] }
}

interface StoreDetailModalProps {
  store: Store
  initialDetailData?: InitialDetailData | null
  onClose: () => void
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function StoreDetailModal({ store, initialDetailData, onClose }: StoreDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'reservation' | 'info' | 'reviews'>('reservation')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showReservationModal, setShowReservationModal] = useState(false)

  const [images, setImages] = useState<string[]>(() => initialDetailData?.availabilityData?.images ?? [])
  const [timeSlots, setTimeSlots] = useState<string[]>(() => initialDetailData?.availabilityData?.timeSlots ?? [])
  const [rooms, setRooms] = useState<string[]>(() => initialDetailData?.availabilityData?.rooms ?? [])
  const [availability, setAvailability] = useState<Record<string, boolean>>(() => initialDetailData?.availabilityData?.availability ?? {})
  const [isDragging, setIsDragging] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0) // 예약 완료 후 갱신을 위한 키
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [gamePrices, setGamePrices] = useState<{ weekday: any[]; weekend: any[] }>(() => initialDetailData?.priceData?.gamePrices ?? { weekday: [], weekend: [] })
  const [foodPrices, setFoodPrices] = useState<{ weekday: any[]; weekend: any[] }>(() => initialDetailData?.priceData?.foodPrices ?? { weekday: [], weekend: [] })
  const [golfPrices, setGolfPrices] = useState<Array<{ id: string; name: string; price: number | string }>>(() => initialDetailData?.priceData?.golfPrices ?? [])
  const [storeInfo, setStoreInfo] = useState<{
    storeName: string
    storeType: string
    platform: string
    address: string
    detailAddress: string
    parkingAvailable: boolean
    parkingSpaces: number
    facilities: string[]
  } | null>(() => initialDetailData?.storeInfo ?? null)

  const fetchStoreInfo = async () => {
    try {
      const response = await fetch(`/api/stores/${store.id}/store-info`)
      if (response.ok) {
        const data = await response.json()
        setStoreInfo(data)
      } else {
        setStoreInfo(null)
      }
    } catch (error) {
      console.error('매장 정보를 불러오는데 실패했습니다:', error)
      setStoreInfo(null)
    }
  }

    const fetchStoreDetails = async () => {
      try {
        // 로컬 타임존 기준으로 날짜 문자열 생성 (YYYY-MM-DD)
        const year = selectedDate.getFullYear()
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
        const day = String(selectedDate.getDate()).padStart(2, '0')
        const dateString = `${year}-${month}-${day}`
        const response = await fetch(`/api/stores/${store.id}/availability?date=${dateString}`)
        if (response.ok) {
          const data = await response.json()
          setImages(data.images || [])
          // ON 처리된 시간대만 표시 (API에서 이미 필터링됨)
          setTimeSlots(data.timeSlots && data.timeSlots.length > 0 
            ? data.timeSlots 
            : [])
          // 기본 룸 설정 (데이터가 없을 경우)
          setRooms(data.rooms && data.rooms.length > 0 
            ? data.rooms 
            : ['1번 방', '2번 방', '3번 방'])
          setAvailability(data.availability || {})
        } else {
          // API 실패 시 빈 배열로 설정 (ON 처리된 시간대가 없음)
          setTimeSlots([])
          setRooms(['1번 방', '2번 방', '3번 방'])
        }
      } catch (error) {
        console.error('매장 상세 정보를 불러오는데 실패했습니다:', error)
        // 에러 발생 시 빈 배열로 설정
        setTimeSlots([])
        setRooms(['1번 방', '2번 방', '3번 방'])
      }
    }

  const fetchPriceInfo = async () => {
    try {
      const response = await fetch(`/api/stores/${store.id}/price`)
      if (response.ok) {
        const data = await response.json()
        console.log('가격 정보 응답:', data)
        setGamePrices(data.gamePrices || { weekday: [], weekend: [] })
        setFoodPrices(data.foodPrices || { weekday: [], weekend: [] })
        setGolfPrices(data.golfPrices || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('가격 정보 조회 실패:', response.status, errorData)
        setGamePrices({ weekday: [], weekend: [] })
        setFoodPrices({ weekday: [], weekend: [] })
        setGolfPrices([])
      }
    } catch (error) {
      console.error('가격 정보를 불러오는데 실패했습니다:', error)
      setGamePrices({ weekday: [], weekend: [] })
      setFoodPrices({ weekday: [], weekend: [] })
      setGolfPrices([])
    }
  }

  // 매장이 바뀌면(다른 마커 클릭 등) 새 매장 데이터로 상태 동기화 — 모달이 언마운트되지 않아 이전 매장 사진이 남는 문제 방지
  useEffect(() => {
    if (initialDetailData) {
      setImages(initialDetailData.availabilityData?.images ?? [])
      setTimeSlots(initialDetailData.availabilityData?.timeSlots ?? [])
      setRooms(initialDetailData.availabilityData?.rooms ?? [])
      setAvailability(initialDetailData.availabilityData?.availability ?? {})
      setStoreInfo(initialDetailData.storeInfo ?? null)
      setGamePrices(initialDetailData.priceData?.gamePrices ?? { weekday: [], weekend: [] })
      setFoodPrices(initialDetailData.priceData?.foodPrices ?? { weekday: [], weekend: [] })
      setGolfPrices(initialDetailData.priceData?.golfPrices ?? [])
      setCurrentImageIndex(0)
    }
  }, [store.id, initialDetailData])

  // initialDetailData가 있으면 매장 정보/가격은 이미 채워져 있음. 오늘 날짜면 availability도 재요청 생략
  useEffect(() => {
    const isToday = isSameDay(selectedDate, new Date())
    if (initialDetailData && isToday && refreshKey === 0) {
      return // 이미 한 번에 불러온 데이터로 표시 중
    }
    fetchStoreDetails()
    if (!initialDetailData) {
      fetchStoreInfo()
      fetchPriceInfo()
    }
  }, [store.id, selectedDate, refreshKey])

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayName = days[date.getDay()]
    return `${month}월 ${day}일 ${dayName}`
  }

  // 날짜가 같은지 확인
  const isSameDate = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  // 선택 가능한 날짜 목록 생성 (오늘 포함 5일)
  const getAvailableDates = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const dates: Date[] = []
    for (let i = 0; i <= 4; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }
    
    return dates
  }

  const availableDates = getAvailableDates()

  // 예약 가능 여부
  const isAvailable = (room: string, time: string) => {
    return availability[`${room}-${time}`] || false
  }

  const handleReserve = (room: string, time: string) => {
    setSelectedRoom(room)
    setSelectedTime(time)
    // 바로 예약 모달 열기
    setShowReservationModal(true)
  }

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return '가격 문의'
    return `${price.toLocaleString()}원`
  }

  return (
    <div 
      className="w-full h-full bg-white flex flex-col overflow-hidden relative"
      onClick={(e) => e.stopPropagation()}
    >
        {/* 이미지 캐러셀 - 모바일에서 더 크게, 웹과 동일한 비율 */}
        <div className="relative h-52 sm:h-48 flex-shrink-0 overflow-hidden bg-gray-100">
          {(images.length > 0 || store.imageUrl) ? (
            <>
              <div 
                className="relative w-full h-full cursor-pointer"
                onClick={() => setIsImageViewerOpen(true)}
              >
                <Image
                  src={images.length > 0 ? (images[currentImageIndex] || images[0]) : (store.imageUrl || '')}
                  alt={`${store.name} 매장 사진 ${currentImageIndex + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
                    // 이미지 로드 실패 시 기본 이미지로 대체
                    const target = e.target as HTMLImageElement
                    target.src = ''
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      const fallback = document.createElement('div')
                      fallback.className = 'w-full h-full bg-gray-100 flex items-center justify-center'
                      const icon = document.createElement('div')
                      icon.innerHTML = '<svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>'
                      fallback.appendChild(icon)
                      parent.appendChild(fallback)
                    }
                  }}
                />
              </div>
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition z-10"
                  >
                    <FiChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition z-10"
                  >
                    <FiChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                    {images.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <FiCamera className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* 스크롤 가능한 컨텐츠 - 하단 여유로 예약하기 버튼이 잘리지 않고 끝까지 보이도록 */}
        <div className="flex-1 overflow-y-auto min-h-0 pb-12 md:pb-20">
          {/* 매장 기본 정보 - 매장명 | 브랜드, 주소 + 복사 */}
          {(() => {
            let platform = storeInfo?.platform || store.platform || ''
            if (!platform && store.news) {
              try {
                const newsData = typeof store.news === 'string' ? JSON.parse(store.news) : store.news
                if (newsData && typeof newsData === 'object' && newsData !== null) {
                  platform = newsData.platform || ''
                }
              } catch (e) {
                // ignore
              }
            }
            const addressText = store.location ? store.location.replace(/\|/g, ', ') : ''
            const handleCopyAddress = () => {
              if (addressText && typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(addressText)
              }
            }
            return (
              <div className="p-4 sm:p-4 border-b border-gray-100">
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  {store.name}
                  {platform ? <span className="font-normal text-gray-500 text-base"> | {platform}</span> : ''}
                </h1>
                <div className="flex items-center gap-2 text-gray-600 text-sm flex-nowrap">
                  <FiMapPin className="flex-shrink-0 text-gray-500" />
                  <span className="min-w-0 truncate flex-1">{addressText || '-'}</span>
                  {addressText && (
                    <>
                      <a
                        href={`https://map.naver.com/v5/search/${encodeURIComponent(addressText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition"
                      >
                        지도
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyAddress}
                        className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition"
                      >
                        복사
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })()}

          {/* 탭 네비게이션 - 이용 정보 / 매장 정보 / 후기 */}
          <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
            <button
              onClick={() => setActiveTab('reservation')}
              className={`flex-1 px-3 py-3 text-sm font-semibold transition relative ${
                activeTab === 'reservation'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              이용 정보
              {activeTab === 'reservation' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00ACEE]"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 px-3 py-3 text-sm font-semibold transition relative ${
                activeTab === 'info'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              매장 정보
              {activeTab === 'info' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00ACEE]"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 px-3 py-3 text-sm font-semibold transition relative ${
                activeTab === 'reviews'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              후기
              {activeTab === 'reviews' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00ACEE]"></span>
              )}
            </button>
          </div>

          {/* 탭 컨텐츠 - 모바일: 예약하기 플로팅 버튼에 가리지 않도록 하단 여백 */}
          <div className="p-4 pb-[9rem] md:pb-4">
            {activeTab === 'reservation' && (
              <div className="space-y-6">
                {/* 가격 정보 - 연습장 이용권 */}
                {store.type === '골프연습장' && (gamePrices.weekday.length > 0 || gamePrices.weekend.length > 0) && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-gray-800">이용권 가격</h3>
                    {gamePrices.weekday.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">평일</h4>
                        <div className="border border-gray-200 rounded-lg overflow-x-auto">
                          <table className="w-full text-xs min-w-max">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-center py-2 px-3 text-gray-600 font-medium w-28">시간</th>
                                <th className="text-center py-2 px-3 text-gray-600 font-medium">1개월권</th>
                                <th className="text-center py-2 px-3 text-gray-600 font-medium">3개월권</th>
                                <th className="text-center py-2 px-3 text-gray-600 font-medium">6개월권</th>
                                <th className="text-center py-2 px-3 text-gray-600 font-medium">12개월권</th>
                                <th className="text-center py-2 px-3 text-gray-600 font-medium">1일권</th>
                              </tr>
                            </thead>
                            <tbody>
                              {gamePrices.weekday.map((price: any, index: number) => (
                                <tr key={`weekday-${price.id || index}`} className={`border-b border-gray-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                  <td className="py-2 px-3 text-gray-800 whitespace-nowrap text-center">{price.time || '-'}</td>
                                  <td className="py-2 px-3 text-center text-gray-800">{price.month1 ? `${Number(price.month1).toLocaleString()}원` : '-'}</td>
                                  <td className="py-2 px-3 text-center text-gray-800">{price.month3 ? `${Number(price.month3).toLocaleString()}원` : '-'}</td>
                                  <td className="py-2 px-3 text-center text-gray-800">{price.month6 ? `${Number(price.month6).toLocaleString()}원` : '-'}</td>
                                  <td className="py-2 px-3 text-center text-gray-800">{price.month12 ? `${Number(price.month12).toLocaleString()}원` : '-'}</td>
                                  <td className="py-2 px-3 text-center text-gray-800">{price.day1 ? `${Number(price.day1).toLocaleString()}원` : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {gamePrices.weekend.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">주말/공휴일</h4>
                        <div className="border border-gray-200 rounded-lg overflow-x-auto">
                          <table className="w-full text-xs min-w-max">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-center py-2 px-3 text-gray-600 font-medium w-28">시간</th>
                                <th className="text-center py-2 px-3 text-gray-600 font-medium">1개월권</th>
                                <th className="text-center py-2 px-3 text-gray-600 font-medium">3개월권</th>
                                <th className="text-center py-2 px-3 text-gray-600 font-medium">6개월권</th>
                                <th className="text-center py-2 px-3 text-gray-600 font-medium">12개월권</th>
                                <th className="text-center py-2 px-3 text-gray-600 font-medium">1일권</th>
                              </tr>
                            </thead>
                            <tbody>
                              {gamePrices.weekend.map((price: any, index: number) => (
                                <tr key={`weekend-${price.id || index}`} className={`border-b border-gray-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                  <td className="py-2 px-3 text-gray-800 whitespace-nowrap text-center">{price.time || '-'}</td>
                                  <td className="py-2 px-3 text-center text-gray-800">{price.month1 ? `${Number(price.month1).toLocaleString()}원` : '-'}</td>
                                  <td className="py-2 px-3 text-center text-gray-800">{price.month3 ? `${Number(price.month3).toLocaleString()}원` : '-'}</td>
                                  <td className="py-2 px-3 text-center text-gray-800">{price.month6 ? `${Number(price.month6).toLocaleString()}원` : '-'}</td>
                                  <td className="py-2 px-3 text-center text-gray-800">{price.month12 ? `${Number(price.month12).toLocaleString()}원` : '-'}</td>
                                  <td className="py-2 px-3 text-center text-gray-800">{price.day1 ? `${Number(price.day1).toLocaleString()}원` : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* 가격 정보 - 스크린골프/파크골프 (스트로크, 포썸, 연습장) */}
                {store.type !== '골프연습장' && (gamePrices.weekday.length > 0 || gamePrices.weekend.length > 0) && (
                  <div className="space-y-6">
                    {(gamePrices.weekday.some((p: any) => p.stroke9 || p.hole9 || p.stroke18 || p.hole18) || gamePrices.weekend.some((p: any) => p.stroke9 || p.hole9 || p.stroke18 || p.hole18)) && (
                      <div className="space-y-4">
                        <h3 className="text-base font-bold text-blue-700">스트로크</h3>
                        {gamePrices.weekday.some((p: any) => p.stroke9 || p.hole9 || p.stroke18 || p.hole18) && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">평일 스트로크</h4>
                            <div className="border border-gray-200 rounded-lg overflow-x-auto">
                              <table className="w-full text-sm min-w-max">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-center py-2 px-3 text-gray-900 font-bold w-28 whitespace-nowrap">시간</th>
                                    <th className="text-center py-2 px-3 text-gray-900 font-bold whitespace-nowrap">9홀</th>
                                    <th className="text-center py-2 px-3 text-gray-900 font-bold whitespace-nowrap">18홀</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {gamePrices.weekday.filter((p: any) => p.stroke9 || p.hole9 || p.stroke18 || p.hole18).map((price: any, index: number) => (
                                    <tr key={`ws-${price.id || index}`} className={`border-b border-gray-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                      <td className="py-2 px-3 text-gray-800 whitespace-nowrap text-center">{price.time || '-'}</td>
                                      <td className="py-2 px-3 text-center text-gray-800">{price.stroke9 || price.hole9 ? `${Number(price.stroke9 || price.hole9 || 0).toLocaleString()}` : '-'}</td>
                                      <td className="py-2 px-3 text-center text-gray-800">{price.stroke18 || price.hole18 ? `${Number(price.stroke18 || price.hole18 || 0).toLocaleString()}` : '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {gamePrices.weekend.some((p: any) => p.stroke9 || p.hole9 || p.stroke18 || p.hole18) && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">주말/공휴일 스트로크</h4>
                            <div className="border border-gray-200 rounded-lg overflow-x-auto">
                              <table className="w-full text-sm min-w-max">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-center py-2 px-3 text-gray-900 font-bold w-28 whitespace-nowrap">시간</th>
                                    <th className="text-center py-2 px-3 text-gray-900 font-bold whitespace-nowrap">9홀</th>
                                    <th className="text-center py-2 px-3 text-gray-900 font-bold whitespace-nowrap">18홀</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {gamePrices.weekend.filter((p: any) => p.stroke9 || p.hole9 || p.stroke18 || p.hole18).map((price: any, index: number) => (
                                    <tr key={`we-s-${price.id || index}`} className={`border-b border-gray-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                      <td className="py-2 px-3 text-gray-800 whitespace-nowrap text-center">{price.time || '-'}</td>
                                      <td className="py-2 px-3 text-center text-gray-800">{price.stroke9 || price.hole9 ? `${Number(price.stroke9 || price.hole9 || 0).toLocaleString()}` : '-'}</td>
                                      <td className="py-2 px-3 text-center text-gray-800">{price.stroke18 || price.hole18 ? `${Number(price.stroke18 || price.hole18 || 0).toLocaleString()}` : '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {(gamePrices.weekday.some((p: any) => p.pome9 || p.pome18) || gamePrices.weekend.some((p: any) => p.pome9 || p.pome18)) && (
                      <div className="space-y-4">
                        <h3 className="text-base font-bold text-purple-700">포썸</h3>
                        {gamePrices.weekday.some((p: any) => p.pome9 || p.pome18) && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">평일 포썸</h4>
                            <div className="border border-gray-200 rounded-lg overflow-x-auto">
                              <table className="w-full text-sm min-w-max">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-center py-2 px-3 text-gray-900 font-bold w-28 whitespace-nowrap">시간</th>
                                    <th className="text-center py-2 px-3 text-gray-900 font-bold whitespace-nowrap">9홀</th>
                                    <th className="text-center py-2 px-3 text-gray-900 font-bold whitespace-nowrap">18홀</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {gamePrices.weekday.filter((p: any) => p.pome9 || p.pome18).map((price: any, index: number) => (
                                    <tr key={`wp-${price.id || index}`} className={`border-b border-gray-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                      <td className="py-2 px-3 text-gray-800 whitespace-nowrap text-center">{price.time || '-'}</td>
                                      <td className="py-2 px-3 text-center text-gray-800">{price.pome9 ? `${Number(price.pome9).toLocaleString()}` : '-'}</td>
                                      <td className="py-2 px-3 text-center text-gray-800">{price.pome18 ? `${Number(price.pome18).toLocaleString()}` : '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {gamePrices.weekend.some((p: any) => p.pome9 || p.pome18) && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">주말/공휴일 포썸</h4>
                            <div className="border border-gray-200 rounded-lg overflow-x-auto">
                              <table className="w-full text-sm min-w-max">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-center py-2 px-3 text-gray-900 font-bold w-28 whitespace-nowrap">시간</th>
                                    <th className="text-center py-2 px-3 text-gray-900 font-bold whitespace-nowrap">9홀</th>
                                    <th className="text-center py-2 px-3 text-gray-900 font-bold whitespace-nowrap">18홀</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {gamePrices.weekend.filter((p: any) => p.pome9 || p.pome18).map((price: any, index: number) => (
                                    <tr key={`we-p-${price.id || index}`} className={`border-b border-gray-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                      <td className="py-2 px-3 text-gray-800 whitespace-nowrap text-center">{price.time || '-'}</td>
                                      <td className="py-2 px-3 text-center text-gray-800">{price.pome9 ? `${Number(price.pome9).toLocaleString()}` : '-'}</td>
                                      <td className="py-2 px-3 text-center text-gray-800">{price.pome18 ? `${Number(price.pome18).toLocaleString()}` : '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {(gamePrices.weekday.some((p: any) => p.practice || p.practice30 || p.practice60) || gamePrices.weekend.some((p: any) => p.practice || p.practice30 || p.practice60)) && (
                      <div className="space-y-4">
                        <h3 className="text-base font-bold text-blue-700">연습장</h3>
                        {gamePrices.weekday.some((p: any) => p.practice || p.practice30 || p.practice60) && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">평일 연습장</h4>
                            <div className="border border-gray-200 rounded-lg overflow-x-auto">
                              <table className="w-full text-sm min-w-max">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-center py-2 px-3 text-gray-900 font-bold w-28 whitespace-nowrap">시간</th>
                                    {store.type === '스크린골프' && <th className="text-center py-2 px-3 text-gray-900 font-bold whitespace-nowrap">연습장</th>}
                                    {(store.type === '파크골프' || store.type === '골프연습장') && (
                                      <>
                                        <th className="text-center py-2 px-3 text-gray-900 font-bold whitespace-nowrap">연습장 30분</th>
                                        <th className="text-center py-2 px-3 text-gray-900 font-bold whitespace-nowrap">연습장 60분</th>
                                      </>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {gamePrices.weekday.filter((p: any) => p.practice || p.practice30 || p.practice60).map((price: any, index: number) => (
                                    <tr key={`wpr-${price.id || index}`} className={`border-b border-gray-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                      <td className="py-2 px-3 text-gray-800 whitespace-nowrap text-center">{price.time || '-'}</td>
                                      {store.type === '스크린골프' && <td className="py-2 px-3 text-center text-gray-800">{price.practice ? `${Number(price.practice).toLocaleString()}` : '-'}</td>}
                                      {(store.type === '파크골프' || store.type === '골프연습장') && (
                                        <>
                                          <td className="py-2 px-3 text-center text-gray-800">{price.practice30 ? `${Number(price.practice30).toLocaleString()}` : '-'}</td>
                                          <td className="py-2 px-3 text-center text-gray-800">{price.practice60 ? `${Number(price.practice60).toLocaleString()}` : '-'}</td>
                                        </>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {gamePrices.weekend.some((p: any) => p.practice || p.practice30 || p.practice60) && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">주말/공휴일 연습장</h4>
                            <div className="border border-gray-200 rounded-lg overflow-x-auto">
                              <table className="w-full text-sm min-w-max">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-center py-2 px-3 text-gray-900 font-bold w-28 whitespace-nowrap">시간</th>
                                    {store.type === '스크린골프' && <th className="text-center py-2 px-3 text-gray-900 font-bold whitespace-nowrap">연습장</th>}
                                    {(store.type === '파크골프' || store.type === '골프연습장') && (
                                      <>
                                        <th className="text-center py-2 px-3 text-gray-900 font-bold whitespace-nowrap">연습장 30분</th>
                                        <th className="text-center py-2 px-3 text-gray-900 font-bold whitespace-nowrap">연습장 60분</th>
                                      </>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {gamePrices.weekend.filter((p: any) => p.practice || p.practice30 || p.practice60).map((price: any, index: number) => (
                                    <tr key={`wepr-${price.id || index}`} className={`border-b border-gray-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                      <td className="py-2 px-3 text-gray-800 whitespace-nowrap text-center">{price.time || '-'}</td>
                                      {store.type === '스크린골프' && <td className="py-2 px-3 text-center text-gray-800">{price.practice ? `${Number(price.practice).toLocaleString()}` : '-'}</td>}
                                      {(store.type === '파크골프' || store.type === '골프연습장') && (
                                        <>
                                          <td className="py-2 px-3 text-center text-gray-800">{price.practice30 ? `${Number(price.practice30).toLocaleString()}` : '-'}</td>
                                          <td className="py-2 px-3 text-center text-gray-800">{price.practice60 ? `${Number(price.practice60).toLocaleString()}` : '-'}</td>
                                        </>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'info' && (
              <div className="space-y-3">
                {/* 공지·한줄소개 컴팩트 블록 */}
                {(store.notice || store.description) && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50/80 overflow-hidden">
                    {store.notice && (
                      <div className="flex gap-3 px-3 py-2.5 border-b border-gray-200/80 last:border-b-0">
                        <span className="shrink-0 w-14 text-xs font-semibold text-amber-600">공지사항</span>
                        <p className="text-sm text-gray-700 whitespace-pre-line leading-snug flex-1 min-w-0">{store.notice}</p>
                      </div>
                    )}
                    {store.description && (
                      <div className="flex gap-3 px-3 py-2.5 border-b border-gray-200/80 last:border-b-0">
                        <span className="shrink-0 w-14 text-xs font-semibold text-[#00ACEE]">한줄소개</span>
                        <p className="text-sm text-gray-700 whitespace-pre-line leading-snug flex-1 min-w-0">{store.description}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 기본 정보 - 컴팩트 그리드 */}
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                    <span className="w-0.5 h-3.5 bg-[#00ACEE] rounded-full" /> 기본 정보
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {(storeInfo?.storeName || store.name) && (
                      <div className="col-span-2 flex gap-2 py-1.5 border-b border-gray-100">
                        <span className="text-gray-500 shrink-0 w-20">매장명</span>
                        <span className="font-medium text-gray-900 truncate">{storeInfo?.storeName || store.name}</span>
                      </div>
                    )}
                    {(storeInfo?.storeType || store.type) && (
                      <div className="flex gap-2 py-1.5 border-b border-gray-100">
                        <span className="text-gray-500 shrink-0 w-20">업장구분</span>
                        <span className="font-medium text-gray-900 truncate">{storeInfo?.storeType || store.type}</span>
                      </div>
                    )}
                    {(storeInfo?.platform || store.platform) && (
                      <div className="flex gap-2 py-1.5 border-b border-gray-100">
                        <span className="text-gray-500 shrink-0 w-20">플랫폼</span>
                        <span className="font-medium text-gray-900 truncate">{storeInfo?.platform || store.platform}</span>
                      </div>
                    )}
                    {(() => {
                      const mainAddress = storeInfo?.address || (store.location ? store.location.split('|')[0]?.trim() : '')
                      const detailAddress = storeInfo?.detailAddress || (store.location ? store.location.split('|')[1]?.trim() : '')
                      const fullAddress = [mainAddress, detailAddress].filter(Boolean).join(', ')
                      return fullAddress ? (
                        <div className="col-span-2 flex gap-2 py-1.5 border-b border-gray-100">
                          <span className="text-gray-500 shrink-0 w-20">주소</span>
                          <span className="font-medium text-gray-900 text-xs leading-snug">{fullAddress}</span>
                        </div>
                      ) : null
                    })()}
                    {(storeInfo?.parkingAvailable !== undefined || store.parking) && (
                      <div className="col-span-2 flex gap-2 py-1.5 border-b border-gray-100">
                        <span className="text-gray-500 shrink-0 w-20">주차</span>
                        <span className="font-medium text-gray-900">
                          {storeInfo?.parkingAvailable !== undefined ? (
                            <>
                              {storeInfo.parkingAvailable ? '가능' : '불가'}
                              {storeInfo.parkingAvailable && storeInfo.parkingSpaces > 0 && ` (${storeInfo.parkingSpaces}대)`}
                            </>
                          ) : (
                            (() => {
                              const parkingInfo = store.parking || ''
                              const isAvailable = !parkingInfo.includes('불가')
                              const spacesMatch = parkingInfo.match(/(\d+)대/)
                              const spaces = spacesMatch ? spacesMatch[1] : null
                              return (
                                <>
                                  {isAvailable ? '가능' : '불가'}
                                  {spaces && ` (${spaces}대)`}
                                </>
                              )
                            })()
                          )}
                        </span>
                      </div>
                    )}
                    {((storeInfo?.facilities && storeInfo.facilities.length > 0) || (store.facilities && store.facilities.length > 0)) && (
                      <div className="col-span-2 flex gap-2 py-1.5">
                        <span className="text-gray-500 shrink-0 w-20 pt-0.5">편의시설</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(storeInfo?.facilities || store.facilities || []).map((facility, index) => (
                            <span key={index} className="px-2 py-0.5 bg-sky-50 text-blue-700 rounded-md text-xs font-medium">
                              {facility}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 식음료 - 컴팩트 테이블 */}
                {(() => {
                  const allFoodItems = [...foodPrices.weekday, ...foodPrices.weekend]
                  const uniqueItems = allFoodItems.reduce((acc: any[], item: any) => {
                    const existing = acc.find((i: any) => i.name === item.name)
                    if (!existing) acc.push(item)
                    return acc
                  }, [])
                  return uniqueItems.length > 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-3">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-0.5 h-3.5 bg-[#00ACEE] rounded-full" /> 식음료
                      </h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="py-2 px-2.5 text-left text-xs font-semibold text-gray-600">품목</th>
                              <th className="py-2 px-2.5 text-right text-xs font-semibold text-gray-600 w-20">가격</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uniqueItems.map((item: any, index: number) => (
                              <tr key={item.id || index} className="border-t border-gray-100 even:bg-gray-50/50">
                                <td className="py-2 px-2.5 text-gray-900 font-medium">{item.name || '-'}</td>
                                <td className="py-2 px-2.5 text-right text-[#00ACEE] font-semibold">
                                  {item.price ? `${Number(item.price).toLocaleString()}원` : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-200 bg-white p-3">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-0.5 h-3.5 bg-[#00ACEE] rounded-full" /> 식음료
                      </h3>
                      <p className="text-xs text-gray-400 mt-1.5">등록된 식음료가 없습니다.</p>
                    </div>
                  )
                })()}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="text-center py-12">
                <p className="text-gray-500">아직 등록된 후기가 없습니다.</p>
              </div>
            )}
          </div>

          {/* 웹: 예약하기 버튼 맨 아래 배치 - 구분선·하단 여백 없음 (모바일 모달과 동일) */}
          <div className="hidden md:block flex-shrink-0 bg-white p-4 pb-0">
            <button
              onClick={() => setShowReservationModal(true)}
              className="w-full bg-[#00ACEE] text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-sky-200/40"
            >
              예약하기
            </button>
          </div>
        </div>

        {/* 모바일 전용: 예약하기 플로팅바 (하단 네비 위에 고정) */}
        <div
          className="md:hidden flex-shrink-0 w-full box-border fixed left-0 right-0 bottom-14 z-[70] px-4 pt-2"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={() => setShowReservationModal(true)}
            className="w-full bg-[#00ACEE] text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-sky-200/40"
          >
            예약하기
          </button>
        </div>

        {/* 예약 모달 - 날짜/시간/방은 모달 내에서 선택 */}
        {showReservationModal && (
          <ReservationModal
            store={store}
            selectedDate={selectedDate}
            selectedTime={null}
            selectedRoom={null}
            onClose={() => setShowReservationModal(false)}
            onComplete={() => {
              setShowReservationModal(false)
              // 예약 완료 후 availability 갱신
              setRefreshKey(prev => prev + 1)
              // 선택 초기화
              setSelectedRoom(null)
              setSelectedTime(null)
            }}
          />
        )}

        {/* 이미지 뷰어 */}
        {isImageViewerOpen && images.length > 0 && (
          <ImageViewer
            images={images}
            initialIndex={currentImageIndex}
            isOpen={isImageViewerOpen}
            onClose={() => setIsImageViewerOpen(false)}
            storeName={store.name}
          />
        )}
    </div>
  )
}
