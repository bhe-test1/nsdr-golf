'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiArrowRight, FiCalendar } from 'react-icons/fi'
import AdSenseHorizontal from '@/components/Common/AdSenseHorizontal'
import { NOTICES_FROM_POWER_ADMIN_DISABLED } from '@/lib/support'

interface Notice {
  id: string
  title: string
  content: string
  createdAt: string
  type: string
  isImportant: boolean
}

const categories = [
  { id: 'all', label: '전체' },
  { id: '공지', label: '공지' },
  { id: '이벤트', label: '이벤트' },
  { id: '업데이트', label: '업데이트' },
]

export default function NoticePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (NOTICES_FROM_POWER_ADMIN_DISABLED) {
      setNotices([])
      setIsLoading(false)
      return
    }
    const fetchNotices = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/notices')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || '공지사항 목록을 불러오는데 실패했습니다.')
        }

        setNotices(data.notices || [])
        setError(null)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '공지사항 목록을 불러오는데 실패했습니다.'
        console.error('공지사항 목록 조회 에러:', err)
        setError(message)
        setNotices([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotices()
  }, [])

  const filteredNotices =
    selectedCategory === 'all'
      ? notices
      : notices.filter((notice) => notice.type === selectedCategory)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/80 via-sky-50/70 to-sky-50/80">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">📢 공지사항</h1>
        </div>

        {/* 카테고리 탭 (비활성화 시 클릭 무반응) */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/90 border border-sky-200 mb-6 shadow-sm">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => !NOTICES_FROM_POWER_ADMIN_DISABLED && setSelectedCategory(category.id)}
              disabled={NOTICES_FROM_POWER_ADMIN_DISABLED}
              className={`flex-1 min-w-0 py-2.5 rounded-lg text-sm font-medium text-center transition-colors ${
                NOTICES_FROM_POWER_ADMIN_DISABLED ? 'cursor-default' : ''
              } ${
                selectedCategory === category.id
                  ? 'bg-sky-200 text-blue-900'
                  : 'text-gray-600 hover:bg-sky-50 hover:text-gray-900'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* 공지 목록 */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl bg-white/95 border border-sky-200 shadow-sm">
              <div className="w-8 h-8 rounded-full border-2 border-sky-200 border-t-sky-500 animate-spin" />
              <p className="mt-3 text-sm text-gray-500">공지사항을 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 px-4 rounded-xl bg-white/95 border border-sky-200 shadow-sm">
              <p className="text-red-600 font-medium text-sm mb-2">오류: {error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-blue-600 text-sm font-medium underline underline-offset-2"
              >
                다시 시도
              </button>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl bg-white/95 border border-sky-200 shadow-sm">
              <span className="text-3xl">📋</span>
              <p className="mt-2 text-gray-700 font-medium text-sm">공지사항이 없습니다</p>
            </div>
          ) : (
            filteredNotices.map((notice) => (
              <Link
                key={notice.id}
                href={`/support/${notice.id}`}
                className="block rounded-xl border border-sky-200 bg-white overflow-hidden shadow-sm py-5 px-5 transition-colors"
              >
                <div className="flex items-stretch justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 mb-1.5 line-clamp-1">
                      {notice.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 leading-snug mb-3">
                      {notice.content}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <FiCalendar className="w-3.5 h-3.5" />
                      <span>{formatDate(notice.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-center gap-2 flex-shrink-0">
                    {notice.isImportant && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-600">
                        중요
                      </span>
                    )}
                    <FiArrowRight className="w-6 h-6 text-blue-600" strokeWidth={2.5} />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* 수평형 디스플레이 광고 - 공지사항 목록 하단 */}
        <div className="mt-6 w-full min-h-[90px]">
          <AdSenseHorizontal />
        </div>
      </div>
    </div>
  )
}
