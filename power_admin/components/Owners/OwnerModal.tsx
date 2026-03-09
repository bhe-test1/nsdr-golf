'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { FiX, FiSearch } from 'react-icons/fi'

declare global {
  interface Window {
    daum: any
  }
}

interface Owner {
  id?: string
  name: string
  email: string
  phone: string
  branchNumber: string
  password?: string
  storeName?: string
  location?: string
  businessRegistrationNumber?: string
  representativeName?: string
  storeOpenDate?: string
  address?: string
  detailAddress?: string
  storeType?: string
  platform?: string
  status?: 'active' | 'inactive' | 'blocked'
}

interface OwnerModalProps {
  isOpen: boolean
  onClose: () => void
  owner?: Owner | null
  onSave: (owner: Owner) => void
}

export default function OwnerModal({
  isOpen,
  onClose,
  owner,
  onSave,
}: OwnerModalProps) {
  const [formData, setFormData] = useState<Owner>({
    name: '',
    email: '',
    phone: '',
    branchNumber: '',
    password: '',
    storeName: '',
    location: '',
    businessRegistrationNumber: '',
    representativeName: '',
    storeOpenDate: '',
    address: '',
    detailAddress: '',
    storeType: '',
    platform: '',
    status: 'active',
  })
  const [isEditMode, setIsEditMode] = useState(false)

  // 업장구분에 따른 플랫폼 옵션
  const platformOptions = useMemo(() => {
    switch (formData.storeType) {
      case '스크린골프':
        return ['골프존파크', '비전플러스', '프렌즈스크린', 'SG', '기타']
      case '파크골프':
        return ['파크존', '마실파크', '레저로파크', 'GTF', '기타']
      case '연습장':
        return ['GDR', 'QED', '프렌즈스크린', 'SG', '기타']
      default:
        return []
    }
  }, [formData.storeType])

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

  // 사업자등록번호 자동 하이픈 포맷팅 (3-2-5 형식, 총 10자리)
  // 실제로는 3-2-5 형식이지만 사용자가 3-2-6 형식 총 11자리라고 했으므로 3-2-6으로 구현
  const formatBusinessNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '')
    
    // 길이에 따라 하이픈 추가 (3-2-6 형식)
    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 5) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5)}`
    } else {
      // 11자리 초과 시 11자리까지만
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 11)}`
    }
  }

  // 다음 우편번호 서비스 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    document.head.appendChild(script)

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거
      const existingScript = document.querySelector('script[src*="postcode.v2.js"]')
      if (existingScript) {
        document.head.removeChild(existingScript)
      }
    }
  }, [])

  // 모달이 열릴 때마다 수정 모드 초기화
  useEffect(() => {
    if (isOpen) {
      if (owner) {
        setIsEditMode(false) // 수정 모드 비활성화
      } else {
        setIsEditMode(true) // 신규 등록 시에는 항상 수정 모드
      }
    }
  }, [isOpen, owner])

  useEffect(() => {
    if (owner) {
      // owner 데이터를 폼에 맞게 변환
      const formattedPhone = owner.phone ? formatPhoneNumber(owner.phone.replace(/[^\d]/g, '')) : ''
      const formattedBusinessNumber = owner.businessRegistrationNumber 
        ? formatBusinessNumber(owner.businessRegistrationNumber.replace(/[^\d]/g, ''))
        : ''
      
      // storeOpenDate가 Date 객체인 경우 문자열로 변환
      let formattedStoreOpenDate = ''
      if (owner.storeOpenDate) {
        if (typeof owner.storeOpenDate === 'string') {
          formattedStoreOpenDate = owner.storeOpenDate.split('T')[0] // ISO 문자열에서 날짜 부분만 추출
        } else if (owner.storeOpenDate && typeof owner.storeOpenDate === 'object' && 'toISOString' in owner.storeOpenDate) {
          formattedStoreOpenDate = (owner.storeOpenDate as Date).toISOString().split('T')[0]
        }
      }

      setFormData({
        id: owner.id,
        name: owner.name || '',
        email: owner.email || '',
        phone: formattedPhone,
        branchNumber: owner.branchNumber || '',
        password: '', // 수정 시 비밀번호는 비워둠
        storeName: owner.storeName || '',
        location: owner.location || '',
        businessRegistrationNumber: formattedBusinessNumber,
        representativeName: owner.representativeName || '',
        storeOpenDate: formattedStoreOpenDate,
        address: owner.address || '',
        detailAddress: owner.detailAddress || '',
        storeType: owner.storeType || '',
        platform: owner.platform || '',
        status: owner.status || 'active',
      })
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        branchNumber: '',
        password: '',
        storeName: '',
        location: '',
        businessRegistrationNumber: '',
        representativeName: '',
        storeOpenDate: '',
        address: '',
        detailAddress: '',
        storeType: '',
        platform: '',
        status: 'active',
      })
    }
  }, [owner, isOpen])

  // 주소 검색 팝업 열기
  const handleAddressSearch = () => {
    if (!window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    new window.daum.Postcode({
      oncomplete: function(data: any) {
        // 도로명 주소 선택 시
        let addr = ''
        if (data.userSelectedType === 'R') {
          addr = data.roadAddress
        } else {
          // 지번 주소 선택 시
          addr = data.jibunAddress
        }

        // 주소 필드에 값 설정
        setFormData({
          ...formData,
          address: addr,
        })

        // 상세주소 필드에 포커스
        const detailAddressInput = document.querySelector('input[placeholder="상세주소를 입력하세요"]') as HTMLInputElement
        if (detailAddressInput) {
          detailAddressInput.focus()
        }
      },
      width: '100%',
      height: '100%',
    }).open()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 수정 모드가 아닐 때는 저장하지 않음
    if (owner && !isEditMode) {
      return
    }
    
    // 저장 처리
    onSave(formData)
    setIsEditMode(false)
    onClose()
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsEditMode(true)
  }

  // Enter 키로 인한 자동 submit 방지 (수정 모드가 아닐 때)
  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && owner && !isEditMode) {
      e.preventDefault()
      e.stopPropagation()
    }
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
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {owner ? '점주 정보 수정' : '새 점주 등록'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="p-6 space-y-4">
          {/* 1. 대표자명 / 사업자등록번호 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                대표자명 *
              </label>
              <input
                type="text"
                required
                disabled={!!(owner && !isEditMode)}
                value={formData.representativeName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, representativeName: e.target.value })
                }
                placeholder="대표자명을 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-power-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사업자등록번호
              </label>
              <input
                type="text"
                disabled={!!(owner && !isEditMode)}
                value={formData.businessRegistrationNumber || ''}
                onChange={(e) => {
                  const formatted = formatBusinessNumber(e.target.value)
                  setFormData({ ...formData, businessRegistrationNumber: formatted })
                }}
                placeholder="123-45-678901"
                maxLength={13}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-power-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          {/* 2. 매장명 / 전화번호 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                매장명
              </label>
              <input
                type="text"
                disabled={!!(owner && !isEditMode)}
                value={formData.storeName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, storeName: e.target.value })
                }
                placeholder="매장명을 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-power-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                전화번호 *
              </label>
              <input
                type="tel"
                required
                disabled={!!(owner && !isEditMode)}
                value={formData.phone}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value)
                  setFormData({ ...formData, phone: formatted })
                }}
                placeholder="010-1234-5678"
                maxLength={13}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-power-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          {/* 3. 설치일 / 상태 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설치일
              </label>
              <input
                type="date"
                disabled={!!(owner && !isEditMode)}
                value={formData.storeOpenDate || ''}
                onChange={(e) =>
                  setFormData({ ...formData, storeOpenDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-power-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상태
              </label>
              <select
                disabled={!!(owner && !isEditMode)}
                value={formData.status || 'active'}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'blocked' })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-power-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
                <option value="blocked">차단</option>
              </select>
            </div>
          </div>
          {/* 4. 업장구분 / 플랫폼 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                업장구분
              </label>
              <select
                disabled={!!(owner && !isEditMode)}
                value={formData.storeType || ''}
                onChange={(e) => {
                  // 업장구분이 변경되면 플랫폼 초기화
                  setFormData({ 
                    ...formData, 
                    storeType: e.target.value,
                    platform: '' // 플랫폼 초기화
                  })
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-power-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">선택하세요</option>
                <option value="스크린골프">스크린골프</option>
                <option value="파크골프">파크골프</option>
                <option value="연습장">연습장</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                플랫폼
              </label>
              <select
                disabled={!!(owner && !isEditMode) || !formData.storeType}
                value={formData.platform || ''}
                onChange={(e) =>
                  setFormData({ ...formData, platform: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-power-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">선택하세요</option>
                {platformOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* 5. 주소 / 상세주소 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                주소
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="주소를 입력하세요"
                  readOnly
                  disabled={!!(owner && !isEditMode)}
                  onClick={owner && !isEditMode ? undefined : handleAddressSearch}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-power-500 bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  style={{ cursor: owner && !isEditMode ? 'not-allowed' : 'pointer' }}
                />
                <button
                  type="button"
                  disabled={!!(owner && !isEditMode)}
                  onClick={handleAddressSearch}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 whitespace-nowrap disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <FiSearch className="w-4 h-4" />
                  주소 검색
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상세주소
              </label>
              <input
                type="text"
                disabled={!!(owner && !isEditMode)}
                value={formData.detailAddress || ''}
                onChange={(e) =>
                  setFormData({ ...formData, detailAddress: e.target.value })
                }
                placeholder="상세주소를 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-power-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          {/* 6. 지점번호 / 비밀번호 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                지점번호 *
              </label>
              <input
                type="text"
                required
                disabled={!!(owner && !isEditMode)}
                value={formData.branchNumber}
                onChange={(e) =>
                  setFormData({ ...formData, branchNumber: e.target.value })
                }
                placeholder="001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-power-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 {!owner && '*'}
              </label>
              <input
                type="text"
                required={!owner}
                disabled={!!(owner && !isEditMode)}
                value={formData.password || ''}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder={owner ? "변경하지 않으려면 비워두세요" : "최소 4자 이상"}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-power-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            {owner && !isEditMode ? (
              <button
                type="button"
                onClick={handleEditClick}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                수정하기
              </button>
            ) : (
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                {owner ? '저장' : '등록'}
              </button>
            )}
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

