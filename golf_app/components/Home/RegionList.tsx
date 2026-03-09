'use client'

import { FiMapPin } from 'react-icons/fi'
import { FaPlane } from 'react-icons/fa'
import Link from 'next/link'

export default function RegionList() {
  const regions = [
    { name: '경기북부', count: 340 },
    { name: '강원서부', count: 369 },
    { name: '경기남부', count: 886 },
    { name: '강원동부', count: 154 },
    { name: '전라북부', count: 300 },
    { name: '충청북부', count: 446 },
    { name: '경상북부', count: 836 },
    { name: '전라남부', count: 632 },
    { name: '충청남부', count: 342 },
    { name: '경상남부', count: 743 },
    { name: '제주', count: 255 },
  ]

  return (
    <div className="px-4 py-4 bg-white">
      {/* 가까운 골프장 버튼 */}
      <div className="mb-4">
        <Link
          href="/stores?location=청담동"
          className="flex items-center justify-center space-x-2 bg-sky-50 border border-sky-200 rounded-lg p-3.5 hover:bg-sky-100 transition"
        >
          <FiMapPin className="text-blue-600 text-lg" />
          <div className="text-center">
            <div className="font-semibold text-blue-600 text-sm">가까운 골프장</div>
            <div className="text-xs text-gray-500">(청담동)</div>
          </div>
        </Link>
      </div>

      {/* 지역 그리드 */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {regions.map((region, index) => (
          <Link
            key={index}
            href={`/stores?location=${region.name}`}
            className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 hover:border-gray-300 transition text-center"
          >
            <div className="font-semibold text-gray-800 text-sm mb-1">{region.name}</div>
            <div className="text-xs text-gray-500">{region.count}팀</div>
          </Link>
        ))}
      </div>

      {/* 투어 버튼 */}
      <Link
        href="/tour"
        className="flex items-center justify-center space-x-2 bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition mb-4"
      >
        <FaPlane className="text-gray-600 text-base" />
        <span className="font-medium text-gray-700 text-sm">국내/해외 투어</span>
      </Link>

      {/* 페이지네이션 점 */}
      <div className="flex justify-center mb-3">
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
        </div>
      </div>

      {/* 요약 정보 */}
      <div className="pt-3 border-t border-gray-100 text-center text-xs text-gray-500">
        <span>전체지역</span>
        <span className="mx-2">•</span>
        <span>선호지역 0</span>
        <span className="mx-2">•</span>
        <span>내 골프장 0</span>
      </div>
    </div>
  )
}

