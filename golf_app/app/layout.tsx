'use client'

import { Inter } from 'next/font/google'
import { Suspense, useEffect } from 'react'
import './globals.css'
import DesktopHeader from '@/components/Layout/DesktopHeader'
import MobileHomeHeader from '@/components/Layout/MobileHomeHeader'
import BottomNav from '@/components/Layout/BottomNav'
import { usePathname } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isOwnerPage = pathname === '/owner'
  const isPortfolioPage = pathname === '/portfolio'
  const isStandalonePage = isOwnerPage || isPortfolioPage

  // 결제 취소 시 PG가 루트(/)에 #63;storeId=... 같은 해시를 붙여 보냄 → 주소창만 깔끔하게 정리
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (!hash) return
    const isPgCancelJunk = hash.includes('storeId=') || hash.startsWith('#63')
    if (isPgCancelJunk) {
      const clean = window.location.pathname + (window.location.search || '')
      window.history.replaceState(null, '', clean)
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (document.querySelector('script[src*="adsbygoogle"]')) return
    const script = document.createElement('script')
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2179728846678072'
    script.async = true
    script.crossOrigin = 'anonymous'
    document.head.appendChild(script)
  }, [])

  // 탭 제목 항상 캐디BAE로 고정 (다른 페이지/스크립트가 바꿔도 복구)
  useEffect(() => {
    document.title = '캐디BAE'
    const t = setTimeout(() => { document.title = '캐디BAE' }, 100)
    return () => clearTimeout(t)
  }, [pathname])

  return (
    <html lang="ko" className={isStandalonePage ? "" : "h-full overflow-hidden"}>
      <head>
        <title>{isPortfolioPage ? "캐디BAE · 개발 포트폴리오" : "캐디BAE"}</title>
        <meta name="google-adsense-account" content="ca-pub-2179728846678072" />
      </head>
      <body className={`${inter.className} ${isStandalonePage ? "" : "h-full overflow-hidden flex flex-col"}`}>
        {!isStandalonePage && (
          <div className="hidden md:block flex-shrink-0">
            <DesktopHeader />
          </div>
        )}
        {(pathname === '/' || pathname === '/stores') && (
          <div className="md:hidden flex-shrink-0">
            <MobileHomeHeader />
          </div>
        )}
        <main className={isStandalonePage ? "pb-20 md:pb-0" : "flex-1 min-h-0 overflow-hidden overflow-x-hidden pb-20 md:pb-0"}>{children}</main>
        {!isStandalonePage && (
          <div className="md:hidden">
            <Suspense fallback={<div className="h-14 flex-shrink-0" />}>
              <BottomNav />
            </Suspense>
          </div>
        )}
      </body>
    </html>
  )
}

