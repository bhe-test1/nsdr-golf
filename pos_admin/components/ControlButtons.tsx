'use client'

import { useState, useRef, useEffect } from 'react'
import { FiPower, FiChevronLeft, FiChevronRight, FiChevronDown, FiSliders } from 'react-icons/fi'
import { RiDoorOpenLine } from 'react-icons/ri'

interface ControlButtonsProps {
  onBatchClose?: () => void
  onDoorOpen?: () => void
  onSeasonPass?: () => void
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
}

export default function ControlButtons({
  onBatchClose,
  onDoorOpen,
  onSeasonPass,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: ControlButtonsProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDoorOpen = () => {
    setMenuOpen(false)
    onDoorOpen?.()
  }

  const handleBatchCloseFromMenu = () => {
    setMenuOpen(false)
    onBatchClose?.()
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange?.(page)
    }
  }

  // 페이지 번호 생성 (최대 5개 표시)
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      // 전체 페이지가 5개 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 현재 페이지 기준으로 앞뒤 2개씩 표시
      let start = Math.max(1, currentPage - 2)
      let end = Math.min(totalPages, currentPage + 2)
      
      // 시작이 1이 아니면 1 추가
      if (start > 1) {
        pages.push(1)
        if (start > 2) pages.push('...')
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      // 끝이 마지막이 아니면 마지막 추가
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  return (
    <div className="flex items-center space-x-3">
      {/* 정기권 구매 */}
      <button
        type="button"
        onClick={onSeasonPass}
        className="px-6 py-3 bg-sky-500 text-white font-medium rounded-lg shadow-sm hover:bg-sky-600 transition-colors"
      >
        정기권 구매
      </button>
      {/* 드롭다운: 출입문 열기 / 전체 종료 */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="px-6 py-3 bg-sky-500 text-white font-medium rounded-lg flex items-center space-x-2 shadow-sm hover:bg-sky-600 transition-colors"
        >
          <FiSliders className="w-5 h-5" />
          <span>제어관리</span>
          <FiChevronDown className={`w-5 h-5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>
        {menuOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50 overflow-hidden">
            <button
              type="button"
              onClick={handleDoorOpen}
              className="w-full px-4 py-3 text-left flex items-center space-x-2 text-gray-700 rounded-t-lg bg-white hover:bg-gray-50 min-h-[3rem]"
            >
              <RiDoorOpenLine className="w-5 h-5 shrink-0" />
              <span>출입문 열기</span>
            </button>
            <button
              type="button"
              onClick={handleBatchCloseFromMenu}
              className="w-full px-4 py-3 text-left flex items-center space-x-2 text-gray-700 rounded-b-lg bg-white hover:bg-gray-50 min-h-[3rem]"
            >
              <FiPower className="w-5 h-5 shrink-0 text-blue-500" />
              <span>전체 종료</span>
            </button>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center space-x-1 ml-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>
          
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                  ...
                </span>
              )
            }
            
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page as number)}
                className={`px-3 py-2 rounded-lg font-medium ${
                  currentPage === page
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {page}
              </button>
            )
          })}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
