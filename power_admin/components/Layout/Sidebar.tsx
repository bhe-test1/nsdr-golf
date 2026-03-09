'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FiHome, 
  FiUsers, 
  FiShoppingBag,
  FiUser,
  FiBell
} from 'react-icons/fi'
import clsx from 'clsx'

const menuItems = [
  { href: '/dashboard', label: '대시보드', icon: FiHome },
  { href: '/owners', label: '점주 관리', icon: FiUsers },
  { href: '/stores', label: '매장 관리', icon: FiShoppingBag },
  { href: '/notices', label: '공지사항', icon: FiBell },
]

const profileMenuItem = { href: '/profile', label: '내 정보', icon: FiUser }

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="bg-gradient-to-br from-orange-100 via-amber-100 to-orange-200 shadow-2xl h-screen flex flex-col fixed left-0 top-0 z-50 backdrop-blur-sm w-64">
      {/* 헤더 */}
      <div className="border-b border-orange-300/60 flex-shrink-0 bg-gradient-to-r from-orange-100/90 to-amber-100/90 backdrop-blur-sm relative p-6">
        <div className="flex items-center">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-orange-900 leading-tight truncate">NSDR 관리자</h1>
          </div>
        </div>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-0">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const isLast = index === menuItems.length - 1
            return (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center rounded-xl transition-all duration-300 relative group px-4 py-3 gap-3',
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-lg shadow-orange-500/30'
                      : 'text-orange-900 font-medium hover:bg-white/60 hover:shadow-md'
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                  )}
                  <Icon className={clsx(
                    'transition-all duration-300 flex-shrink-0 w-5 h-5',
                    isActive 
                      ? 'text-white' 
                      : 'text-orange-700 group-hover:text-orange-600 group-hover:scale-110'
                  )} />
                  <span className={clsx(
                    'transition-all duration-300 whitespace-nowrap',
                    isActive ? 'text-white' : 'group-hover:text-orange-800'
                  )}>{item.label}</span>
                </Link>
                {!isLast && (
                  <div className="mx-4 h-px bg-gradient-to-r from-transparent via-orange-300/50 to-transparent"></div>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 하단 프로필 */}
      <div className="border-t border-orange-300/60 bg-gradient-to-r from-orange-200/80 to-amber-200/80 backdrop-blur-sm flex-shrink-0 p-3">
        {(() => {
          const ProfileIcon = profileMenuItem.icon
          const isActive = pathname === profileMenuItem.href
          return (
            <Link
              href={profileMenuItem.href}
              className={clsx(
                'flex items-center rounded-xl transition-all duration-300 relative group px-4 py-3 gap-3',
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-lg shadow-orange-500/30'
                  : 'text-orange-900 font-medium hover:bg-white/60 hover:shadow-md'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
              )}
              <ProfileIcon className={clsx(
                'transition-all duration-300 flex-shrink-0 w-5 h-5',
                isActive 
                  ? 'text-white' 
                  : 'text-orange-700 group-hover:text-orange-600 group-hover:scale-110'
              )} />
              <span className={clsx(
                'transition-all duration-300 whitespace-nowrap',
                isActive ? 'text-white' : 'group-hover:text-orange-800'
              )}>{profileMenuItem.label}</span>
            </Link>
          )
        })()}
      </div>
    </aside>
  )
}

