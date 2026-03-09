'use client'

import { FiLogOut } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Header() {
  const router = useRouter()
  const [adminName, setAdminName] = useState('')

  useEffect(() => {
    const name = sessionStorage.getItem('adminName') || ''
    setAdminName(name)
  }, [])

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      sessionStorage.removeItem('isAuthenticated')
      sessionStorage.removeItem('adminName')
      sessionStorage.removeItem('isPowerAdmin')
      router.push('/login')
    }
  }

  return (
    <header className="bg-white shadow-md border-b border-gray-200">
      <div className="flex items-center justify-end px-6 py-4">
        <div className="flex items-center gap-4">
          {adminName && (
            <div className="text-sm text-gray-700 font-medium">
              현재 로그인: <span className="text-amber-600 font-bold">{adminName}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="로그아웃"
          >
            <FiLogOut className="w-4 h-4" />
            <span className="hidden md:inline">로그아웃</span>
          </button>
        </div>
      </div>
    </header>
  )
}

