'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import ko from 'date-fns/locale/ko'
import { FiTrash2, FiEdit, FiShoppingBag, FiHome, FiDownload, FiPlus, FiSearch, FiX } from 'react-icons/fi'
import ExcelJS from 'exceljs'

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

interface OwnerListProps {
  onEdit?: (owner: Owner) => void
  onOwnersChange?: (owners: Owner[]) => void
  onAddOwner?: () => void
  onSearchFocus?: () => void
  searchTerm?: string
}

export default function OwnerList({ onEdit, onOwnersChange, onAddOwner, onSearchFocus, searchTerm = '' }: OwnerListProps) {
  const [owners, setOwners] = useState<Owner[]>([])
  const [allOwners, setAllOwners] = useState<Owner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOwners, setSelectedOwners] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)

  const filterOwners = (ownersData: Owner[], term: string) => {
    if (!term.trim()) {
      setOwners(ownersData)
      return
    }

    const lowerTerm = term.toLowerCase().trim()
    const filtered = ownersData.filter((owner) => {
      const representativeName = owner.representativeName?.toLowerCase() || ''
      const phone = owner.phone?.replace(/-/g, '') || ''
      const storeName = owner.storeName?.toLowerCase() || ''
      const searchPhone = lowerTerm.replace(/-/g, '')

      return (
        representativeName.includes(lowerTerm) ||
        phone.includes(searchPhone) ||
        storeName.includes(lowerTerm)
      )
    })
    setOwners(filtered)
  }

  const fetchOwners = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/owners')
      const data = await response.json()
      
      if (response.ok) {
        const ownersData = data.owners || []
        setAllOwners(ownersData)
        filterOwners(ownersData, localSearchTerm)
        setSelectedOwners(new Set())
        if (onOwnersChange) {
          onOwnersChange(ownersData)
        }
      } else {
        console.error('점주 목록 조회 실패:', data.error)
      }
    } catch (error) {
      console.error('점주 목록 조회 에러:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // searchTerm prop이 변경되면 로컬 상태도 업데이트
  useEffect(() => {
    setLocalSearchTerm(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    fetchOwners()
  }, [])

  useEffect(() => {
    filterOwners(allOwners, localSearchTerm)
  }, [localSearchTerm, allOwners])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOwners(new Set(owners.map(owner => owner.id)))
    } else {
      setSelectedOwners(new Set())
    }
  }

  const handleSelectOwner = (ownerId: string, checked: boolean) => {
    const newSelected = new Set(selectedOwners)
    if (checked) {
      newSelected.add(ownerId)
    } else {
      newSelected.delete(ownerId)
    }
    setSelectedOwners(newSelected)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 점주를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/owners/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // 목록 새로고침
        fetchOwners()
      } else {
        const data = await response.json()
        alert(data.error || '점주 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('점주 삭제 에러:', error)
      alert('점주 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedOwners.size === 0) {
      alert('삭제할 점주를 선택해주세요.')
      return
    }

    if (!confirm(`선택한 ${selectedOwners.size}명의 점주를 삭제하시겠습니까?`)) {
      return
    }

    try {
      setIsDeleting(true)
      const deletePromises = Array.from(selectedOwners).map(async (ownerId) => {
        const response = await fetch(`/api/owners/${ownerId}`, { method: 'DELETE' })
        return { ownerId, ok: response.ok }
      })

      const results = await Promise.allSettled(deletePromises)
      const failed = results.filter(r => 
        r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok)
      )

      if (failed.length > 0) {
        alert(`${failed.length}명의 점주 삭제에 실패했습니다.`)
      } else {
        alert('선택한 점주가 성공적으로 삭제되었습니다.')
      }

      // 목록 새로고침
      await fetchOwners()
    } catch (err: any) {
      console.error('점주 삭제 에러:', err)
      alert('점주 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  const isAllSelected = owners.length > 0 && selectedOwners.size === owners.length
  const isIndeterminate = selectedOwners.size > 0 && selectedOwners.size < owners.length

  const handleExportExcel = async () => {
    if (owners.length === 0) {
      alert('다운로드할 점주 정보가 없습니다.')
      return
    }

    const excelData = owners.map((owner) => ({
      '점주명': owner.name,
      '이메일': owner.email,
      '전화번호': owner.phone,
      '지점번호': owner.branchNumber,
      '매장명': owner.storeName,
      '주소': owner.address || '-',
      '상세주소': owner.detailAddress || '-',
      '상태': owner.status === 'active' ? '활성' : owner.status === 'inactive' ? '비활성' : owner.status,
    }))

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('점주 목록')
    worksheet.columns = [
      { header: '점주명', key: '점주명', width: 15 },
      { header: '이메일', key: '이메일', width: 25 },
      { header: '전화번호', key: '전화번호', width: 15 },
      { header: '지점번호', key: '지점번호', width: 12 },
      { header: '매장명', key: '매장명', width: 20 },
      { header: '주소', key: '주소', width: 30 },
      { header: '상세주소', key: '상세주소', width: 20 },
      { header: '상태', key: '상태', width: 10 },
    ]
    worksheet.addRows(excelData)

    const fileName = `점주_목록_${format(new Date(), 'yyyyMMdd_HHmmss', { locale: ko })}.xlsx`
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
        <p className="mt-4 text-gray-600 text-sm font-medium">점주 목록을 불러오는 중...</p>
      </div>
    )
  }


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              총 <span className="text-orange-600 font-bold">{owners.length}</span>명
            </span>
          </div>
          <div className="flex items-center gap-2">
          {onAddOwner && (
            <button
              onClick={onAddOwner}
              className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              <FiPlus className="w-4 h-4" />
              점주 등록
            </button>
          )}
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-1.5 text-sm font-medium"
          >
            <FiDownload className="w-4 h-4" />
            엑셀
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={isDeleting || selectedOwners.size === 0}
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
            placeholder="대표자명, 연락처, 매장명 검색"
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
                대표자명
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                연락처
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                지점번호
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                매장명
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                주소
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                상세주소
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                상태
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {owners.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <FiHome className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">등록된 점주가 없습니다</p>
                    <p className="text-gray-400 text-xs mt-1">새로운 점주를 등록해주세요</p>
                  </div>
                </td>
              </tr>
            ) : (
              owners.map((owner, index) => (
                <tr 
                  key={owner.id} 
                  className="hover:bg-orange-50/30 transition-colors border-b border-gray-50"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={selectedOwners.has(owner.id)}
                      onChange={(e) => handleSelectOwner(owner.id, e.target.checked)}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {owner.representativeName || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {owner.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900 flex items-center justify-center gap-1">
                      <span className="text-orange-500 font-bold">#</span>
                      <span className="font-medium">{owner.branchNumber}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {owner.storeName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm text-gray-700 max-w-xs truncate mx-auto">
                      {owner.address || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm text-gray-700 max-w-xs truncate mx-auto">
                      {owner.detailAddress || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        owner.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : owner.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {owner.status === 'active'
                        ? '활성'
                        : owner.status === 'inactive'
                        ? '비활성'
                        : owner.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(owner)}
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

