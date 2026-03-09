'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiArrowLeft, FiCalendar } from 'react-icons/fi'
import { NOTICES_FROM_POWER_ADMIN_DISABLED } from '@/lib/support'

interface Notice {
  id: string
  title: string
  content: string
  createdAt: string
  type: string
  isImportant: boolean
}

export default function NoticeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const noticeId = params.id as string
  const [notice, setNotice] = useState<Notice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (NOTICES_FROM_POWER_ADMIN_DISABLED) {
      router.replace('/support')
      return
    }
    const fetchNotice = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/notices/${noticeId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || '공지사항을 불러오는데 실패했습니다.')
        }

        setNotice(data)
        setError(null)
      } catch (err: any) {
        console.error('공지사항 상세 조회 에러:', err)
        setError(err.message || '공지사항을 불러오는데 실패했습니다.')
        setNotice(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (noticeId) {
      fetchNotice()
    }
  }, [noticeId, router])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50/80 via-sky-50/70 to-sky-50/80">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-200 border-t-sky-500 mx-auto mb-4"></div>
            <p className="text-gray-500">공지사항을 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !notice) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50/80 via-sky-50/70 to-sky-50/80">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">{error || '공지사항을 찾을 수 없습니다.'}</p>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <FiArrowLeft />
              목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/80 via-sky-50/70 to-sky-50/80">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 뒤로가기 버튼 */}
        <Link
          href="/support"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition"
        >
          <FiArrowLeft />
          <span>목록으로</span>
        </Link>

        {/* 공지사항 상세 */}
        <article className="bg-white border border-sky-200 rounded-xl p-8 shadow-sm">
          {/* 헤더 */}
          <div className="mb-6 pb-6 border-b border-sky-100">
            {notice.isImportant && (
              <div className="mb-4">
                <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded">
                  중요
                </span>
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900">{notice.title}</h1>
          </div>

          {/* 내용 */}
          <div className="prose max-w-none">
            <div className="text-gray-700 whitespace-pre-line leading-relaxed">
              {notice.content}
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
