'use client'

import { useState, useEffect, forwardRef } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'

interface OwnerSearchProps {
  onSearch?: (searchTerm: string) => void
}

const OwnerSearch = forwardRef<HTMLInputElement, OwnerSearchProps>(({ onSearch }, ref) => {
  const [searchTerm, setSearchTerm] = useState('')

  // 실시간 검색 (입력할 때마다 검색)
  useEffect(() => {
    if (onSearch) {
      onSearch(searchTerm)
    }
  }, [searchTerm, onSearch])

  const handleClear = () => {
    setSearchTerm('')
    if (onSearch) {
      onSearch('')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={ref}
          type="text"
          placeholder="대표자명, 연락처, 매장명 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
            title="검색어 지우기"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
})

OwnerSearch.displayName = 'OwnerSearch'

export default OwnerSearch

