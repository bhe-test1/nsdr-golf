'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FiMapPin, FiStar, FiUsers, FiCamera } from 'react-icons/fi'
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
}

interface StoreListProps {
  initialStores: Store[]
}

export default function StoreList({ initialStores }: StoreListProps) {
  const [stores] = useState<Store[]>(initialStores)
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">인기 골프장</h2>
        <Link
          href="/stores"
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          전체보기 →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store) => (
          <Link
            key={store.id}
            href={`/stores/${store.id}`}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-200 cursor-pointer group"
          >
            <div 
              className="relative h-64 overflow-hidden cursor-pointer"
              onClick={(e) => handleImageClick(e, store)}
            >
              {store.imageUrl ? (
                <Image
                  src={store.imageUrl.includes(',') ? store.imageUrl.split(',')[0].trim() : store.imageUrl}
                  alt={store.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <FiCamera className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="p-5 space-y-3">
              <h3 className="text-xl font-bold text-gray-900 leading-tight line-clamp-2">{store.name}</h3>
              
              <div className="flex items-start gap-2 text-gray-600">
                <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                <div className="text-sm leading-relaxed">
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
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xl font-bold text-blue-600">
                  {formatPrice(store.price)}
                </span>
                <span className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">
                  예약하기 →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {stores.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">등록된 골프장이 없습니다.</p>
        </div>
      )}

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

