'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiArrowLeft } from 'react-icons/fi'
import { COMMUNITY_FEATURE_DISABLED } from '@/lib/community'

export default function WritePostPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (COMMUNITY_FEATURE_DISABLED) {
      router.replace('/community')
    }
  }, [router])

  if (COMMUNITY_FEATURE_DISABLED) {
    return null
  }

  const categories = [
    { value: 'review', label: '후기' },
    { value: 'tip', label: '팁' },
    { value: 'mate', label: '동반자' },
    { value: 'general', label: '자유' },
  ]

  // 로그인 체크
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
    } else {
      alert('로그인이 필요합니다.')
      router.push('/login')
    }
    setIsCheckingAuth(false)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('로그인이 필요합니다.')
        router.push('/login')
        return
      }

      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
        }),
      })

      if (response.ok) {
        alert('게시글이 성공적으로 등록되었습니다.')
        router.push('/community')
      } else {
        const data = await response.json()
        if (response.status === 401) {
          alert('로그인이 필요합니다.')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
        } else {
          alert(data.message || '게시글 작성에 실패했습니다.')
        }
      }
    } catch (error) {
      console.error('게시글 작성 에러:', error)
      alert('게시글 작성 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">인증 확인 중...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft />
        <span>목록으로</span>
      </button>

      {/* 글쓰기 폼 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">글쓰기</h1>

        <form onSubmit={handleSubmit}>
          {/* 카테고리 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리
            </label>
            <div className="flex items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    category === cat.value
                      ? 'bg-[#00ACEE] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 제목 입력 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00ACEE] focus:border-transparent"
              required
            />
          </div>

          {/* 내용 입력 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00ACEE] focus:border-transparent resize-none"
              rows={15}
              required
            />
          </div>

          {/* 버튼 */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-[#00ACEE] text-white rounded-lg hover:bg-[#0088c2] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '작성 중...' : '작성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
