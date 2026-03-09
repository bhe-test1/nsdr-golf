'use client'

import { useState, useEffect } from 'react'
import PostCard from './PostCard'

interface Post {
  id: string
  title: string
  content: string
  author: {
    id: string
    name: string
    email: string
  }
  category: string
  createdAt: string
  updatedAt: string
  likes: number
  comments: Array<{
    id: string
    content: string
    author: {
      id: string
      name: string
    }
    createdAt: string
  }>
}

type SortType = 'latest' | 'popular' | 'views' | 'comments'

interface PostListProps {
  category?: string
  sort?: SortType
  /** 내가 쓴 글 목록일 때 전달 */
  userId?: string
  /** 빈 목록일 때 표시할 메시지 (userId 사용 시 등) */
  emptyTitle?: string
  emptySubtitle?: string
  /** true면 API 호출 없이 빈 상태만 표시 */
  disabled?: boolean
}

export default function PostList({ category = 'all', sort = 'latest', userId, emptyTitle, emptySubtitle, disabled = false }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(!disabled)

  useEffect(() => {
    if (disabled) {
      setIsLoading(false)
      return
    }
    const fetchPosts = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (userId) params.set('userId', userId)
        else params.set('category', category)
        const response = await fetch(`/api/community/posts?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setPosts(data)
        }
      } catch (error) {
        console.error('게시글 목록을 불러오는데 실패했습니다:', error)
        setPosts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [category, userId, disabled])

  const sortedPosts = [...posts].sort((a, b) => {
    if (sort === 'popular') return (b.likes ?? 0) - (a.likes ?? 0)
    if (sort === 'comments') return b.comments.length - a.comments.length
    if (sort === 'views') return 0
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-sky-200 border-t-sky-500 animate-spin" />
        <p className="mt-3 text-sm text-gray-500">불러오는 중...</p>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-xl bg-white/95 border border-sky-200 shadow-sm">
        <span className="text-3xl">📝</span>
        <p className="mt-2 text-gray-700 font-medium text-sm">{emptyTitle ?? '아직 게시글이 없어요'}</p>
        <p className="text-gray-500 text-xs mt-0.5">{emptySubtitle ?? '첫 글을 작성해 보세요!'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sortedPosts.map((post, index) => (
        <div
          key={post.id}
          className="rounded-xl border border-sky-200 bg-white overflow-hidden shadow-sm animate-fadeIn"
          style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'backwards' }}
        >
          <PostCard post={post} />
        </div>
      ))}
    </div>
  )
}
