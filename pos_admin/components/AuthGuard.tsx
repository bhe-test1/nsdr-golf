'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true)

  useEffect(() => {
    // 로그인 페이지는 인증 체크 제외
    if (pathname === '/login') {
      return
    }

    // 세션 스토리지에서 인증 상태 확인
    const checkAuth = () => {
      const auth = sessionStorage.getItem('isAuthenticated')
      
      if (auth !== 'true') {
        // 로그인 페이지로 리다이렉트
        router.push('/login')
        return
      }
    }

    checkAuth()

    // 로그인 직후인지 확인 (10초 이내) - 쿠키가 완전히 반영될 때까지 대기
    const loginTime = sessionStorage.getItem('loginTime')
    const now = Date.now()
    const isJustLoggedIn = loginTime && (now - parseInt(loginTime)) < 10000

    // 세션 확인 및 비밀번호 변경 감지
    const checkSession = async () => {
      try {
        // 로그인 직후에는 쿠키가 아직 반영되지 않았을 수 있으므로 스킵
        if (isJustLoggedIn) {
          console.log('로그인 직후이므로 세션 확인 스킵')
          return
        }

        const response = await fetch('/api/auth/check-session', {
          method: 'GET',
          credentials: 'include',
        })

        const data = await response.json()

        if (!response.ok || !data.authenticated) {
          // 인증 실패 시 로그인 페이지로 리다이렉트
          sessionStorage.removeItem('isAuthenticated')
          sessionStorage.removeItem('userName')
          sessionStorage.removeItem('loginTime')
          router.push('/login')
          return
        }

        // 비밀번호 변경 감지 기능 제거됨
      } catch (error) {
        console.error('세션 확인 에러:', error)
      }
    }

    // 로그인 직후가 아니면 즉시 확인, 아니면 5초 후 확인
    if (isJustLoggedIn) {
      setTimeout(checkSession, 5000)
    } else {
      checkSession()
    }

    // 주기적으로 세션 확인 (30초마다)
    const interval = setInterval(checkSession, 30000)

    return () => clearInterval(interval)
  }, [router, pathname])

  // 로그인 페이지는 그대로 표시
  if (pathname === '/login') {
    return <>{children}</>
  }

  return <>{children}</>
}
