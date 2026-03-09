'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function DesktopHeader() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setIsLoggedIn(false)
          setIsChecking(false)
          return
        }

        // 토큰 유효성 검증
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          setIsLoggedIn(true)
        } else {
          // 토큰이 유효하지 않으면 제거
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setIsLoggedIn(false)
        }
      } catch (error) {
        // 에러 발생 시 로그인하지 않은 것으로 처리
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setIsLoggedIn(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()

    // 인증 상태 변경 이벤트 리스너 추가
    const handleAuthStateChanged = () => {
      checkAuth()
    }

    window.addEventListener('authStateChanged', handleAuthStateChanged)

    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChanged)
    }
  }, [])

  const navItems: { href: string; label: string; highlight: boolean }[] = []

  return (
    <header className="sticky top-0 z-50 bg-[#3952B6] shadow-lg border-b border-white/10">
      <div className="w-full pl-4 pr-5 flex items-center justify-between h-14 gap-4">
          {/* 로고 - 부킹맨 (약간 입체감) */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/logo_bookingman.png"
              alt="부킹맨"
              width={90}
              height={28}
              className="h-7 w-auto object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
          </Link>

          {/* 네비게이션 메뉴 */}
          {navItems.length > 0 && (
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative inline-flex justify-center"
                >
                  <span className={`text-lg font-semibold text-white px-3.5 py-2 rounded-lg transition-all duration-300 min-w-[7.5rem] text-center ${
                    isActive 
                      ? 'bg-white/20' 
                      : ''
                  }`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-white rounded-full"></span>
                  )}
                </Link>
              )
            })}
          </nav>
          )}

          {/* 오른쪽: 버튼들 + powered by NSDR (우측 끝 착 붙임) */}
          <div className="flex items-center gap-20 flex-1 justify-end min-w-0 ml-auto">
            {/* 마이페이지(테두리) / 회원가입(테두리) + 로그인·로그아웃(흰 배경) */}
            <div className="flex items-center gap-2 shrink-0">
              {!isChecking && isLoggedIn ? (
                <>
                  <Link
                    href="/profile"
                    className="px-4 py-2 text-sm font-semibold text-white rounded-lg border-2 border-white bg-transparent hover:bg-white/10 transition"
                  >
                    마이페이지
                  </Link>
                  <button
                    onClick={() => {
                      localStorage.removeItem('token')
                      localStorage.removeItem('user')
                      setIsLoggedIn(false)
                      window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { isLoggedIn: false } }))
                      window.location.href = '/'
                    }}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white rounded-lg hover:bg-gray-100 transition shadow-sm"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="px-4 py-2 text-sm font-semibold text-white rounded-lg border-2 border-white bg-transparent hover:bg-white/10 transition"
                  >
                    회원가입
                  </Link>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white rounded-lg hover:bg-gray-100 transition shadow-sm"
                  >
                    로그인
                  </Link>
                </>
              )}
            </div>

            {/* powered by NSDR - PC에서도 우측 끝에 착 붙임 */}
            <div className="hidden lg:flex items-center shrink-0 order-last mr-0">
              <Image src="/icon_top.png" alt="powered by NSDR" width={70} height={16} className="h-4 w-auto object-contain" style={{ width: 'auto', height: 'auto' }} />
            </div>
          </div>
      </div>
    </header>
  )
}

