'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CommunitySidebar from '@/components/Community/CommunitySidebar'
import PostList from '@/components/Community/PostList'
import { COMMUNITY_FEATURE_DISABLED } from '@/lib/community'

export default function MyPostsPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [user, setUser] = useState<{ id: string; name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (COMMUNITY_FEATURE_DISABLED) {
      router.replace('/community')
      return
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      setIsLoading(false)
      return
    }
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const data = await response.json()
          setUser(data)
        }
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [])

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
            <h1 className="text-xl font-semibold text-gray-900 mb-4">내가 쓴 글</h1>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-lime-200 border-t-lime-500 animate-spin" />
                <p className="mt-3 text-sm text-gray-500">불러오는 중...</p>
              </div>
            ) : !user ? (
              <div className="text-center py-12 px-4 rounded-xl bg-white/95 border border-lime-200 shadow-sm">
                <span className="text-3xl">📝</span>
                <p className="mt-2 text-gray-700 font-medium text-sm">내가 쓴 글이 없습니다</p>
                <p className="text-gray-500 text-xs mt-0.5">첫 글을 작성해 보세요!</p>
              </div>
            ) : (
              <PostList
                userId={user.id}
                sort="latest"
                emptyTitle="작성한 글이 없습니다"
                emptySubtitle="첫 글을 작성해 보세요!"
              />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
