'use client'

import { useState } from 'react'
import PowerAdminLayout from '@/components/Layout/PowerAdminLayout'
import OwnerList from '@/components/Owners/OwnerList'
import OwnerModal from '@/components/Owners/OwnerModal'

interface Owner {
  id: string
  name: string
  email: string
  phone: string
  branchNumber: string
  storeName: string
  representativeName?: string
  businessRegistrationNumber?: string
  storeOpenDate?: string
  address?: string
  detailAddress?: string
  storeType?: string
  platform?: string
  status: string
  joinDate?: string
}

export default function OwnersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOwner, setSelectedOwner] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [owners, setOwners] = useState<Owner[]>([])

  const handleAddOwner = () => {
    setSelectedOwner(null)
    setIsModalOpen(true)
  }

  const handleEditOwner = (owner: any) => {
    setSelectedOwner(owner)
    setIsModalOpen(true)
  }

  const handleSaveOwner = async (owner: any) => {
    try {
      const response = await fetch('/api/owners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // 지정된 필드만 전송
          id: owner.id,
          name: owner.representativeName || owner.name || '', // 대표자명
          businessRegistrationNumber: owner.businessRegistrationNumber || '', // 사업자등록번호
          storeName: owner.storeName || '', // 매장명
          phone: owner.phone || '', // 전화번호
          storeOpenDate: owner.storeOpenDate || '', // 설치일
          status: owner.status || 'active', // 상태
          storeType: owner.storeType || '', // 업장구분
          platform: owner.platform || '', // 플랫폼
          address: owner.address || '', // 주소
          detailAddress: owner.detailAddress || '', // 상세주소
          branchNumber: owner.branchNumber || '', // 지점번호
          password: owner.password || '', // 비밀번호
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('점주 저장 실패:', data.error || (owner.id ? '점주 정보 수정에 실패했습니다.' : '점주 등록에 실패했습니다.'))
        return
      }

      // 경고 메시지가 있으면 콘솔에만 출력
      if (data.warning) {
        console.warn('경고:', data.warning)
      }
      
      setIsModalOpen(false)
      // 목록 새로고침
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      console.error('점주 저장 에러:', error)
    }
  }

  return (
    <PowerAdminLayout>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">점주 관리</h1>
            <p className="text-sm text-gray-500 mt-0.5">점주 정보를 조회하고 관리하세요</p>
          </div>
        </div>

        <OwnerList 
          key={refreshKey} 
          onEdit={handleEditOwner} 
          onOwnersChange={setOwners}
          onAddOwner={handleAddOwner}
        />

        <OwnerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          owner={selectedOwner}
          onSave={handleSaveOwner}
        />

      </div>
    </PowerAdminLayout>
  )
}

