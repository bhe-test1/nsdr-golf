'use client'

import { useState, useEffect } from 'react'
import PowerAdminLayout from '@/components/Layout/PowerAdminLayout'
import StatsCard from '@/components/Dashboard/StatsCard'
import { 
  FiUsers, 
  FiShoppingBag, 
  FiActivity
} from 'react-icons/fi'

export default function DashboardPage() {
  const [totalOwners, setTotalOwners] = useState<number>(0)
  const [totalStores, setTotalStores] = useState<number>(0)
  const [activeOwners, setActiveOwners] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        
        // 점주 데이터 조회
        const ownersResponse = await fetch('/api/owners')
        if (ownersResponse.ok) {
          const ownersData = await ownersResponse.json()
          const owners = ownersData.owners || []
          setTotalOwners(owners.length)
          
          // 활성 점주 수 계산
          const activeCount = owners.filter((owner: any) => owner.status === 'active').length
          setActiveOwners(activeCount)
        }

        // 매장 데이터 조회
        const storesResponse = await fetch('/api/stores')
        if (storesResponse.ok) {
          const storesData = await storesResponse.json()
          const stores = storesData.stores || []
          setTotalStores(stores.length)
        }
      } catch (error) {
        console.error('통계 데이터 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const stats = [
    {
      title: '전체 점주',
      value: loading ? '...' : totalOwners.toString(),
      icon: FiUsers,
      color: 'bg-power-500',
    },
    {
      title: '전체 매장',
      value: loading ? '...' : totalStores.toString(),
      icon: FiShoppingBag,
      color: 'bg-blue-500',
    },
    {
      title: '활성 점주',
      value: loading ? '...' : activeOwners.toString(),
      icon: FiActivity,
      color: 'bg-purple-500',
    },
  ]

  return (
    <PowerAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-600 mt-1">전체 시스템 현황을 한눈에 확인하세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>
      </div>
    </PowerAdminLayout>
  )
}

