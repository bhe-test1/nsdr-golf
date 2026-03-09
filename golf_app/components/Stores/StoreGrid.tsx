'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FiMapPin, FiStar, FiCamera } from 'react-icons/fi'
import Image from 'next/image'
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
  platform?: string | null
  type?: string | null
}

interface StoreGridProps {
  stores: Store[]
}

export default function StoreGrid({ stores }: StoreGridProps) {
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [viewerImages, setViewerImages] = useState<string[]>([])
  const [viewerStoreName, setViewerStoreName] = useState('')

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return '가격 문의'
    return `${price.toLocaleString()}원`
  }

  const handleImageClick = (e: React.MouseEvent, store: Store) => {
    e.preventDefault()
    e.stopPropagation()
    if (store.imageUrl) {
      const images = store.imageUrl.includes(',') 
        ? store.imageUrl.split(',').map(img => img.trim()) 
        : [store.imageUrl]
      setViewerImages(images)
      setViewerStoreName(store.name)
      setIsImageViewerOpen(true)
    }
  }

  if (stores.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">검색 결과가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {stores.map((store, index) => (
        <Link
          key={store.id}
          href={`/stores/${store.id}`}
          className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-200 cursor-pointer group flex md:flex-col"
        >
          {/* 모바일: 이미지 좌측 작게 | 데스크톱: 이미지 상단 */}
          <div 
            className="relative w-28 h-28 shrink-0 md:w-full md:h-48 lg:h-64 overflow-hidden cursor-pointer"
            onClick={(e) => handleImageClick(e, store)}
          >
            {store.imageUrl ? (
              <Image
                src={store.imageUrl.includes(',') ? store.imageUrl.split(',')[0].trim() : store.imageUrl}
                alt={store.name}
                fill
                sizes="(max-width: 768px) 112px, (max-width: 1024px) 50vw, 33vw"
                loading={index === 0 ? 'eager' : 'lazy'}
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <FiCamera className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="p-3 md:p-5 space-y-2 md:space-y-3 flex-1 min-w-0">
            {(store.platform || store.type) && (
              <span className="text-xs text-gray-500">{store.platform || store.type}</span>
            )}
            <h3 className="text-base md:text-xl font-bold text-gray-900 leading-tight line-clamp-2">{store.name}</h3>
            
            <div className="flex items-start gap-1.5 md:gap-2 text-gray-600">
              <FiMapPin className="w-3.5 h-3.5 md:w-4 md:h-4 mt-0.5 flex-shrink-0 text-gray-400" />
              <div className="text-xs md:text-sm leading-relaxed line-clamp-2">
                {store.location ? (() => {
                  // 파이프(|) 또는 쉼표(,)로 주소와 상세주소 분리
                  // 미리보기에서는 기본 주소만 표시 (상세주소 제외)
                  const parts = store.location.split(/[|,]/).map(part => part.trim()).filter(part => part)
                  return <div>{parts[0] || store.location}</div>
                })() : ''}
              </div>
            </div>
            
            {store.rating && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <FiStar className="text-yellow-400 fill-yellow-400 w-4 h-4" />
                  <span className="font-semibold text-gray-900">{store.rating.toFixed(1)}</span>
                </div>
                {store.reviewCount && (
                  <span className="text-sm text-gray-500">
                    리뷰 {store.reviewCount}개
                  </span>
                )}
              </div>
            )}
            
            {/* 핸드폰에서는 숨김: 가격 문의 · 예약하기 */}
            <div className="hidden md:flex items-center justify-between pt-2 md:pt-3 border-t border-gray-100">
              <span className="text-base md:text-xl font-bold text-[#00ACEE]">
                {formatPrice(store.price)}
              </span>
              <span className="text-xs md:text-sm text-gray-500 group-hover:text-[#00ACEE] transition-colors">
                예약하기 →
              </span>
            </div>
          </div>
        </Link>
      ))}

      {/* 이미지 뷰어 */}
      {isImageViewerOpen && viewerImages.length > 0 && (
        <ImageViewer
          images={viewerImages}
          initialIndex={0}
          isOpen={isImageViewerOpen}
          onClose={() => setIsImageViewerOpen(false)}
          storeName={viewerStoreName}
        />
      )}
    </div>
  )
}

