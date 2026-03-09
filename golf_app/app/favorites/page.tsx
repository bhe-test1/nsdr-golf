'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiMapPin, FiStar, FiHeart, FiCamera } from 'react-icons/fi'
import Image from 'next/image'
import ImageViewer from '@/components/Common/ImageViewer'

interface Favorite {
  id: string
  store: {
    id: string
    name: string
    location: string
    imageUrl?: string | null
    price?: number | null
    rating?: number | null
    reviewCount?: number | null
  }
}

export default function FavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [viewerImages, setViewerImages] = useState<string[]>([])
  const [viewerStoreName, setViewerStoreName] = useState('')

  useEffect(() => {
    const fetchFavorites = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/favorites')
        if (response.ok) {
          const data = await response.json()
          setFavorites(data)
        }
      } catch (error) {
        console.error('즐겨찾기를 불러오는데 실패했습니다:', error)
        setFavorites([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchFavorites()
  }, [])

  const handleRemoveFavorite = async (storeId: string) => {
    try {
      const response = await fetch(`/api/favorites/${storeId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setFavorites(favorites.filter((fav) => fav.store.id !== storeId))
      }
    } catch (error) {
      console.error('즐겨찾기 삭제에 실패했습니다:', error)
    }
  }

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return '가격 문의'
    return `${price.toLocaleString()}원`
  }

  const handleImageClick = (e: React.MouseEvent, favorite: Favorite) => {
    e.preventDefault()
    e.stopPropagation()
    if (favorite.store.imageUrl) {
      const images = favorite.store.imageUrl.includes(',') 
        ? favorite.store.imageUrl.split(',').map(img => img.trim()) 
        : [favorite.store.imageUrl]
      setViewerImages(images)
      setViewerStoreName(favorite.store.name)
      setIsImageViewerOpen(true)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">즐겨찾기</h1>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FiHeart className="mx-auto text-gray-400 text-6xl mb-4" />
          <p className="text-gray-500 text-lg mb-4">즐겨찾기한 골프장이 없습니다.</p>
          <Link
            href="/stores"
            className="inline-block px-6 py-3 bg-[#00ACEE] text-white rounded-lg hover:bg-[#0088c2] transition"
          >
            골프장 찾기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
            >
              <Link href={`/stores/${favorite.store.id}`}>
                <div 
                  className="relative h-48 bg-gray-200 cursor-pointer"
                  onClick={(e) => handleImageClick(e, favorite)}
                >
                  {favorite.store.imageUrl ? (
                    <Image
                      src={favorite.store.imageUrl.includes(',') ? favorite.store.imageUrl.split(',')[0].trim() : favorite.store.imageUrl}
                      alt={favorite.store.name}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <FiCamera className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Link
                    href={`/stores/${favorite.store.id}`}
                    className="text-xl font-bold text-gray-800 hover:text-blue-600 transition"
                  >
                    {favorite.store.name}
                  </Link>
                  <button
                    onClick={() => handleRemoveFavorite(favorite.store.id)}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <FiHeart className="fill-current" />
                  </button>
                </div>

                <div className="flex items-center text-gray-600 mb-2">
                  <FiMapPin className="mr-1" />
                  <span className="text-sm">{favorite.store.location}</span>
                </div>

                {favorite.store.rating && (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex items-center">
                      <FiStar className="text-yellow-400 fill-yellow-400" />
                      <span className="ml-1 font-semibold">
                        {favorite.store.rating.toFixed(1)}
                      </span>
                    </div>
                    {favorite.store.reviewCount && (
                      <span className="text-sm text-gray-500">
                        ({favorite.store.reviewCount}개 리뷰)
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4">
                  <span className="text-lg font-bold text-blue-600">
                    {formatPrice(favorite.store.price)}
                  </span>
                  <Link
                    href={`/stores/${favorite.store.id}`}
                    className="text-sm text-gray-500 hover:text-blue-600 transition"
                  >
                    예약하기 →
                  </Link>
                </div>
              </div>
            </div>
          ))}
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

