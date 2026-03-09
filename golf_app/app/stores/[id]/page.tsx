'use client'

import { useState, useEffect } from 'react'
import { notFound, useParams, useRouter } from 'next/navigation'
import StoreDetail from '@/components/Stores/StoreDetail'
import ReservationForm from '@/components/Reservations/ReservationForm'
import StoreDetailModal from '@/components/Home/StoreDetailModal'
import type { Store } from '@/lib/types'

export default function StoreDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [store, setStore] = useState<Store | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStore = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/stores/${id}`)
        if (response.ok) {
          const data = await response.json()
          setStore(data)
        } else if (response.status === 404) {
          notFound()
        }
      } catch (error) {
        console.error('매장 정보를 불러오는데 실패했습니다:', error)
        notFound()
      } finally {
        setIsLoading(false)
      }
    }

    fetchStore()
  }, [id])

  if (isLoading) {
    return (
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="text-center py-8 md:py-12">로딩 중...</div>
      </div>
    )
  }

  if (!store) {
    notFound()
  }

  return (
    <>
      {/* 모바일: StoreDetailModal 전체화면 (flex + min-h-0으로 스크롤 끝까지 동작) */}
      <div className="md:hidden fixed inset-0 z-[60] flex flex-col min-h-0 bg-white overflow-hidden">
        <StoreDetailModal
          store={store}
          initialDetailData={null}
          onClose={() => router.push('/stores')}
        />
      </div>

      {/* 데스크톱: 기존 매장 상세 + 예약 폼 */}
      <div className="hidden md:block container mx-auto px-3 md:px-4 py-4 md:py-8">
        <StoreDetail store={store} />
        <div className="mt-4 md:mt-8">
          <ReservationForm storeId={store.id} />
        </div>
      </div>
    </>
  )
}

