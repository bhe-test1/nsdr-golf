'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { FiHome, FiUsers, FiShoppingBag, FiLogOut, FiHeadphones, FiCalendar } from 'react-icons/fi'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [userName, setUserName] = useState('담당자')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // 클라이언트에서만 마운트됨을 표시
    setMounted(true)
    // 초기 시간 설정
    setCurrentTime(new Date())
    
    // 세션 스토리지에서 사용자명 가져오기
    const storedUserName = sessionStorage.getItem('userName')
    if (storedUserName) {
      setUserName(storedUserName)
    }
    
    // 1초마다 시간 업데이트
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 날짜와 시간 포맷팅: 날짜·요일·시간 구분
  const formattedDate = currentTime
    ? (() => {
        const dateStr = format(currentTime, 'M월 d일 EEEE', { locale: ko })
        const hours = currentTime.getHours()
        const minutes = currentTime.getMinutes()
        const seconds = currentTime.getSeconds()
        return {
          date: dateStr,
          time: `${hours}시 ${minutes.toString().padStart(2, '0')}분 ${seconds.toString().padStart(2, '0')}초`
        }
      })()
    : { date: '', time: '' }

  const menuItems = [
    { icon: FiUsers, label: '사용자정보', href: '/users' },
    { icon: FiCalendar, label: '예약관리', href: '/reservations' },
    { icon: FiHome, label: '홈화면', href: '/' },
    { icon: FiShoppingBag, label: '매장정보', href: '/store' },
    { icon: FiHeadphones, label: '고객센터', href: '/support' },
  ]

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      // 세션 스토리지 클리어
      sessionStorage.removeItem('isAuthenticated')
      sessionStorage.removeItem('userName')
      // 로그인 페이지로 리다이렉트
      router.push('/login')
    }
  }

  return (
    <header className="bg-[#1e3a5f] text-white shadow-md">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-20 gap-4">
          {/* 좌측: 날짜·시간 */}
          <div className="flex items-center justify-start gap-2">
            {mounted ? (
              <>
                <span className="text-base font-medium text-white whitespace-nowrap">
                  {formattedDate.date}
                </span>
                <span className="text-white">|</span>
                <span className="text-base font-medium text-white tabular-nums whitespace-nowrap">
                  {formattedDate.time}
                </span>
              </>
            ) : (
              <span className="text-base text-white">로딩 중...</span>
            )}
          </div>

          {/* 중앙: 페이지 버튼 (진짜 가운데 정렬) */}
          <div className="flex items-center justify-center">
            <nav className="flex items-center gap-6 sm:gap-8">
              {menuItems.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                const isHome = item.href === '/'
                const isCenter = index === Math.floor(menuItems.length / 2)
                return (
                  <div key={item.label} className="relative group">
                    <button
                      onClick={() => router.push(item.href)}
                      className={`rounded-xl transition-all ${
                        isHome && isCenter
                          ? 'px-5 py-3 flex flex-col items-center justify-center min-w-[5.5rem] text-white hover:bg-white/10'
                          : 'p-3 rounded-xl'
                      } ${
                        !(isHome && isCenter) &&
                        (isActive
                          ? 'bg-white/20 text-white'
                          : 'text-white hover:bg-white/10 hover:text-white')
                      }`}
                    >
                      {isHome && isCenter ? (
                        <>
                          <span className="text-[24px] font-bold tracking-widest text-white leading-tight">
                            NSDR
                          </span>
                          <span className="text-[10px] font-light tracking-widest text-white -mt-0.5 leading-tight">
                            Non-Stop Driving Range
                          </span>
                        </>
                      ) : (
                        <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                      )}
                    </button>
                    <span
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2.5 py-1 bg-gray-800 text-white text-xs font-medium rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none"
                      aria-hidden
                    >
                      {item.label}
                    </span>
                  </div>
                )
              })}
            </nav>
          </div>

          {/* 우측: 로그아웃 */}
          <div className="flex items-center justify-end">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-sm font-bold uppercase tracking-wider transition-colors"
            >
              <FiLogOut className="w-4 h-4" />
              <span>LOG OUT</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
