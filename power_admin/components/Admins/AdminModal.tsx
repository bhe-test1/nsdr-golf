'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FiX } from 'react-icons/fi'

interface Admin {
  id?: string
  name: string
  email: string
  phone: string
  status?: string
  password?: string
}

interface AdminModalProps {
  isOpen: boolean
  onClose: () => void
  admin?: Admin | null
  onSave: (admin: Admin) => void
}

export default function AdminModal({
  isOpen,
  onClose,
  admin,
  onSave,
}: AdminModalProps) {
  const [formData, setFormData] = useState<Admin>({
    name: '',
    email: '',
    phone: '',
    status: 'active',
    password: '',
  })

  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([])
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)

  // 이메일 도메인 목록
  const emailDomains = [
    'gmail.com',
    'naver.com',
    'daum.net',
  ]

  // 이메일 자동완성 처리
  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, email: value })
    setSelectedSuggestionIndex(-1)
    
    const atIndex = value.indexOf('@')
    
    if (atIndex > 0) {
      // @가 있는 경우: 도메인 부분 자동완성
      const domain = value.substring(atIndex + 1)
      const prefix = value.substring(0, atIndex + 1)
      
      if (domain.length > 0) {
        const filtered = emailDomains.filter(d => d.startsWith(domain))
        setEmailSuggestions(filtered.map(d => prefix + d))
        setShowEmailSuggestions(filtered.length > 0)
      } else {
        setEmailSuggestions(emailDomains.map(d => prefix + d))
        setShowEmailSuggestions(true)
      }
    } else if (value.length > 0) {
      // @가 없는 경우: 전체 이메일 주소 자동완성
      setEmailSuggestions(emailDomains.map(d => value + '@' + d))
      setShowEmailSuggestions(true)
    } else {
      setShowEmailSuggestions(false)
      setEmailSuggestions([])
    }
  }

  const selectEmailSuggestion = (suggestion: string) => {
    setFormData({ ...formData, email: suggestion })
    setShowEmailSuggestions(false)
    setEmailSuggestions([])
    setSelectedSuggestionIndex(-1)
  }

  // 키보드 네비게이션 처리
  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showEmailSuggestions || emailSuggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestionIndex((prev) => 
        prev < emailSuggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault()
      selectEmailSuggestion(emailSuggestions[selectedSuggestionIndex])
    } else if (e.key === 'Escape') {
      setShowEmailSuggestions(false)
      setSelectedSuggestionIndex(-1)
    }
  }

  // 전화번호 자동 하이픈 포맷팅
  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '')
    
    // 길이에 따라 하이픈 추가
    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
    } else {
      // 11자리 초과 시 11자리까지만
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
    }
  }

  useEffect(() => {
    if (admin) {
      setFormData({
        ...admin,
        phone: admin.phone ? formatPhoneNumber(admin.phone.replace(/[^\d]/g, '')) : '',
      })
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        status: 'active',
        password: '',
      })
    }
  }, [admin, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null)

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setMouseDownPos({ x: e.clientX, y: e.clientY })
    }
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && mouseDownPos) {
      const distance = Math.sqrt(
        Math.pow(e.clientX - mouseDownPos.x, 2) + Math.pow(e.clientY - mouseDownPos.y, 2)
      )
      // 5픽셀 이내 이동만 클릭으로 간주 (드래그가 아닌 경우)
      if (distance < 5) {
        onClose()
      }
      setMouseDownPos(null)
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        zIndex: 99999 
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {admin ? '관리자 정보 수정' : '새 관리자 등록'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름 *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-power-500"
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 *
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onKeyDown={handleEmailKeyDown}
              onBlur={() => setTimeout(() => setShowEmailSuggestions(false), 200)}
              onFocus={() => {
                const email = formData.email
                if (email.length > 0) {
                  const atIndex = email.indexOf('@')
                  if (atIndex > 0) {
                    const domain = email.substring(atIndex + 1)
                    const prefix = email.substring(0, atIndex + 1)
                    if (domain.length === 0) {
                      setEmailSuggestions(emailDomains.map(d => prefix + d))
                      setShowEmailSuggestions(true)
                    } else {
                      const filtered = emailDomains.filter(d => d.startsWith(domain))
                      setEmailSuggestions(filtered.map(d => prefix + d))
                      setShowEmailSuggestions(filtered.length > 0)
                    }
                  } else {
                    setEmailSuggestions(emailDomains.map(d => email + '@' + d))
                    setShowEmailSuggestions(true)
                  }
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-power-500"
            />
            {showEmailSuggestions && emailSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {emailSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectEmailSuggestion(suggestion)}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      index === selectedSuggestionIndex
                        ? 'bg-power-100 text-power-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              전화번호
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value)
                setFormData({ ...formData, phone: formatted })
              }}
              placeholder="010-1234-5678"
              maxLength={13}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-power-500"
            />
          </div>
          {!admin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 *
              </label>
              <input
                type="text"
                required={!admin}
                value={formData.password || ''}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="최소 4자 이상"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-power-500"
              />
            </div>
          )}
          {admin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상태 *
                </label>
                <select
                  value={formData.status || 'active'}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-power-500"
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  새 비밀번호 (변경하지 않으려면 비워두세요)
                </label>
                <input
                  type="text"
                  value={formData.password || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="최소 4자 이상"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-power-500"
                />
              </div>
            </>
          )}
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
              className="flex-1 px-4 py-2 bg-power-600 text-white rounded-lg hover:bg-power-700 transition-colors"
            >
              {admin ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  // Portal을 사용하여 body에 직접 렌더링
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body)
  }
  
  return null
}

