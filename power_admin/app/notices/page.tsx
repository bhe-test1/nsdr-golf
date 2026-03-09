'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import PowerAdminLayout from '@/components/Layout/PowerAdminLayout'
import { FiPlus, FiEdit, FiTrash2, FiBell } from 'react-icons/fi'
import { NOTICE_WRITE_DISABLED } from '@/lib/notices'

interface Notice {
  id: string
  title: string
  content: string
  type?: string
  targetAudience?: string
  createdAt: string
  updatedAt: string
  isImportant?: boolean
  imageUrl?: string
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: '공지',
    targetAudience: '점주',
    imageUrl: '',
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

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
    } catch (err: any) {
      console.error('공지사항 목록 조회 에러:', err)
      setError(err.message || '공지사항 목록을 불러오는데 실패했습니다.')
      setNotices([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  const handleAddNotice = () => {
    setSelectedNotice(null)
    setFormData({
      title: '',
      content: '',
      type: '공지',
      targetAudience: '점주',
      imageUrl: '',
    })
    setImagePreview(null)
    setIsModalOpen(true)
  }

  const handleEditNotice = (notice: Notice) => {
    setSelectedNotice(notice)
    setFormData({
      title: notice.title,
      content: notice.content,
      type: notice.type || '공지',
      targetAudience: notice.targetAudience || '점주',
      imageUrl: notice.imageUrl || '',
    })
    setImagePreview(notice.imageUrl || null)
    setIsModalOpen(true)
  }

  const handleDeleteNotice = async (id: string) => {
    if (!confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/notices/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || '공지사항 삭제에 실패했습니다.')
        return
      }

      alert('공지사항이 성공적으로 삭제되었습니다.')
      await fetchNotices()
    } catch (err: any) {
      console.error('공지사항 삭제 에러:', err)
      alert('공지사항 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '파일 업로드에 실패했습니다.')
        return
      }

      const data = await response.json()
      setFormData((prev) => ({ ...prev, imageUrl: data.url }))
      setImagePreview(data.url)
    } catch (error) {
      console.error('업로드 오류:', error)
      alert('파일 업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: '' }))
    setImagePreview(null)
  }

  const handleSaveNotice = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }

    try {
      const url = selectedNotice 
        ? `/api/notices/${selectedNotice.id}`
        : '/api/notices'
      const method = selectedNotice ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          type: formData.type,
          targetAudience: formData.targetAudience,
          imageUrl: formData.imageUrl || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || (selectedNotice ? '공지사항 수정에 실패했습니다.' : '공지사항 등록에 실패했습니다.'))
        return
      }

      alert(selectedNotice ? '공지사항이 성공적으로 수정되었습니다.' : '공지사항이 성공적으로 등록되었습니다.')
      setIsModalOpen(false)
      setFormData({
        title: '',
        content: '',
        type: '공지',
        targetAudience: '점주',
        imageUrl: '',
      })
      setImagePreview(null)
      await fetchNotices()
    } catch (err: any) {
      console.error('공지사항 저장 에러:', err)
      alert(selectedNotice ? '공지사항 수정 중 오류가 발생했습니다.' : '공지사항 등록 중 오류가 발생했습니다.')
    }
  }

  return (
    <PowerAdminLayout>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">공지사항</h1>
            <p className="text-sm text-gray-500 mt-0.5">시스템 공지사항을 작성하고 관리하세요</p>
          </div>
          {NOTICE_WRITE_DISABLED ? (
            <span
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/70 text-white rounded-lg cursor-not-allowed text-sm font-medium opacity-90"
              aria-hidden
            >
              <FiPlus className="w-4 h-4" />
              공지사항 작성
            </span>
          ) : (
            <button
              onClick={handleAddNotice}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              <FiPlus className="w-4 h-4" />
              공지사항 작성
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-200 border-t-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 text-sm font-medium">공지사항을 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600 text-sm font-medium">오류: {error}</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                <FiBell className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm font-medium">등록된 공지사항이 없습니다</p>
              <p className="text-gray-400 text-xs mt-1">새로운 공지사항을 작성해주세요</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notice.title}
                        </h3>
                        {notice.type && (
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            notice.type === '공지' ? 'bg-blue-100 text-blue-700' :
                            notice.type === '이벤트' ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {notice.type}
                          </span>
                        )}
                        {notice.isImportant && (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
                            중요
                          </span>
                        )}
                      </div>
                      {notice.imageUrl && (
                        <div className="mb-3">
                          <img
                            src={notice.imageUrl}
                            alt={notice.title}
                            className="max-w-full h-auto max-h-64 rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                      <p className="text-gray-600 mb-3 whitespace-pre-line">
                        {notice.content}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>작성일: {new Date(notice.createdAt).toLocaleString('ko-KR')}</span>
                        {notice.updatedAt !== notice.createdAt && (
                          <span>수정일: {new Date(notice.updatedAt).toLocaleString('ko-KR')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEditNotice(notice)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="수정"
                      >
                        <FiEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteNotice(notice.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 모달 */}
        {isModalOpen && typeof window !== 'undefined' && createPortal(
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              zIndex: 99999 
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsModalOpen(false)
              }
            }}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedNotice ? '공지사항 수정' : '공지사항 작성'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="공지사항 제목을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    타입 *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="공지">공지</option>
                    <option value="이벤트">이벤트</option>
                    <option value="업데이트">업데이트</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    발송대상 *
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) =>
                      setFormData({ ...formData, targetAudience: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="점주">점주</option>
                    <option value="사용자">사용자</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    내용 *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-power-500 resize-none"
                    placeholder="공지사항 내용을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이미지
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {isUploading && (
                      <p className="text-sm text-gray-500">이미지 업로드 중...</p>
                    )}
                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="미리보기"
                          className="w-full h-64 object-contain border border-gray-300 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNotice}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    {selectedNotice ? '수정' : '등록'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </PowerAdminLayout>
  )
}

