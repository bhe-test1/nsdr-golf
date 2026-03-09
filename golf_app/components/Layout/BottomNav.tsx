'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { FiUser } from 'react-icons/fi'

export default function BottomNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'screen'

  // 모바일 하단바: 스크린 골프, 골프연습장, 파크골프, MY
  const navItems = [
    { href: '/?tab=screen', label: '스크린 골프', tabId: 'screen' },
    { href: '/?tab=range', label: '골프연습장', tabId: 'range' },
    { href: '/?tab=field', label: '파크골프', tabId: 'field' },
    { href: '/profile', label: 'MY', tabId: 'profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around py-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isProfile = item.tabId === 'profile'
          const isActive = isProfile
            ? pathname === '/profile' || pathname?.startsWith('/profile')
            : pathname === '/' && tab === item.tabId

          return (
            <Link
              key={item.tabId}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-2 min-w-[52px] transition ${
                isActive ? '' : 'text-gray-400'
              }`}
            >
              <FiUser className={`text-xl mb-0.5 ${isActive ? 'text-[#1e3a5f]' : 'text-gray-400'}`} />
              <span
                className={`text-[10px] ${isActive ? 'text-[#1e3a5f] font-semibold' : 'text-gray-400 font-medium'}`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
