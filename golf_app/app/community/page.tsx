'use client'

import { useState } from 'react'
import PostList from '@/components/Community/PostList'
import CommunitySidebar from '@/components/Community/CommunitySidebar'
import AdSenseFluid from '@/components/Common/AdSenseFluid'
import Link from 'next/link'
import { FiEdit3 } from 'react-icons/fi'
import { COMMUNITY_FEATURE_DISABLED } from '@/lib/community'

type SortType = 'latest' | 'popular' | 'views' | 'comments'

export default function CommunityPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sort, setSort] = useState<SortType>('latest')

  const sortTabs: { value: SortType; label: string }[] = [
    { value: 'latest', label: '최신글' },
    { value: 'popular', label: '인기글' },
    { value: 'views', label: '많이 본 글' },
    { value: 'comments', label: '댓글 많은 글' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-sky-50/40 to-sky-50/50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex gap-8">
          {/* 왼쪽 사이드바 */}
          <CommunitySidebar
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            disabled={COMMUNITY_FEATURE_DISABLED}
          />

          {/* 메인 콘텐츠 */}
          <main className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h1 className="text-xl font-bold text-gray-900">
                골프가 젤 좋아~ 🐧 친구들 모여라~ 🎶
              </h1>
              {COMMUNITY_FEATURE_DISABLED ? (
                <span
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00ACEE]/70 text-white rounded-lg text-sm font-medium cursor-not-allowed shrink-0 shadow-sm shadow-sky-200/50 opacity-90"
                  aria-hidden
                >
                  <FiEdit3 className="w-4 h-4" />
                  글 작성하기
                </span>
              ) : (
                <Link
                  href="/community/write"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00ACEE] text-white rounded-lg text-sm font-medium hover:bg-[#0088c2] shadow-sm shadow-sky-200/50 transition shrink-0"
                >
                  <FiEdit3 className="w-4 h-4" />
                  글 작성하기
                </Link>
              )}
            </div>

            {/* 정렬 탭 - 4등분 (비활성화 시 클릭 무반응) */}
            <div className="flex gap-1 p-1 rounded-lg bg-white/90 border border-sky-200 mb-4 shadow-sm">
              {sortTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => !COMMUNITY_FEATURE_DISABLED && setSort(tab.value)}
                  className={`flex-1 min-w-0 py-2.5 rounded-md text-sm font-medium text-center transition-colors ${
                    COMMUNITY_FEATURE_DISABLED ? 'cursor-default' : ''
                  } ${
                    sort === tab.value
                      ? 'bg-sky-200 text-blue-900'
                      : 'text-gray-600 hover:bg-sky-50 hover:text-gray-900'
                  }`}
                  disabled={COMMUNITY_FEATURE_DISABLED}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 게시글 목록 (비활성화 시 API 호출 없이 빈 상태만 표시) */}
            <PostList category={selectedCategory} sort={sort} disabled={COMMUNITY_FEATURE_DISABLED} />
            {/* 플루이드 광고 - 피드 끝 (높이 가변) */}
            <div className="mt-4 min-h-0">
              <AdSenseFluid />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
