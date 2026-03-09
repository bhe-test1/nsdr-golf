'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiUser, FiLock, FiLogIn } from 'react-icons/fi'

export default function LoginPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // 이미 로그인되어 있으면 메인 페이지로 리다이렉트
    const isAuthenticated = sessionStorage.getItem('isAuthenticated')
    if (isAuthenticated === 'true') {
      router.push('/')
      return
    }

    // 로컬 스토리지에서 이전에 로그인했던 이름 불러오기
    const lastLoginName = localStorage.getItem('lastLoginName')
    if (lastLoginName) {
      setName(lastLoginName)
    }
    // 비밀번호는 항상 빈 값으로 시작
    setPassword('')
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // 간단한 유효성 검사
    if (!name || !password) {
      setError('이름과 비밀번호를 모두 입력해주세요.')
      setIsLoading(false)
      return
    }

    // API를 통한 로그인 처리
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '로그인에 실패했습니다.')
        setIsLoading(false)
        return
      }

      // 로그인 성공
      sessionStorage.setItem('isAuthenticated', 'true')
      sessionStorage.setItem('userName', data.owner.name)
      sessionStorage.setItem('userEmail', data.owner.email)
      // 로그인 시간 저장
      sessionStorage.setItem('loginTime', Date.now().toString())
      // 현재 로그인한 점주의 ownerId 저장 (localStorage 초기화 확인용)
      sessionStorage.setItem('currentOwnerId', data.owner.id)
      
      // 로컬 스토리지에 이름 저장 (비밀번호는 저장하지 않음)
      localStorage.setItem('lastLoginName', name)
      
      // 로그인 시 무조건 매장 정보 캐시 삭제 (항상 최신 데이터 조회)
      console.log('로그인 성공 - 매장 정보 캐시 삭제, ownerId:', data.owner.id)
      localStorage.removeItem('storeInfo')
      localStorage.removeItem('storePrices')
      localStorage.setItem('lastOwnerId', data.owner.id)
      
      // 메인 페이지로 리다이렉트
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('로그인 에러:', err)
      setError('로그인에 실패했습니다. 다시 시도해주세요.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로그인 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* 헤더 */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <FiLogIn className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">로그인</h1>
            <p className="text-gray-500 text-sm">골프 매장 POS 시스템</p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 로그인 폼 */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* 이름 입력 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                이름
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all autofill:bg-white"
                  placeholder="이름을 입력하세요"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-24 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all autofill:bg-white"
                  placeholder="비밀번호를 입력하세요"
                  disabled={isLoading}
                />
                <Link
                  href="/login/forgot-password"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  비밀번호 찾기
                </Link>
              </div>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>로그인 중...</span>
                </>
              ) : (
                <>
                  <FiLogIn className="w-5 h-5" />
                  <span>로그인</span>
                </>
              )}
            </button>
          </form>

          {/* 추가 정보 */}
          <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
            <p>시스템 관리자에게 문의하세요</p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2025 골프 매장 POS 시스템. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
