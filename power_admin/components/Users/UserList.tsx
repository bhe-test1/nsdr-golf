'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import ko from 'date-fns/locale/ko'
import { FiTrash2, FiEdit, FiUser, FiDownload, FiSearch, FiX } from 'react-icons/fi'
import ExcelJS from 'exceljs'

interface User {
  id: string
  email: string
  name: string
  phone: string
  createdAt: string
  updatedAt: string
}

interface UserListProps {
  onEdit?: (user: User) => void
  onUsersChange?: (users: User[]) => void
  onAddUser?: () => void
  searchTerm?: string
  refreshKey?: number
}

export default function UserList({ onEdit, onUsersChange, onAddUser, searchTerm = '', refreshKey = 0 }: UserListProps) {
  const [users, setUsers] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)

  const filterUsers = (usersData: User[], term: string) => {
    if (!term.trim()) {
      setUsers(usersData)
      return
    }

    const lowerTerm = term.toLowerCase().trim()
    const filtered = usersData.filter((user) => {
      const name = user.name?.toLowerCase() || ''
      const email = user.email?.toLowerCase() || ''
      const phone = user.phone?.replace(/-/g, '') || ''
      const searchPhone = lowerTerm.replace(/-/g, '')

      return (
        name.includes(lowerTerm) ||
        email.includes(lowerTerm) ||
        phone.includes(searchPhone)
      )
    })
    setUsers(filtered)
  }

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/users')
      const data = await response.json()
      
      if (response.ok) {
        const usersData = data.users || []
        setAllUsers(usersData)
        filterUsers(usersData, localSearchTerm)
        setSelectedUsers(new Set())
        if (onUsersChange) {
          onUsersChange(usersData)
        }
      } else {
        console.error('사용자 목록 조회 실패:', data.error)
      }
    } catch (error) {
      console.error('사용자 목록 조회 에러:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // searchTerm prop이 변경되면 로컬 상태도 업데이트
  useEffect(() => {
    setLocalSearchTerm(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    fetchUsers()
  }, [refreshKey])

  useEffect(() => {
    filterUsers(allUsers, localSearchTerm)
  }, [localSearchTerm, allUsers])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map(user => user.id)))
    } else {
      setSelectedUsers(new Set())
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers)
    if (checked) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 사용자를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchUsers()
        alert('사용자가 삭제되었습니다.')
      } else {
        const data = await response.json()
        alert(data.error || '사용자 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('사용자 삭제 에러:', error)
      alert('사용자 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedUsers.size === 0) {
      alert('삭제할 사용자를 선택해주세요.')
      return
    }

    if (!confirm(`선택한 ${selectedUsers.size}명의 사용자를 삭제하시겠습니까?`)) {
      return
    }

    try {
      setIsDeleting(true)
      const deletePromises = Array.from(selectedUsers).map(async (userId) => {
        const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
        return { userId, ok: response.ok }
      })

      const results = await Promise.allSettled(deletePromises)
      const failed = results.filter(
        (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok)
      )

      if (failed.length > 0) {
        alert(`${failed.length}명의 사용자 삭제에 실패했습니다.`)
      } else {
        alert('선택한 사용자가 성공적으로 삭제되었습니다.')
      }

      await fetchUsers()
    } catch (err: any) {
      console.error('사용자 삭제 에러:', err)
      alert('사용자 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  const isAllSelected = users.length > 0 && selectedUsers.size === users.length
  const isIndeterminate = selectedUsers.size > 0 && selectedUsers.size < users.length

  const handleExportExcel = async () => {
    if (users.length === 0) {
      alert('다운로드할 사용자 정보가 없습니다.')
      return
    }

    // 엑셀 데이터 준비
    const excelData = users.map((user) => ({
      '이름': user.name,
      '이메일': user.email,
      '전화번호': user.phone,
      '가입일': user.createdAt ? format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: ko }) : '-',
      '수정일': user.updatedAt ? format(new Date(user.updatedAt), 'yyyy-MM-dd HH:mm:ss', { locale: ko }) : '-',
    }))

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('사용자 목록')
    worksheet.columns = [
      { header: '이름', key: '이름', width: 15 },
      { header: '이메일', key: '이메일', width: 25 },
      { header: '전화번호', key: '전화번호', width: 15 },
      { header: '가입일', key: '가입일', width: 20 },
      { header: '수정일', key: '수정일', width: 20 },
    ]
    worksheet.addRows(excelData)

    const fileName = `사용자_목록_${format(new Date(), 'yyyyMMdd_HHmmss', { locale: ko })}.xlsx`
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-200 border-t-orange-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 text-sm font-medium">사용자 목록을 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              총 <span className="text-orange-600 font-bold">{users.length}</span>명
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onAddUser && (
              <button
                onClick={onAddUser}
                className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1.5 text-sm font-medium"
              >
                <FiUser className="w-4 h-4" />
                사용자 등록
              </button>
            )}
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              <FiDownload className="w-4 h-4" />
              엑셀
            </button>
            {selectedUsers.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm font-medium"
              >
                <FiTrash2 className="w-4 h-4" />
                삭제 ({selectedUsers.size})
              </button>
            )}
          </div>
        </div>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="이름, 이메일, 전화번호 검색"
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                이름
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                이메일
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                전화번호
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                가입일
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                수정일
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <FiUser className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">등록된 사용자가 없습니다</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr 
                  key={user.id} 
                  className="hover:bg-orange-50/30 transition-colors border-b border-gray-50"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.email || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {user.phone || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-700">
                      {user.createdAt ? format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko }) : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-700">
                      {user.updatedAt ? format(new Date(user.updatedAt), 'yyyy-MM-dd HH:mm', { locale: ko }) : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(user)}
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

