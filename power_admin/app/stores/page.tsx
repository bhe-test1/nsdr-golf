'use client'

import { useState } from 'react'
import PowerAdminLayout from '@/components/Layout/PowerAdminLayout'
import StoreList from '@/components/Stores/StoreList'
import StoreModal from '@/components/Stores/StoreModal'

interface Store {
  id: string
  name: string
  ownerName: string
  ownerId: string
  location: string
  type: string
  status: 'active' | 'inactive'
}

export default function StoresPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [stores, setStores] = useState<Store[]>([])

  const handleAddStore = () => {
    setSelectedStore(null)
    setIsModalOpen(true)
  }

  const handleEditStore = (store: any) => {
    setSelectedStore(store)
    setIsModalOpen(true)
  }

  const handleSaveStore = async (store: any) => {
    try {
      // TODO: 실제 API 호출 구현
      setIsModalOpen(false)
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      console.error('매장 저장 에러:', error)
    }
  }

  return (
    <PowerAdminLayout>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">매장 관리</h1>
            <p className="text-sm text-gray-500 mt-0.5">매장 정보를 조회하고 관리하세요</p>
          </div>
        </div>

        <StoreList 
          key={refreshKey} 
          onEdit={handleEditStore} 
          onStoresChange={setStores}
          onAddStore={handleAddStore}
        />

        <StoreModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          store={selectedStore}
          mode={selectedStore ? 'edit' : 'edit'}
          onSave={handleSaveStore}
        />
      </div>
    </PowerAdminLayout>
  )
}

