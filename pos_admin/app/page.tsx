'use client'

import Header from '@/components/Header'

export default function DashboardPage() {
  return (
    <div className="min-h-screen relative bg-white overflow-hidden">
      <div className="relative z-10">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center">
          <p className="text-xl text-gray-800">디자인 및 기능 준비중입니다.</p>
        </main>
      </div>
    </div>
  )
}
