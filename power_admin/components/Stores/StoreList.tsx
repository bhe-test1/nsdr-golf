'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import ko from 'date-fns/locale/ko'
import { FiEdit, FiTrash2, FiMapPin, FiUser, FiHome, FiDownload, FiPlus, FiSearch, FiX } from 'react-icons/fi'
import ExcelJS from 'exceljs'

interface Store {
  id: string
  name: string
  ownerName: string
  ownerId: string
  location: string
  type: string
  status: 'active' | 'inactive'
}

interface StoreListProps {
  onEdit?: (store: Store) => void
  onStoresChange?: (stores: Store[]) => void
  onAddStore?: () => void
  onSearchFocus?: () => void
  searchTerm?: string
}

export default function StoreList({ onEdit, onStoresChange, onAddStore, onSearchFocus, searchTerm = '' }: StoreListProps) {
  const [stores, setStores] = useState<Store[]>([])
  const [allStores, setAllStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStores, setSelectedStores] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)

  const filterStores = (storesData: Store[], term: string) => {
    if (!term.trim()) {
      setStores(storesData)
      return
    }

    const lowerTerm = term.toLowerCase().trim()
    const filtered = storesData.filter((store) => {
      const name = store.name?.toLowerCase() || ''
      const ownerName = store.ownerName?.toLowerCase() || ''
      const location = store.location?.toLowerCase() || ''

      return (
        name.includes(lowerTerm) ||
        ownerName.includes(lowerTerm) ||
        location.includes(lowerTerm)
      )
    })
    setStores(filtered)
  }

  const fetchStores = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/stores')
      const data = await response.json()
      
      if (response.ok) {
        const storesData = data.stores || []
        setAllStores(storesData)
        filterStores(storesData, localSearchTerm)
        setSelectedStores(new Set())
        if (onStoresChange) {
          onStoresChange(storesData)
        }
      } else {
        console.error('매장 목록 조회 실패:', data.error)
      }
    } catch (error) {
      console.error('매장 목록 조회 에러:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // searchTerm prop이 변경되면 로컬 상태도 업데이트
  useEffect(() => {
    setLocalSearchTerm(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    fetchStores()
  }, [])

  useEffect(() => {
    filterStores(allStores, localSearchTerm)
  }, [localSearchTerm, allStores])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStores(new Set(stores.map(store => store.id)))
    } else {
      setSelectedStores(new Set())
    }
  }

  const handleSelectStore = (storeId: string, checked: boolean) => {
    const newSelected = new Set(selectedStores)
    if (checked) {
      newSelected.add(storeId)
    } else {
      newSelected.delete(storeId)
    }
    setSelectedStores(newSelected)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 매장을 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/stores/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(data.message || '매장이 성공적으로 삭제되었습니다.')
        fetchStores()
      } else {
        const data = await response.json()
        alert(data.error || '매장 삭제 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('매장 삭제 에러:', error)
      alert('매장 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedStores.size === 0) {
      alert('삭제할 매장을 선택해주세요.')
      return
    }

    if (!confirm(`선택한 ${selectedStores.size}개의 매장을 삭제하시겠습니까?`)) {
      return
    }

    try {
      setIsDeleting(true)
      const deletePromises = Array.from(selectedStores).map(async (storeId) => {
        const response = await fetch(`/api/stores/${storeId}`, { method: 'DELETE' })
        const data = await response.json()
        return { storeId, ok: response.ok, message: data.message || data.error }
      })
      const results = await Promise.allSettled(deletePromises)
      
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.ok).length
      const failCount = results.length - successCount
      
      if (failCount === 0) {
        alert(`선택한 ${successCount}개의 매장이 성공적으로 삭제되었습니다.`)
      } else {
        alert(`${successCount}개 성공, ${failCount}개 실패했습니다.`)
      }
      
      await fetchStores()
    } catch (err: any) {
      console.error('매장 삭제 에러:', err)
      alert('매장 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  const isAllSelected = stores.length > 0 && selectedStores.size === stores.length
  const isIndeterminate = selectedStores.size > 0 && selectedStores.size < stores.length

  const handleExportExcel = async () => {
    if (stores.length === 0) {
      alert('다운로드할 매장 정보가 없습니다.')
      return
    }

    // 엑셀 데이터 준비
    const excelData = stores.map((store) => ({
      '매장명': store.name,
      '점주명': store.ownerName,
      '위치': store.location,
      '타입': store.type,
      '상태': store.status === 'active' ? '운영중' : '비활성',
    }))

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('매장 목록')
    worksheet.columns = [
      { header: '매장명', key: '매장명', width: 20 },
      { header: '점주명', key: '점주명', width: 15 },
      { header: '위치', key: '위치', width: 30 },
      { header: '타입', key: '타입', width: 15 },
      { header: '상태', key: '상태', width: 10 },
    ]
    worksheet.addRows(excelData)

    const fileName = `매장_목록_${format(new Date(), 'yyyyMMdd_HHmmss', { locale: ko })}.xlsx`
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
        <p className="mt-4 text-gray-600 text-sm font-medium">매장 목록을 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              총 <span className="text-orange-600 font-bold">{stores.length}</span>개
            </span>
          </div>
          <div className="flex items-center gap-2">
          {onAddStore && (
            <button
              onClick={onAddStore}
              className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              <FiPlus className="w-4 h-4" />
              매장 등록
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
            disabled={isDeleting || selectedStores.size === 0}
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
            placeholder="매장명, 점주명, 위치로 검색"
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
                매장명
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                점주
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                위치
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                타입
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
            {stores.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <FiHome className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">등록된 매장이 없습니다</p>
                    <p className="text-gray-400 text-xs mt-1">새로운 매장을 등록해주세요</p>
                  </div>
                </td>
              </tr>
            ) : (
              stores.map((store) => (
                <tr 
                  key={store.id} 
                  className="hover:bg-orange-50/30 transition-colors border-b border-gray-50"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={selectedStores.has(store.id)}
                      onChange={(e) => handleSelectStore(store.id, e.target.checked)}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {store.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900 flex items-center justify-center gap-1">
                      <FiUser className="w-4 h-4 text-gray-400" />
                      {store.ownerName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm text-gray-700 max-w-xs truncate mx-auto flex items-center justify-center gap-1">
                      <FiMapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      {store.location}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {store.type}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        store.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {store.status === 'active' ? '운영중' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(store)}
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

