'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FiMail, FiLock, FiUser, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false)
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([])
  const [isCapsLockOn, setIsCapsLockOn] = useState(false)
  const [isCapsLockOnConfirm, setIsCapsLockOnConfirm] = useState(false)
  
  const emailDomains = ['gmail.com', 'naver.com', 'daum.net']

  // 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // 외부 클릭 시 이메일 자동완성 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.email-input-container')) {
        setShowEmailSuggestions(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // 전화번호 자동 하이픈 포맷팅
    if (name === 'phone') {
      const phoneNumber = value.replace(/[^0-9]/g, '')
      let formattedPhone = phoneNumber
      
      if (phoneNumber.length <= 3) {
        formattedPhone = phoneNumber
      } else if (phoneNumber.length <= 7) {
        formattedPhone = `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`
      } else {
        formattedPhone = `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`
      }
      
      setFormData({
        ...formData,
        [name]: formattedPhone,
      })
    } else if (name === 'email') {
      setFormData({
        ...formData,
        [name]: value,
      })
      
      // 이메일 입력 시 자동완성 표시 (입력이 시작되면 표시)
      if (value.length > 0) {
        if (value.includes('@')) {
          const atIndex = value.lastIndexOf('@')
          const beforeAt = value.substring(0, atIndex)
          const afterAt = value.substring(atIndex + 1)
          
          // @ 뒤에 도메인이 완성되지 않은 경우에만 자동완성 표시
          if (beforeAt.length > 0 && !afterAt.includes('.')) {
            setEmailSuggestions(emailDomains)
            setShowEmailSuggestions(true)
          } else if (afterAt.length === 0) {
            // @ 바로 뒤에 아무것도 없을 때도 표시
            setEmailSuggestions(emailDomains)
            setShowEmailSuggestions(true)
          } else {
            setShowEmailSuggestions(false)
          }
        } else {
          // @ 입력 전에도 자동완성 표시
          setEmailSuggestions(emailDomains)
          setShowEmailSuggestions(true)
        }
      } else {
        setShowEmailSuggestions(false)
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleEmailSuggestionClick = (domain: string) => {
    const atIndex = formData.email.lastIndexOf('@')
    if (atIndex !== -1) {
      const beforeAt = formData.email.substring(0, atIndex + 1)
      setFormData({
        ...formData,
        email: beforeAt + domain,
      })
    } else {
      // @ 입력 전에 클릭한 경우 @ 추가
      const emailPrefix = formData.email.trim()
      setFormData({
        ...formData,
        email: emailPrefix + '@' + domain,
      })
    }
    setShowEmailSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'password' | 'confirmPassword') => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      if (field === 'password') {
        setIsCapsLockOn(true)
      } else {
        setIsCapsLockOnConfirm(true)
      }
    } else {
      if (field === 'password') {
        setIsCapsLockOn(false)
      } else {
        setIsCapsLockOnConfirm(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 4) {
      setError('비밀번호는 최소 4자 이상이어야 합니다.')
      setIsLoading(false)
      return
    }

    try {
      // 전화번호에서 하이픈 제거하여 전송
      const submitData = {
        ...formData,
        phone: formData.phone.replace(/-/g, ''),
      }
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        // 인증 상태 변경 이벤트 발생
        window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { isLoggedIn: true } }))
        // 바로 메인 페이지로 이동
        router.push('/')
        router.refresh()
      } else {
        const errorData = await response.json()
        setError(errorData.message || '회원가입에 실패했습니다.')
      }
    } catch (error) {
      setError('회원가입 중 오류가 발생했습니다.')
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
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 border border-gray-100">
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
              회원가입
            </h2>
          </div>

          {/* 폼 */}
          <form className="space-y-5" onSubmit={handleSubmit}>
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
                    required
                    value={formData.name}
                    onChange={handleChange}
                    style={{ backgroundColor: formData.name ? '#ffffff' : undefined }}
                    className={`block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ACEE] focus:border-[#00ACEE] focus:outline-none transition-all duration-200 ${formData.name ? 'bg-white' : 'bg-gray-50'} focus:bg-white`}
                    placeholder="이름을 입력하세요"
                  />
                </div>
              </div>

              {/* 전화번호 입력 */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    style={{ backgroundColor: formData.phone ? '#ffffff' : undefined }}
                    className={`block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ACEE] focus:border-[#00ACEE] focus:outline-none transition-all duration-200 ${formData.phone ? 'bg-white' : 'bg-gray-50'} focus:bg-white`}
                    placeholder="010-1234-5678"
                  />
                </div>
              </div>

              {/* 비밀번호 입력 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 <span className="text-gray-400 font-normal">(최소 4자)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 'password')}
                    onKeyUp={(e) => {
                      if (e.getModifierState && e.getModifierState('CapsLock')) {
                        setIsCapsLockOn(true)
                      } else {
                        setIsCapsLockOn(false)
                      }
                    }}
                    style={{ backgroundColor: formData.password ? '#ffffff' : undefined }}
                    className={`block w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ACEE] focus:border-[#00ACEE] focus:outline-none transition-all duration-200 ${formData.password ? 'bg-white' : 'bg-gray-50'} focus:bg-white`}
                    placeholder="비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5" />
                    ) : (
                      <FiEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {isCapsLockOn && (
                  <p className="mt-1 text-sm text-amber-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Caps Lock이 켜져 있습니다.
                  </p>
                )}
              </div>

              {/* 비밀번호 확인 입력 */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 확인
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 'confirmPassword')}
                    onKeyUp={(e) => {
                      if (e.getModifierState && e.getModifierState('CapsLock')) {
                        setIsCapsLockOnConfirm(true)
                      } else {
                        setIsCapsLockOnConfirm(false)
                      }
                    }}
                    style={{ backgroundColor: formData.confirmPassword ? '#ffffff' : undefined }}
                    className={`block w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ACEE] focus:border-[#00ACEE] focus:outline-none transition-all duration-200 ${formData.confirmPassword ? 'bg-white' : 'bg-gray-50'} focus:bg-white`}
                    placeholder="비밀번호를 다시 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="h-5 w-5" />
                    ) : (
                      <FiEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {isCapsLockOnConfirm && (
                  <p className="mt-1 text-sm text-amber-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Caps Lock이 켜져 있습니다.
                  </p>
                )}
              </div>

              {/* 이메일 입력 */}
              <div className="email-input-container">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 주소
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={(e) => {
                      // 포커스 시에도 자동완성 표시
                      if (e.target.value.length > 0) {
                        setEmailSuggestions(emailDomains)
                        setShowEmailSuggestions(true)
                      }
                    }}
                    style={{ backgroundColor: formData.email ? '#ffffff' : undefined }}
                    className={`block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ACEE] focus:border-[#00ACEE] focus:outline-none transition-all duration-200 ${formData.email ? 'bg-white' : 'bg-gray-50'} focus:bg-white`}
                    placeholder="이메일을 입력하세요"
                  />
                  {/* 이메일 자동완성 드롭다운 */}
                  {showEmailSuggestions && emailSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {emailSuggestions.map((domain, index) => {
                        const emailPrefix = formData.email.includes('@') 
                          ? formData.email.substring(0, formData.email.lastIndexOf('@') + 1)
                          : (formData.email.trim() || '') + '@'
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleEmailSuggestionClick(domain)}
                            className="w-full text-left px-4 py-2 hover:bg-sky-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                          >
                            <span className="text-gray-700">
                              {emailPrefix}
                              <span className="font-semibold text-blue-600">{domain}</span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 로그인 / 비밀번호 찾기 */}
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-2 text-sm">
                <Link href="/login" className="text-gray-600 hover:text-teal-600 transition-colors">
                  로그인하기
                </Link>
                <span className="text-gray-300">|</span>
                <Link href="/find-password" className="text-gray-600 hover:text-teal-600 transition-colors">
                  비밀번호 찾기
                </Link>
              </div>
            </div>

            {/* 회원가입 버튼 */}
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
                  가입 중...
                </>
              ) : (
                '회원가입'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

