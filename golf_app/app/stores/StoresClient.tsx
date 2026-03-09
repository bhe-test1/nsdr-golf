'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import StoreGrid from '@/components/Stores/StoreGrid'
import StoreFilters from '@/components/Stores/StoreFilters'
import type { Store } from '@/lib/types'

function StoreFiltersWrapper() {
  return <StoreFilters />
}

function StoresContent() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || undefined
  const location = searchParams.get('location') || undefined
  const type = searchParams.get('type') || undefined
  
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStores = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (q) params.append('q', q)
        if (location) params.append('location', location)
        if (type) params.append('type', type)
        
        const response = await fetch(`/api/stores?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setStores(data)
        }
      } catch (error) {
        console.error('매장 목록을 불러오는데 실패했습니다:', error)
        setStores([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchStores()
  }, [q, location, type])

  if (isLoading) {
    return (
      <>
        <Suspense fallback={<div className="bg-white rounded-lg shadow-md p-6 mb-6 h-32 animate-pulse"></div>}>
          <StoreFiltersWrapper />
        </Suspense>
        <div className="text-center py-12">로딩 중...</div>
      </>
    )
  }

  return (
    <>
      <Suspense fallback={<div className="bg-white rounded-lg shadow-md p-6 mb-6 h-32 animate-pulse"></div>}>
        <StoreFiltersWrapper />
      </Suspense>
      <StoreGrid stores={stores} />
    </>
  )
}

export default function StoresClient() {
  return (
    <Suspense fallback={
      <>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 h-32 animate-pulse"></div>
        <div className="text-center py-12">로딩 중...</div>
      </>
    }>
      <StoresContent />
    </Suspense>
  )
}

