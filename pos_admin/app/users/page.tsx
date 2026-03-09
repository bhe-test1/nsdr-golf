'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { FiSearch, FiEdit, FiTrash2, FiUserPlus, FiX, FiUserX, FiGift } from 'react-icons/fi'

interface User {
  id: string | number
  name: string
  phone: string
  email: string
  joinDate: string
  totalReservations: number
  totalSpent: number
  status: '활성' | '비활성'
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [selectedUserForManage, setSelectedUserForManage] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<(string | number)[]>([])
  const [pointAmount, setPointAmount] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  })
  const [formErrors, setFormErrors] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  })
  const usersPerPage = 10

  // 실제 데이터 가져오기
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        // API 응답 형식에 맞게 데이터 변환
        const formattedUsers = (data.users || data || []).map((user: any, index: number) => ({
          id: user.id || index + 1,
          name: user.name || '',
          phone: user.phone || '',
          email: user.email || '',
          joinDate: user.joinDate || user.createdAt ? new Date(user.joinDate || user.createdAt).toLocaleDateString('ko-KR') : '',
          totalReservations: user.totalReservations || 0,
          totalSpent: user.totalSpent || 0,
          status: user.status || '활성',
        }))
        setUsers(formattedUsers)
      } else {
        console.error('사용자 데이터를 가져오는데 실패했습니다.')
        setUsers([])
      }
    } catch (error) {
      console.error('사용자 데이터 로딩 오류:', error)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // 검색 필터링
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  const handleDelete = async (userId: string | number) => {
    if (confirm('정말 이 회원을 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          setUsers(users.filter((user) => user.id !== userId))
          setSelectedUsers(selectedUsers.filter((id) => id !== userId))
        } else {
          alert('회원 삭제에 실패했습니다.')
        }
      } catch (error) {
        console.error('회원 삭제 오류:', error)
        alert('회원 삭제에 실패했습니다.')
      }
    }
  }

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(currentUsers.map((user) => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  // 개별 선택/해제
  const handleSelectUser = (userId: string | number, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
    }
  }

  // 선택 삭제
  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) {
      alert('삭제할 회원을 선택해주세요.')
      return
    }

    if (confirm(`선택한 ${selectedUsers.length}명의 회원을 삭제하시겠습니까?`)) {
      try {
        const deletePromises = selectedUsers.map((userId) =>
          fetch(`/api/users/${userId}`, {
            method: 'DELETE',
          })
        )

        const results = await Promise.all(deletePromises)
        const allSuccess = results.every((response) => response.ok)

        if (allSuccess) {
          setUsers(users.filter((user) => !selectedUsers.includes(user.id)))
          setSelectedUsers([])
          alert(`${selectedUsers.length}명의 회원이 삭제되었습니다.`)
        } else {
          alert('일부 회원 삭제에 실패했습니다.')
        }
      } catch (error) {
        console.error('선택 삭제 오류:', error)
        alert('회원 삭제 중 오류가 발생했습니다.')
      }
    }
  }

  const handleStatusChange = async (userId: string | number) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return

    const newStatus = user.status === '활성' ? '비활성' : '활성'
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (response.ok) {
        setUsers(
          users.map((u) =>
            u.id === userId ? { ...u, status: newStatus } : u
          )
        )
      } else {
        alert('상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('상태 변경 오류:', error)
      alert('상태 변경에 실패했습니다.')
    }
  }

  // 회원 추가 모달 열기
  const handleOpenAddModal = () => {
    setIsAddModalOpen(true)
    setFormData({
      name: '',
      phone: '',
      email: '',
      password: '',
    })
    setFormErrors({
      name: '',
      phone: '',
      email: '',
      password: '',
    })
  }

  // 회원 추가 모달 닫기
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false)
    setFormData({
      name: '',
      phone: '',
      email: '',
      password: '',
    })
    setFormErrors({
      name: '',
      phone: '',
      email: '',
      password: '',
    })
  }

  // 폼 유효성 검사
  const validateForm = () => {
    const errors = {
      name: '',
      phone: '',
      email: '',
      password: '',
    }
    let isValid = true

    if (!formData.name.trim()) {
      errors.name = '이름을 입력해주세요.'
      isValid = false
    }

    if (!formData.email.trim()) {
      errors.email = '이메일을 입력해주세요.'
      isValid = false
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        errors.email = '올바른 이메일 형식을 입력해주세요.'
        isValid = false
      }
    }

    if (formData.phone) {
      const cleanPhone = formData.phone.replace(/-/g, '')
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        errors.phone = '올바른 전화번호 형식을 입력해주세요.'
        isValid = false
      }
    }

    if (!formData.password) {
      errors.password = '비밀번호를 입력해주세요.'
      isValid = false
    } else if (formData.password.length < 4) {
      errors.password = '비밀번호는 최소 4자 이상이어야 합니다.'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  // 회원 추가 처리
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        alert('회원이 성공적으로 추가되었습니다.')
        handleCloseAddModal()
        // 회원 목록 새로고침
        await fetchUsers()
      } else {
        alert(data.error || '회원 추가에 실패했습니다.')
      }
    } catch (error) {
      console.error('회원 추가 오류:', error)
      alert('회원 추가 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 전화번호 자동 포맷팅
  const handlePhoneChange = (value: string) => {
    // 숫자와 하이픈만 허용
    const cleaned = value.replace(/[^0-9-]/g, '')
    let formatted = cleaned

    // 하이픈 자동 추가
    if (cleaned.length > 3 && cleaned.length <= 7) {
      formatted = cleaned.slice(0, 3) + '-' + cleaned.slice(3)
    } else if (cleaned.length > 7) {
      formatted = cleaned.slice(0, 3) + '-' + cleaned.slice(3, 7) + '-' + cleaned.slice(7, 11)
    }

    setFormData({ ...formData, phone: formatted })
    if (formErrors.phone) {
      setFormErrors({ ...formErrors, phone: '' })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 페이지 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">사용자(회원) 관리</h2>
            <div className="flex items-center space-x-2">
              {selectedUsers.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <FiTrash2 className="w-5 h-5" />
                  <span>삭제 ({selectedUsers.length})</span>
                </button>
              )}
              <button
                onClick={handleOpenAddModal}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <FiUserPlus className="w-5 h-5" />
                <span>회원 추가</span>
              </button>
            </div>
          </div>

          {/* 검색 바 */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="이름, 전화번호, 이메일로 검색..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 회원 목록 테이블 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={currentUsers.length > 0 && selectedUsers.length === currentUsers.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    번호
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전화번호
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    첫만남
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    예약 횟수
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총 결제금액
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                      데이터를 불러오는 중...
                    </td>
                  </tr>
                ) : currentUsers.length > 0 ? (
                  currentUsers.map((user, index) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {user.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {user.joinDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {user.totalReservations}회
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-center">
                        {user.totalSpent.toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleStatusChange(user.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.status === '활성'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => {
                              setSelectedUserForManage(user)
                              setIsManageModalOpen(true)
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="관리"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : !isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? '검색 결과가 없습니다.' : '등록된 회원이 없습니다.'}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {!isLoading && filteredUsers.length > 0 && totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                총 {filteredUsers.length}명 중 {startIndex + 1}-
                {Math.min(endIndex, filteredUsers.length)}명 표시
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 border rounded-lg text-sm font-medium ${
                      currentPage === page
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 회원 추가 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">회원 추가</h3>
              <button
                onClick={handleCloseAddModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (formErrors.name) {
                      setFormErrors({ ...formErrors, name: '' })
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="이름을 입력하세요"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="010-1234-5678"
                  maxLength={13}
                />
                {formErrors.phone && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    if (formErrors.email) {
                      setFormErrors({ ...formErrors, email: '' })
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="example@email.com"
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    if (formErrors.password) {
                      setFormErrors({ ...formErrors, password: '' })
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="최소 4자 이상"
                />
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '추가 중...' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 회원 관리 모달 */}
      {isManageModalOpen && selectedUserForManage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">회원 관리</h3>
              <button
                onClick={() => {
                  setIsManageModalOpen(false)
                  setSelectedUserForManage(null)
                  setPointAmount('')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 회원 정보 */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="text-sm text-gray-600">이름</div>
                <div className="text-base font-semibold text-gray-900">{selectedUserForManage.name}</div>
                <div className="text-sm text-gray-600">이메일</div>
                <div className="text-base font-semibold text-gray-900">{selectedUserForManage.email}</div>
                <div className="text-sm text-gray-600">전화번호</div>
                <div className="text-base font-semibold text-gray-900">{selectedUserForManage.phone}</div>
                <div className="text-sm text-gray-600">상태</div>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  selectedUserForManage.status === '활성'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedUserForManage.status}
                </div>
              </div>

              {/* 회원 차단 */}
              <div>
                <h4 className="text-base font-semibold text-gray-800 mb-3">회원 차단</h4>
                <button
                  onClick={async () => {
                    if (confirm(`정말 ${selectedUserForManage.name} 회원을 ${selectedUserForManage.status === '활성' ? '차단' : '활성화'}하시겠습니까?`)) {
                      try {
                        const response = await fetch(`/api/users/${selectedUserForManage.id}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ 
                            status: selectedUserForManage.status === '활성' ? '비활성' : '활성'
                          }),
                        })
                        
                        if (response.ok) {
                          alert(`회원이 ${selectedUserForManage.status === '활성' ? '차단' : '활성화'}되었습니다.`)
                          setIsManageModalOpen(false)
                          setSelectedUserForManage(null)
                          await fetchUsers()
                        } else {
                          alert('회원 상태 변경에 실패했습니다.')
                        }
                      } catch (error) {
                        console.error('회원 상태 변경 오류:', error)
                        alert('회원 상태 변경에 실패했습니다.')
                      }
                    }
                  }}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    selectedUserForManage.status === '활성'
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  <FiUserX className="w-5 h-5" />
                  <span>{selectedUserForManage.status === '활성' ? '회원 차단' : '회원 활성화'}</span>
                </button>
              </div>

              {/* 포인트 지급 */}
              <div>
                <h4 className="text-base font-semibold text-gray-800 mb-3">포인트 지급</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      지급할 포인트
                    </label>
                    <input
                      type="number"
                      value={pointAmount}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '')
                        setPointAmount(value)
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="포인트를 입력하세요"
                      min="0"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      if (!pointAmount || parseInt(pointAmount) <= 0) {
                        alert('올바른 포인트를 입력해주세요.')
                        return
                      }

                      if (confirm(`${selectedUserForManage.name} 회원에게 ${parseInt(pointAmount).toLocaleString()} 포인트를 지급하시겠습니까?`)) {
                        try {
                          const response = await fetch(`/api/users/${selectedUserForManage.id}/points`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ 
                              points: parseInt(pointAmount),
                              reason: '관리자 지급'
                            }),
                          })
                          
                          if (response.ok) {
                            alert(`${parseInt(pointAmount).toLocaleString()} 포인트가 지급되었습니다.`)
                            setPointAmount('')
                            setIsManageModalOpen(false)
                            setSelectedUserForManage(null)
                            await fetchUsers()
                          } else {
                            const data = await response.json()
                            alert(data.error || '포인트 지급에 실패했습니다.')
                          }
                        } catch (error) {
                          console.error('포인트 지급 오류:', error)
                          alert('포인트 지급에 실패했습니다.')
                        }
                      }
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  >
                    <FiGift className="w-5 h-5" />
                    <span>포인트 지급</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
