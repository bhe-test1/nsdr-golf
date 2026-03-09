'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FiGrid, FiStar, FiUsers, FiMessageCircle, FiEdit3, FiMessageSquare } from 'react-icons/fi'
import { MdLightbulb } from 'react-icons/md'

interface CommunitySidebarProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
  /** true면 카테고리/나의 활동 클릭 비활성화 (디자인만 유지) */
  disabled?: boolean
}

const categories = [
  { value: 'all', label: '전체', icon: FiGrid },
  { value: 'review', label: '후기', icon: FiStar },
  { value: 'tip', label: '팁', icon: MdLightbulb },
  { value: 'mate', label: '동반자', icon: FiUsers },
  { value: 'general', label: '자유', icon: FiMessageCircle },
]

export default function CommunitySidebar({
  selectedCategory,
  onCategoryChange,
  disabled = false,
}: CommunitySidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleMyActivityClick = (e: React.MouseEvent, targetPath: string) => {
    if (disabled) {
      e.preventDefault()
      return
    }
    if (pathname === targetPath) {
      e.preventDefault()
      router.push('/community')
    }
  }

  const baseCategoryClass = (isActive: boolean) =>
    `w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-left border-l-4 transition-colors ${
      isActive
        ? 'border-[#00ACEE] text-blue-800 bg-sky-100/80 font-semibold'
        : 'border-transparent text-gray-700'
    } ${disabled ? 'cursor-default pointer-events-none' : ''}`

  const baseMyActivityClass = (isActive: boolean) =>
    `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border-l-4 transition-colors ${
      isActive
        ? 'border-[#00ACEE] text-blue-800 bg-sky-100/80 font-semibold'
        : 'border-transparent text-gray-700'
    } ${disabled ? 'cursor-default pointer-events-none' : ''}`

  return (
    <aside className="w-full sm:w-52 shrink-0">
      <div className="sticky top-24 space-y-6">
        {/* 카테고리 */}
        <nav className="space-y-0.5">
          {categories.map((item) => {
            const Icon = item.icon
            const isActive = selectedCategory === item.value
            return disabled ? (
              <span
                key={item.value}
                className={baseCategoryClass(isActive)}
                aria-hidden
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-700' : 'text-gray-600'}`} />
                {item.label}
              </span>
            ) : (
              <button
                key={item.value}
                type="button"
                onClick={() => onCategoryChange(item.value)}
                className={baseCategoryClass(isActive)}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-700' : 'text-gray-600'}`} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* 나의 활동 */}
        <div>
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 mb-2">
            나의 활동
          </h3>
          <ul className="space-y-0.5">
            <li>
              {disabled ? (
                <span
                  className={baseMyActivityClass(pathname === '/community/my-posts')}
                  aria-hidden
                >
                  <FiEdit3 className={`w-4 h-4 shrink-0 ${pathname === '/community/my-posts' ? 'text-blue-700' : 'text-gray-600'}`} />
                  내가 쓴 글
                </span>
              ) : (
                <Link
                  href="/community/my-posts"
                  onClick={(e) => handleMyActivityClick(e, '/community/my-posts')}
                  className={baseMyActivityClass(pathname === '/community/my-posts')}
                >
                  <FiEdit3 className={`w-4 h-4 shrink-0 ${pathname === '/community/my-posts' ? 'text-blue-700' : 'text-gray-600'}`} />
                  내가 쓴 글
                </Link>
              )}
            </li>
            <li>
              {disabled ? (
                <span
                  className={baseMyActivityClass(pathname === '/community/my-comments')}
                  aria-hidden
                >
                  <FiMessageSquare className={`w-4 h-4 shrink-0 ${pathname === '/community/my-comments' ? 'text-blue-700' : 'text-gray-600'}`} />
                  내가 쓴 댓글
                </span>
              ) : (
                <Link
                  href="/community/my-comments"
                  onClick={(e) => handleMyActivityClick(e, '/community/my-comments')}
                  className={baseMyActivityClass(pathname === '/community/my-comments')}
                >
                  <FiMessageSquare className={`w-4 h-4 shrink-0 ${pathname === '/community/my-comments' ? 'text-blue-700' : 'text-gray-600'}`} />
                  내가 쓴 댓글
                </Link>
              )}
            </li>
          </ul>
        </div>
      </div>
    </aside>
  )
}
