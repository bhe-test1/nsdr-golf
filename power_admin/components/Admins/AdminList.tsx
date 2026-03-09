'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import ko from 'date-fns/locale/ko'
import { FiTrash2, FiEdit, FiShield, FiPlus, FiSearch, FiX } from 'react-icons/fi'

interface Admin {
  id: string
  name: string
  email: string
  phone: string
  status: string
  joinDate: string
  lastLoginAt: string | null
}

interface AdminListProps {
  onEdit?: (admin: Admin) => void
  onAddAdmin?: () => void
  refreshKey?: number
}

export default function AdminList({ onEdit, onAddAdmin, refreshKey }: AdminListProps) {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [allAdmins, setAllAdmins] = useState<Admin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAdmins, setSelectedAdmins] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [localSearchTerm, setLocalSearchTerm] = useState('')

  const filterAdmins = (adminsData: Admin[], term: string) => {
    if (!term.trim()) {
      setAdmins(adminsData)
      return
    }

    const lowerTerm = term.toLowerCase().trim()
    const filtered = adminsData.filter((admin) => {
      const name = admin.name?.toLowerCase() || ''
      const email = admin.email?.toLowerCase() || ''
      const phone = admin.phone?.replace(/-/g, '') || ''
      const searchPhone = lowerTerm.replace(/-/g, '')

      return (
        name.includes(lowerTerm) ||
        email.includes(lowerTerm) ||
        phone.includes(searchPhone)
      )
    })
    setAdmins(filtered)
  }

  const fetchAdmins = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admins')
      const data = await response.json()
      
      if (response.ok) {
        const adminsData = data.admins || []
        setAllAdmins(adminsData)
        filterAdmins(adminsData, localSearchTerm)
        setSelectedAdmins(new Set())
      } else {
        console.error('관리자 목록 조회 실패:', data.error)
      }
    } catch (error) {
      console.error('관리자 목록 조회 에러:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [refreshKey])

  useEffect(() => {
    filterAdmins(allAdmins, localSearchTerm)
  }, [localSearchTerm, allAdmins])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAdmins(new Set(admins.map(admin => admin.id)))
    } else {
      setSelectedAdmins(new Set())
    }
  }

  const handleSelectAdmin = (adminId: string, checked: boolean) => {
    const newSelected = new Set(selectedAdmins)
    if (checked) {
      newSelected.add(adminId)
    } else {
      newSelected.delete(adminId)
    }
    setSelectedAdmins(newSelected)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 관리자를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/admins/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // 목록 새로고침
        fetchAdmins()
      } else {
        const data = await response.json()
        alert(data.error || '관리자 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('관리자 삭제 에러:', error)
      alert('관리자 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedAdmins.size === 0) {
      alert('삭제할 관리자를 선택해주세요.')
      return
    }

    if (!confirm(`선택한 ${selectedAdmins.size}명의 관리자를 삭제하시겠습니까?`)) {
      return
    }

    try {
      setIsDeleting(true)
      const deletePromises = Array.from(selectedAdmins).map(async (adminId) => {
        const response = await fetch(`/api/admins/${adminId}`, { method: 'DELETE' })
        return { adminId, ok: response.ok }
      })

      const results = await Promise.allSettled(deletePromises)
      const failed = results.filter(r => 
        r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok)
      )

      if (failed.length > 0) {
        alert(`${failed.length}명의 관리자 삭제에 실패했습니다.`)
      } else {
        alert('선택한 관리자가 성공적으로 삭제되었습니다.')
      }

      // 목록 새로고침
      await fetchAdmins()
    } catch (err: any) {
      console.error('관리자 삭제 에러:', err)
      alert('관리자 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  const isAllSelected = admins.length > 0 && selectedAdmins.size === admins.length
  const isIndeterminate = selectedAdmins.size > 0 && selectedAdmins.size < admins.length

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-200 border-t-orange-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 text-sm font-medium">관리자 목록을 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              총 <span className="text-orange-600 font-bold">{admins.length}</span>명
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onAddAdmin && (
              <button
                onClick={onAddAdmin}
                className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1.5 text-sm font-medium"
              >
                <FiPlus className="w-4 h-4" />
                관리자 등록
              </button>
            )}
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting || selectedAdmins.size === 0}
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm font-medium"
            >
              <FiTrash2 className="w-4 h-4" />
              삭제
            </button>
          </div>
        </div>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="관리자 이름, 이메일, 전화번호로 검색..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          {localSearchTerm && (
            <button
              onClick={() => setLocalSearchTerm('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
              title="검색어 지우기"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-orange-50 border-b border-orange-100">
            <tr>
              <th className="px-4 py-3 text-center w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isIndeterminate
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-2 focus:ring-orange-500 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                관리자 정보
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                이름
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                연락처
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                가입일
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                최근 로그인
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {admins.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <FiShield className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">등록된 관리자가 없습니다</p>
                    <p className="text-gray-400 text-xs mt-1">새로운 관리자를 등록해주세요</p>
                  </div>
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr 
                  key={admin.id} 
                  className="hover:bg-orange-50/30 transition-colors border-b border-gray-50"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={selectedAdmins.has(admin.id)}
                      onChange={(e) => handleSelectAdmin(admin.id, e.target.checked)}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-700">
                      {admin.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {admin.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {admin.phone || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-700">
                    {admin.joinDate ? format(new Date(admin.joinDate), 'yyyy-MM-dd HH:mm', { locale: ko }) : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-700">
                    {admin.lastLoginAt ? format(new Date(admin.lastLoginAt), 'yyyy-MM-dd HH:mm', { locale: ko }) : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(admin)}
                          className="text-orange-600 hover:text-orange-700 p-1.5 hover:bg-orange-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
