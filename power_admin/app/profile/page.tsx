'use client'

import { useState } from 'react'
import PowerAdminLayout from '@/components/Layout/PowerAdminLayout'
import AdminList from '@/components/Admins/AdminList'
import AdminModal from '@/components/Admins/AdminModal'

export default function ProfilePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleAddAdmin = () => {
    setSelectedAdmin(null)
    setIsModalOpen(true)
  }

  const handleEditAdmin = (admin: any) => {
    setSelectedAdmin(admin)
    setIsModalOpen(true)
  }

  const handleSaveAdmin = async (admin: any) => {
    try {
      if (admin.id) {
        // 수정
        const response = await fetch(`/api/admins/${admin.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: admin.name,
            email: admin.email,
            phone: admin.phone,
            password: admin.password || undefined,
            status: admin.status || 'active',
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          alert(data.error || '관리자 수정에 실패했습니다.')
          return
        }

        alert('관리자 정보가 성공적으로 수정되었습니다.')
      } else {
        // 등록
        const response = await fetch('/api/admins', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: admin.name,
            email: admin.email,
            phone: admin.phone,
            password: admin.password,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          alert(data.error || '관리자 등록에 실패했습니다.')
          return
        }

        alert('관리자가 성공적으로 등록되었습니다.')
      }

      setIsModalOpen(false)
      // 목록 새로고침
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      console.error('관리자 저장 에러:', error)
      alert('관리자 저장 중 오류가 발생했습니다.')
    }
  }

  return (
    <PowerAdminLayout>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">관리자 관리</h1>
            <p className="text-sm text-gray-500 mt-0.5">관리자 정보를 조회하고 관리하세요</p>
          </div>
        </div>

        <AdminList 
          key={refreshKey} 
          onEdit={handleEditAdmin}
          onAddAdmin={handleAddAdmin}
        />

        <AdminModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          admin={selectedAdmin}
          onSave={handleSaveAdmin}
        />
      </div>
    </PowerAdminLayout>
  )
}
