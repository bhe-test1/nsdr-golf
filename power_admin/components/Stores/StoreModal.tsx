'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FiX, FiMapPin, FiUser, FiShoppingBag } from 'react-icons/fi'

interface Store {
  id: string
  name: string
  ownerName: string
  ownerId: string
  location: string
  type: string
  status: 'active' | 'inactive'
  description?: string
  imageUrl?: string
  latitude?: number
  longitude?: number
}

interface StoreModalProps {
  isOpen: boolean
  onClose: () => void
  store: Store | null
  mode: 'view' | 'edit'
  onSave?: (store: Store) => void
}

export default function StoreModal({
  isOpen,
  onClose,
  store,
  mode,
  onSave,
}: StoreModalProps) {
  const [formData, setFormData] = useState<Store | null>(null)

  useEffect(() => {
    if (store) {
      setFormData({ ...store })
    } else if (isOpen && mode === 'edit') {
      // 매장 등록 모드
      setFormData({
        id: '',
        name: '',
        ownerName: '',
        ownerId: '',
        location: '',
        type: '',
        status: 'active',
      })
    }
  }, [store, isOpen, mode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData && onSave) {
      onSave(formData)
    }
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'view' ? '매장 상세 정보' : formData?.id ? '매장 정보 수정' : '매장 등록'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
        
        {mode === 'view' && formData ? (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  매장명
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <FiShoppingBag className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-900">{formData.name}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  점주
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <FiUser className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">{formData.ownerName}</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                위치
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <FiMapPin className="w-5 h-5 text-red-600" />
                <span className="text-gray-900">{formData.location}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  타입
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">{formData.type}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상태
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    formData.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {formData.status === 'active' ? '운영중' : '비활성'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        ) : formData ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  매장명 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  타입
                </label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                위치 *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                {formData.id ? '수정' : '등록'}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  )

  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body)
  }
  
  return null
}

