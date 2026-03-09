'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { FiMenu, FiX } from 'react-icons/fi'

export default function MobileHeader() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setIsLoggedIn(false)
          setIsChecking(false)
          return
        }

        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        })

        if (response.ok) {
          setIsLoggedIn(true)
        } else {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setIsLoggedIn(false)
        }
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setIsLoggedIn(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()

    const handleAuthStateChanged = () => {
      checkAuth()
    }

    window.addEventListener('authStateChanged', handleAuthStateChanged)
    return () => window.removeEventListener('authStateChanged', handleAuthStateChanged)
  }, [])

  const navItems: { href: string; label: string; highlight: boolean }[] = []

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#3952B6] shadow-lg border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center" onClick={() => setMenuOpen(false)}>
              <span className="text-xl font-extrabold text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
                🦋나비
              </span>
            </Link>

            <div className="flex items-center gap-2">
              {!isChecking && isLoggedIn ? (
                <div className="flex items-center gap-1.5">
                  <Link
                    href="/profile"
                    className="px-3 py-2 text-sm font-semibold text-white rounded-lg border-2 border-white bg-transparent"
                    onClick={() => setMenuOpen(false)}
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
                      setMenuOpen(false)
                    }}
                    className="px-3 py-2 text-sm font-semibold text-gray-700 bg-white rounded-lg shadow-sm"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link
                    href="/register"
                    className="px-3 py-2 text-sm font-semibold text-white rounded-lg border-2 border-white bg-transparent"
                    onClick={() => setMenuOpen(false)}
                  >
                    회원가입
                  </Link>
                  <Link
                    href="/login"
                    className="px-3 py-2 text-sm font-semibold text-gray-700 bg-white rounded-lg shadow-sm"
                    onClick={() => setMenuOpen(false)}
                  >
                    로그인
                  </Link>
                </div>
              )}

              {navItems.length > 0 && (
              <button
                type="button"
                className="p-2 text-white rounded-lg hover:bg-white/10"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
              >
                {menuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
              </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 모바일 메뉴 패널 - 데스크톱과 동일한 메뉴 */}
      {navItems.length > 0 && menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      {navItems.length > 0 && (
      <div
        className={`fixed top-14 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-lg md:hidden transition-all ${
          menuOpen ? 'block' : 'hidden'
        }`}
      >
        <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-base font-medium ${
                  isActive ? 'bg-[#e6f4ff] text-[#00ACEE]' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
      )}
    </>
  )
}
