'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import MapView from '@/components/Home/MapView'

const VALID_TABS = ['screen', 'range', 'field']

export default function HomePageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab')
  const tab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'screen'

  useEffect(() => {
    if (typeof window === 'undefined') return
    const isMobile = window.innerWidth < 768
    if (!isMobile) return
    const currentTab = searchParams.get('tab')
    if (!currentTab || !VALID_TABS.includes(currentTab)) {
      const next = new URLSearchParams(window.location.search)
      next.set('tab', 'screen')
      router.replace('/?' + next.toString(), { scroll: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- 모바일 첫 진입 시 한 번만
  }, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div className="bg-white h-full overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0">
        <MapView initialTab={tab} />
      </div>
    </div>
  )
}
