'use client'

import { useState } from 'react'
import { FiSearch, FiMapPin } from 'react-icons/fi'
import { useRouter } from 'next/navigation'

export default function SearchSection() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (location) params.set('location', location)
    if (category) params.set('category', category)
    router.push(`/stores?${params.toString()}`)
  }

  return (
    <div className="bg-gradient-to-r from-[#00ACEE] to-[#0088c2] rounded-2xl p-8 mb-8 text-white">
      <h1 className="text-3xl font-bold mb-2">골프장을 찾아보세요</h1>
      <p className="text-sky-100 mb-6">원하는 날짜와 지역으로 골프장을 검색하세요</p>
      
      <form onSubmit={handleSearch} className="bg-white rounded-lg p-4 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 border border-gray-300 rounded-lg px-4 py-3">
              <FiSearch className="text-gray-400" />
              <input
                type="text"
                placeholder="골프장 이름으로 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 outline-none text-gray-800"
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center space-x-2 border border-gray-300 rounded-lg px-4 py-3">
              <FiMapPin className="text-gray-400" />
              <input
                type="text"
                placeholder="지역 (예: 서울, 경기)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1 outline-none text-gray-800"
              />
            </div>
          </div>
          
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none text-gray-800"
            >
              <option value="">전체 카테고리</option>
              <option value="SG">서울/경기</option>
              <option value="GW">강원</option>
              <option value="CB">충북</option>
              <option value="CN">충남</option>
              <option value="GB">경북</option>
              <option value="GN">경남</option>
              <option value="JB">전북</option>
              <option value="JN">전남</option>
              <option value="JJ">제주</option>
            </select>
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full mt-4 bg-[#00ACEE] text-white py-3 rounded-lg font-semibold hover:bg-[#0088c2] transition"
        >
          검색하기
        </button>
      </form>
    </div>
  )
}

