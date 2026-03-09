'use client'

import { useState } from 'react'
import { FiSearch, FiMapPin } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SearchBar() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/stores?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="px-4 py-4 bg-white border-b border-gray-100">
      <div className="flex items-center space-x-3">
        {/* 검색 입력창 */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2.5">
            <FiSearch className="text-gray-400 text-base" />
            <input
              type="text"
              placeholder="골프장 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-gray-700"
            />
          </div>
        </form>

        {/* 가까운 골프장 버튼 */}
        <Link
          href="/stores?location=청담동"
          className="flex items-center justify-center space-x-2 bg-sky-50 border border-sky-200 rounded-lg px-4 py-2.5 hover:bg-sky-100 transition whitespace-nowrap"
        >
          <FiMapPin className="text-blue-600 text-base" />
          <div className="text-center">
            <div className="font-semibold text-blue-600 text-sm">가까운 골프장</div>
            <div className="text-xs text-gray-500">(청담동)</div>
          </div>
        </Link>
      </div>
    </div>
  )
}

