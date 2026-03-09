'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiUser, FiHeart, FiCalendar } from 'react-icons/fi'
import { useState, useEffect } from 'react'

export default function Header() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      // 로그인 상태 확인
      const token = localStorage.getItem('token')
      setIsLoggedIn(!!token)
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

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    // 인증 상태 변경 이벤트 발생
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { isLoggedIn: false } }))
    window.location.href = '/'
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">⛳</span>
            </div>
            <span className="text-xl font-bold text-blue-600">골프 예약</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={`${
                pathname === '/' ? 'text-blue-600 font-semibold' : 'text-gray-600'
              } hover:text-blue-600 transition`}
            >
              홈
            </Link>
            <Link
              href="/stores"
              className={`${
                pathname === '/stores' ? 'text-blue-600 font-semibold' : 'text-gray-600'
              } hover:text-blue-600 transition`}
            >
              골프장 찾기
            </Link>
            {isLoggedIn && (
              <>
                <Link
                  href="/reservations"
                  className={`${
                    pathname === '/reservations' ? 'text-blue-600 font-semibold' : 'text-gray-600'
                  } hover:text-blue-600 transition flex items-center space-x-1`}
                >
                  <FiCalendar />
                  <span>예약 내역</span>
                </Link>
                <Link
                  href="/favorites"
                  className={`${
                    pathname === '/favorites' ? 'text-blue-600 font-semibold' : 'text-gray-600'
                  } hover:text-blue-600 transition flex items-center space-x-1`}
                >
                  <FiHeart />
                  <span>즐겨찾기</span>
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/profile"
                  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition"
                >
                  <FiUser />
                  <span>마이페이지</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-gray-600 hover:text-blue-600 transition"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-gray-600">
                <Link
                  href="/register"
                  className="px-4 py-2 hover:text-blue-600 transition"
                >
                  회원가입
                </Link>
                <span className="mx-1">|</span>
                <Link
                  href="/login"
                  className="px-4 py-2 hover:text-blue-600 transition"
                >
                  로그인
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

