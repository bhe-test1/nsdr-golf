'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CommunitySidebar from '@/components/Community/CommunitySidebar'
import { COMMUNITY_FEATURE_DISABLED } from '@/lib/community'

export default function MyCommentsPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    if (COMMUNITY_FEATURE_DISABLED) {
      router.replace('/community')
    }
  }, [router])

  if (COMMUNITY_FEATURE_DISABLED) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-sky-50/40 to-sky-50/50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex gap-8">
          <CommunitySidebar
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
          <main className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">내가 쓴 댓글</h1>

            <div className="text-center py-12 px-4 rounded-xl bg-white/95 border border-lime-200 shadow-sm">
              <span className="text-3xl">💬</span>
              <p className="mt-2 text-gray-700 font-medium text-sm">내가 쓴 댓글이 없습니다</p>
              <p className="text-gray-500 text-xs mt-0.5">첫 댓글을 작성해 보세요!</p>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
