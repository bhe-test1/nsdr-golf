'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FiUser, FiPhone, FiLock } from 'react-icons/fi'

export default function LoginPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // 스크롤 방지 및 필드 초기화
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    // 필드 초기화 (브라우저 자동완성 방지)
    setName('')
    setPhone('')
    setPassword('')
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  // 핸드폰 번호 변경 핸들러
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, phone, password }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        // 인증 상태 변경 이벤트 발생
        window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { isLoggedIn: true } }))
        router.push('/')
        router.refresh()
      } else {
        const errorData = await response.json()
        setError(errorData.message || '로그인에 실패했습니다.')
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="h-screen flex items-center justify-center px-4 overflow-hidden fixed inset-0"
      style={{
        backgroundImage: 'url(/golfzone.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* 배경 오버레이 (폼 가독성을 위해) */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        {/* 카드 형태의 폼 */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-8 border border-gray-100">
          {/* 로고 및 헤더 */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="/logo_bookingman.png"
                    alt="캐디BAE 로고"
                    width={160}
                    height={160}
                    quality={100}
                    priority
                    className="w-full h-full object-cover"
                    style={{ filter: 'contrast(1.1) brightness(1.05)' }}
                  />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-sky-400 rounded-full border-4 border-white"></div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-left">
              로그인
            </h2>
          </div>

          {/* 폼 */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md flex items-center animate-fadeIn">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* 이름 입력 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  이름
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ACEE] focus:border-[#00ACEE] focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="이름을 입력하세요"
                  />
                </div>
              </div>

              {/* 핸드폰번호 입력 */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  핸드폰번호
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="off"
                    required
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={13}
                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ACEE] focus:border-[#00ACEE] focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="010-1234-5678"
                  />
                </div>
              </div>

              {/* 비밀번호 입력 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="off"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ACEE] focus:border-[#00ACEE] focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="비밀번호를 입력하세요"
                  />
                </div>
              </div>
            </div>

            {/* 회원가입 / 비밀번호 찾기 */}
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-2 text-sm">
                <Link href="/register" className="text-gray-600 hover:text-teal-600 transition-colors">
                  회원가입하기
                </Link>
                <span className="text-gray-300">|</span>
                <Link href="/find-password" className="text-gray-600 hover:text-teal-600 transition-colors">
                  비밀번호 찾기
                </Link>
              </div>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg text-base font-semibold text-white bg-[#00ACEE] hover:bg-[#0088c2] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00ACEE] disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

