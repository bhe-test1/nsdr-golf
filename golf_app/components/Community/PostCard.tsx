'use client'

import Link from 'next/link'
import { FiHeart, FiMessageCircle, FiEye } from 'react-icons/fi'

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
  isHot?: boolean
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

interface PostCardProps {
  post: Post
}

const categoryLabels: Record<string, string> = {
  all: '전체',
  review: '후기',
  tip: '팁',
  mate: '동반자',
  general: '자유',
}

const categoryColors: Record<string, string> = {
  review: 'bg-sky-100 text-sky-800',
  tip: 'bg-sky-100 text-sky-700',
  mate: 'bg-sky-100 text-sky-800',
  general: 'bg-gray-100 text-gray-700',
}

export default function PostCard({ post }: PostCardProps) {
  const createdAt = new Date(post.createdAt)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  const isNew = diffDays <= 2

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '. ')
  }

  const categoryColor = categoryColors[post.category] || categoryColors.general
  const views = 0

  return (
    <Link
      href={`/community/${post.id}`}
      className="block py-4 px-4"
    >
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          {/* 제목 + N 뱃지 */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
              {post.title}
            </h3>
            {isNew && (
              <span className="shrink-0 w-5 h-5 rounded bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                N
              </span>
            )}
          </div>

          {/* 내용 요약 */}
          <p className="text-gray-600 text-sm line-clamp-2 leading-snug mb-3">
            {post.content}
          </p>

          {/* 카테고리 + 반응 지표 */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span
              className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${categoryColor}`}
            >
              {categoryLabels[post.category] || '자유'}
            </span>
            <span className="flex items-center gap-1">
              <FiHeart className="w-3.5 h-3.5 text-rose-400" />
              {post.likes}
            </span>
            <span className="flex items-center gap-1">
              <FiMessageCircle className="w-3.5 h-3.5 text-sky-600" />
              {post.comments.length}
            </span>
            <span className="flex items-center gap-1">
              <FiEye className="w-3.5 h-3.5 text-gray-400" />
              {views}
            </span>
          </div>
        </div>

        {/* 작성자 · 날짜 (우측) */}
        <div className="shrink-0 text-right">
          <p className="text-xs text-gray-500 whitespace-nowrap">
            {post.author.name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">
            {formatDate(post.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  )
}
