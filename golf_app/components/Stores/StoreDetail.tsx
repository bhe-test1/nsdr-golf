'use client'

import { useState, useEffect } from 'react'
import { FiMapPin, FiStar, FiHeart, FiShare2, FiCamera, FiX } from 'react-icons/fi'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ImageViewer from '@/components/Common/ImageViewer'

interface Store {
  id: string
  name: string
  location: string
  latitude?: number | null
  longitude?: number | null
  imageUrl?: string | null
  price?: number | null
  rating?: number | null
  reviewCount?: number | null
  description?: string | null
  news?: string | null
  notice?: string | null
  parking?: string | null
  type?: string | null
  facilities?: string[]
  totalRooms?: number
  platform?: string
  businessNumber?: string
  openDate?: string
}

interface StoreDetailProps {
  store: Store
}

type MobileTab = 'instant' | 'info' | 'reviews'

export default function StoreDetail({ store }: StoreDetailProps) {
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>('instant')
  const [gamePrices, setGamePrices] = useState<{ weekday: any[]; weekend: any[] }>({ weekday: [], weekend: [] })

  // imageUrl을 배열로 변환 (콤마로 구분된 여러 이미지일 수 있음)
  const images = store.imageUrl 
    ? (store.imageUrl.includes(',') ? store.imageUrl.split(',').map(img => img.trim()) : [store.imageUrl])
    : []

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        setIsLoggedIn(!!token)
        
        if (token) {
          const response = await fetch(`/api/favorites/${store.id}`)
          if (response.ok) {
            const data = await response.json()
            setIsFavorite(data.isFavorite)
          }
        }
      } catch (error) {
        console.error('인증 상태 확인에 실패했습니다:', error)
      }
    }

    checkAuth()
  }, [store.id])

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch(`/api/stores/${store.id}/price`)
        if (res.ok) {
          const data = await res.json()
          setGamePrices(data.gamePrices || { weekday: [], weekend: [] })
        }
      } catch (e) {
        console.error('가격 조회 실패:', e)
      }
    }
    fetchPrices()
  }, [store.id])

  const toggleFavorite = async () => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    try {
      const method = isFavorite ? 'DELETE' : 'POST'
      const response = await fetch(`/api/favorites/${store.id}`, {
        method,
      })
      if (response.ok) {
        setIsFavorite(!isFavorite)
      }
    } catch (error) {
      console.error('즐겨찾기 처리에 실패했습니다:', error)
    }
  }

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return '가격 문의'
    return `${price.toLocaleString()}원`
  }

  const locationParts = store.location ? store.location.split(/[|,]/).map((p: string) => p.trim()).filter(Boolean) : []
  const locationText = locationParts.length > 1 ? locationParts.join(', ') : store.location || ''

  return (
    <>
      {/* 모바일 전용: 이미지처럼 탭 + 가격 테이블 + 하단 예약하기 */}
      <div className="md:hidden bg-white min-h-screen flex flex-col pb-24">
        {/* 상단 이미지 + 닫기 */}
        <div className="relative h-[28vh] min-h-[160px] bg-gray-200 shrink-0">
          {images.length > 0 ? (
            <Image src={images[0]} alt={store.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <FiCamera className="w-16 h-16 text-gray-400" />
            </div>
          )}
          <Link
            href="/stores"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white"
            aria-label="닫기"
          >
            <FiX className="w-5 h-5" />
          </Link>
        </div>

        <div className="px-4 pt-3 pb-2 shrink-0">
          <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
          <div className="flex items-start gap-2 mt-1">
            <FiMapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
            <span className="text-sm text-gray-600 flex-1">{locationText}</span>
            {store.platform && (
              <span className="shrink-0 text-xs text-gray-500">{store.platform}</span>
            )}
          </div>
        </div>

        {/* 탭: 즉시확정 | 매장 정보 | 후기 */}
        <div className="flex border-b border-gray-200 px-4 shrink-0">
          {[
            { id: 'instant' as MobileTab, label: '즉시확정' },
            { id: 'info' as MobileTab, label: '매장 정보' },
            { id: 'reviews' as MobileTab, label: '후기' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${
                mobileTab === tab.id
                  ? 'border-[#00ACEE] text-[#00ACEE]'
                  : 'border-transparent text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {mobileTab === 'instant' && (
            <div className="space-y-6">
              {gamePrices.weekday.some((p: any) => p.stroke9 || p.hole9 || p.stroke18 || p.hole18) && (
                <div>
                  <h3 className="text-base font-bold text-purple-700 mb-2">스트로크</h3>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">평일 스트로크</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-2 px-3 text-center font-semibold text-gray-900 w-28">시간</th>
                          <th className="py-2 px-3 text-center font-semibold text-gray-900">9홀</th>
                          <th className="py-2 px-3 text-center font-semibold text-gray-900">18홀</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gamePrices.weekday.filter((p: any) => p.stroke9 || p.hole9 || p.stroke18 || p.hole18).map((p: any, i: number) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="py-2 px-3 text-center text-gray-800">{p.time || '-'}</td>
                            <td className="py-2 px-3 text-center text-gray-800">{p.stroke9 || p.hole9 ? Number(p.stroke9 || p.hole9).toLocaleString() : '-'}</td>
                            <td className="py-2 px-3 text-center text-gray-800">{p.stroke18 || p.hole18 ? Number(p.stroke18 || p.hole18).toLocaleString() : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {gamePrices.weekday.some((p: any) => p.pome9 || p.pome18) && (
                <div>
                  <h3 className="text-base font-bold text-purple-700 mb-2">포썸</h3>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">평일 포썸</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-2 px-3 text-center font-semibold text-gray-900 w-28">시간</th>
                          <th className="py-2 px-3 text-center font-semibold text-gray-900">9홀</th>
                          <th className="py-2 px-3 text-center font-semibold text-gray-900">18홀</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gamePrices.weekday.filter((p: any) => p.pome9 || p.pome18).map((p: any, i: number) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="py-2 px-3 text-center text-gray-800">{p.time || '-'}</td>
                            <td className="py-2 px-3 text-center text-gray-800">{p.pome9 ? Number(p.pome9).toLocaleString() : '-'}</td>
                            <td className="py-2 px-3 text-center text-gray-800">{p.pome18 ? Number(p.pome18).toLocaleString() : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {gamePrices.weekday.some((p: any) => p.practice || p.practice30 || p.practice60) && (
                <div>
                  <h3 className="text-base font-bold text-purple-700 mb-2">연습장</h3>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">평일 연습장</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-2 px-3 text-center font-semibold text-gray-900 w-28">시간</th>
                          <th className="py-2 px-3 text-center font-semibold text-gray-900">연습장</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gamePrices.weekday.filter((p: any) => p.practice || p.practice30 || p.practice60).map((p: any, i: number) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="py-2 px-3 text-center text-gray-800">{p.time || '-'}</td>
                            <td className="py-2 px-3 text-center text-gray-800">
                              {(p.practice || p.practice30 || p.practice60) ? Number(p.practice || p.practice30 || p.practice60).toLocaleString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {!gamePrices.weekday.length && (
                <p className="text-sm text-gray-500 py-4">등록된 가격 정보가 없습니다.</p>
              )}
            </div>
          )}

          {mobileTab === 'info' && (
            <div className="space-y-4 text-sm">
              {store.notice && (
                <div>
                  <span className="font-semibold text-amber-600">공지사항</span>
                  <p className="mt-1 text-gray-700 whitespace-pre-line">{store.notice}</p>
                </div>
              )}
              {store.description && (
                <div>
                  <span className="font-semibold text-[#00ACEE]">한줄소개</span>
                  <p className="mt-1 text-gray-700 whitespace-pre-line">{store.description}</p>
                </div>
              )}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">기본 정보</h3>
                <div className="space-y-1.5">
                  {store.totalRooms != null && <div className="flex"><span className="text-gray-500 w-20 shrink-0">총룸</span><span>{store.totalRooms}개</span></div>}
                  {store.platform && <div className="flex"><span className="text-gray-500 w-20 shrink-0">플랫폼</span><span>{store.platform}</span></div>}
                  {store.businessNumber && <div className="flex"><span className="text-gray-500 w-20 shrink-0">사업자번호</span><span>{store.businessNumber}</span></div>}
                  {store.openDate && <div className="flex"><span className="text-gray-500 w-20 shrink-0">오픈일</span><span>{store.openDate}</span></div>}
                  {store.facilities?.length ? (
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-gray-500 shrink-0">편의시설</span>
                      {store.facilities.map((f, i) => (
                        <span key={i} className="px-2 py-0.5 bg-sky-50 text-blue-700 rounded text-xs">{f}</span>
                      ))}
                    </div>
                  ) : null}
                  {store.parking && <div className="flex"><span className="text-gray-500 w-20 shrink-0">주차</span><span>{store.parking}</span></div>}
                </div>
              </div>
            </div>
          )}

          {mobileTab === 'reviews' && (
            <p className="text-sm text-gray-500 py-4">후기 기능은 준비 중입니다.</p>
          )}
        </div>

        {/* 하단 예약하기 버튼 */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <Link
            href="/stores"
            className="block w-full py-3.5 rounded-xl bg-[#00ACEE] text-white text-center font-semibold text-base hover:bg-[#0088c2] transition"
          >
            예약하기
          </Link>
        </div>
      </div>

      {/* 데스크톱: 기존 레이아웃 */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
      <div 
        className="relative h-40 md:h-96 bg-gray-200 cursor-pointer"
        onClick={() => {
          if (images.length > 0) {
            setIsImageViewerOpen(true)
          }
        }}
      >
        {images.length > 0 ? (
          <Image
            src={images[0]}
            alt={store.name}
            fill
            className="object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <FiCamera className="w-20 h-20 text-gray-400" />
          </div>
        )}
      </div>

      <div className="p-4 md:p-6">
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-2">{store.name}</h1>
            <div className="flex items-center text-gray-600 mb-1 md:mb-2 text-sm md:text-base">
              <FiMapPin className="mr-1" />
              <div>
                {store.location ? (() => {
                  // 파이프(|) 또는 쉼표(,)로 주소와 상세주소 분리
                  const parts = store.location.split(/[|,]/).map(part => part.trim()).filter(part => part)
                  if (parts.length > 1) {
                    return (
                      <>
                        <div>{parts[0]}</div>
                        <div>{parts.slice(1).join(', ')}</div>
                      </>
                    )
                  }
                  return <div>{store.location}</div>
                })() : ''}
              </div>
            </div>
            {store.rating && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <FiStar className="text-yellow-400 fill-yellow-400" />
                  <span className="ml-1 font-semibold">{store.rating.toFixed(1)}</span>
                </div>
                {store.reviewCount && (
                  <span className="text-sm text-gray-500">
                    ({store.reviewCount}개 리뷰)
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              onClick={toggleFavorite}
              className={`p-1.5 md:p-2 rounded-full ${
                isFavorite
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } transition`}
            >
              <FiHeart className={isFavorite ? 'fill-current' : ''} />
            </button>
            <button className="p-1.5 md:p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
              <FiShare2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="border-t pt-3 mt-3 md:pt-4 md:mt-4 space-y-3">
          {/* 가격 - 컴팩트 */}
          <div className="rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-700 uppercase tracking-wider">가격</span>
            <p className="text-lg md:text-xl font-bold text-[#00ACEE]">{formatPrice(store.price)}</p>
          </div>

          {/* 공지·소개 컴팩트 블록 */}
          {(store.notice || store.description) && (
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 overflow-hidden">
              {store.notice && (
                <div className="flex gap-3 px-3 py-2.5 border-b border-gray-200/80">
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

          {/* 매장 기본 정보 - 컴팩트 그리드 */}
          {((store.facilities && store.facilities.length > 0) || store.totalRooms || store.platform || store.businessNumber || store.openDate) && (
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <span className="w-0.5 h-3.5 bg-[#00ACEE] rounded-full" /> 기본 정보
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {store.totalRooms !== undefined && (
                  <div className="flex gap-2 py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 shrink-0 w-20">총 룸</span>
                    <span className="font-medium text-gray-900">{store.totalRooms}개</span>
                  </div>
                )}
                {store.platform && (
                  <div className="flex gap-2 py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 shrink-0 w-20">플랫폼</span>
                    <span className="font-medium text-gray-900 truncate">{store.platform}</span>
                  </div>
                )}
                {store.businessNumber && (
                  <div className="col-span-2 flex gap-2 py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 shrink-0 w-20">사업자번호</span>
                    <span className="font-medium text-gray-900 text-xs break-all">{store.businessNumber}</span>
                  </div>
                )}
                {store.openDate && (
                  <div className="flex gap-2 py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 shrink-0 w-20">오픈일</span>
                    <span className="font-medium text-gray-900">{store.openDate}</span>
                  </div>
                )}
                {(store.facilities && store.facilities.length > 0) && (
                  <div className="col-span-2 flex gap-2 py-1.5">
                    <span className="text-gray-500 shrink-0 w-20 pt-0.5">편의시설</span>
                    <div className="flex flex-wrap gap-1.5">
                      {store.facilities.map((facility, index) => (
                        <span key={index} className="px-2 py-0.5 bg-sky-50 text-blue-700 rounded-md text-xs font-medium">
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {store.parking && (
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="flex gap-3">
                <span className="shrink-0 w-16 text-xs font-semibold text-sky-600">주차</span>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-snug flex-1">{store.parking}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* 이미지 뷰어 */}
      {isImageViewerOpen && images.length > 0 && (
        <ImageViewer
          images={images}
          initialIndex={0}
          isOpen={isImageViewerOpen}
          onClose={() => setIsImageViewerOpen(false)}
          storeName={store.name}
        />
      )}
    </>
  )
}

