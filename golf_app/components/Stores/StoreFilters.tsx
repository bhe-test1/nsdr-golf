'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FiSearch, FiChevronDown } from 'react-icons/fi'

const REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산',
  '강원', '경남', '경북', '전남', '전북', '충남', '충북', '세종', '제주',
]

export default function StoreFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [locationOpen, setLocationOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (location) params.set('location', location)
    router.push(`/stores?${params.toString()}`)
  }

  const handleCollapse = () => {
    handleSearch()
    setIsCollapsed(true)
  }

  const handleFavoriteStores = () => {
    // 페이지 이동 없음 (현재 페이지 유지)
  }

  return (
    <div className="p-0 md:px-0 md:py-4 mb-5 md:mb-6">
      {/* 접혀 있을 때: 펼치기 버튼만 표시 */}
      {isCollapsed && (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="w-full h-10 md:h-11 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 flex items-center justify-center gap-2"
        >
          <FiChevronDown className="w-4 h-4 rotate-[-90deg]" />
          검색 필터 펼치기
        </button>
      )}

      {!isCollapsed && (
      <form onSubmit={handleSearch} className="space-y-2 md:space-y-3">
        {/* 1줄: 검색창(넓게) + 즐겨찾는 매장(버튼 비율) | 위와 같은 높이 */}
        <div className="flex gap-1.5 items-stretch">
          <div className="flex-1 min-w-0 relative">
            <FiSearch className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4" />
            <input
              type="text"
              placeholder="매장명, 지역명으로 검색하세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 md:h-11 pl-8 md:pl-10 pr-3 md:pr-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-300"
            />
          </div>
          <button
            type="button"
            onClick={handleFavoriteStores}
            className="md:hidden flex-shrink-0 h-10 md:h-11 w-[7.25rem] px-3 border border-gray-300 rounded-lg text-xs font-medium bg-white text-gray-800 hover:bg-sky-50 hover:border-[#00ACEE] focus:outline-none focus:ring-2 focus:ring-[#00ACEE] transition whitespace-nowrap inline-flex items-center justify-center"
          >
            즐겨찾는 매장
          </button>
        </div>

        {/* 2줄: 지역 선택(넓게) + 접어두기(버튼 비율) | 모바일에서 숨김 */}
        <div className="hidden md:flex gap-1.5 items-stretch">
          <div className="flex-1 relative min-w-0">
            <button
              type="button"
              onClick={() => setLocationOpen(!locationOpen)}
              className="w-full h-10 md:h-11 px-2.5 md:px-3 border border-gray-300 rounded-lg text-xs md:text-sm text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-[#00ACEE]"
            >
              <span className={`truncate ${!location ? 'text-gray-400' : 'text-gray-800'}`}>
                {location || '지역을 선택해주세요'}
              </span>
              <FiChevronDown className={`flex-shrink-0 ml-1 text-gray-400 transition-transform ${locationOpen ? 'rotate-180' : ''} w-3.5 h-3.5 md:w-4 md:h-4`} />
            </button>
            {locationOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 md:max-h-48 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setLocation('')
                    setLocationOpen(false)
                  }}
                  className={`w-full px-2.5 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-left hover:bg-sky-50 ${!location ? 'bg-sky-50 text-blue-600' : 'text-gray-600'}`}
                >
                  지역을 선택해주세요
                </button>
                {REGIONS.map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => {
                      setLocation(region)
                      setLocationOpen(false)
                    }}
                    className={`w-full px-2.5 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-left hover:bg-sky-50 ${location === region ? 'bg-sky-50 text-blue-600' : 'text-gray-800'}`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleFavoriteStores}
            className="hidden md:inline-flex flex-shrink-0 h-10 md:h-11 w-[7.25rem] px-3 border border-gray-300 rounded-lg text-xs md:text-sm font-medium bg-white text-gray-800 hover:bg-sky-50 hover:border-[#00ACEE] focus:outline-none focus:ring-2 focus:ring-[#00ACEE] transition whitespace-nowrap items-center justify-center"
          >
            즐겨찾는 매장
          </button>
          <button
            type="button"
            onClick={handleCollapse}
            className="flex-shrink-0 h-10 md:h-11 w-[7.25rem] px-4 border border-gray-300 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-50 inline-flex items-center justify-center select-none whitespace-nowrap"
          >
            접어두기
          </button>
        </div>
      </form>
      )}
    </div>
  )
}
