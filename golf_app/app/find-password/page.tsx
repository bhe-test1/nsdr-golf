'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FiLock, FiArrowLeft } from 'react-icons/fi'

export default function FindPasswordPage() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '')
    if (value.length <= 3) setPhone(value)
    else if (value.length <= 7) setPhone(`${value.slice(0, 3)}-${value.slice(3)}`)
    else setPhone(`${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), phone: phone || undefined }),
      })
      const data = await response.json()
      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.message || '요청 처리에 실패했습니다.')
      }
    } catch {
      setError('요청 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #3952B6 50%, #00ACEE 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black/40 pointer-events-none" aria-hidden />
      <div className="max-w-md w-full relative z-10 flex-shrink-0 -translate-y-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 border border-gray-100">
          {/* 헤더 - 자물쇠 아이콘 (캐디BAE 컬러) */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-[#00ACEE] flex items-center justify-center shadow-lg">
                <FiLock className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#00ACEE]">비밀번호 찾기</h1>
            <p className="text-sm text-gray-500">가입하신 이메일 주소와 전화번호를 입력해주세요</p>
          </div>

          {/* 입력 폼 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 py-2 px-3 rounded-lg">{error}</p>
            )}
            {success && (
              <p className="text-sm text-[#00ACEE] bg-[#00ACEE]/10 py-2 px-3 rounded-lg">
                비밀번호 재설정 링크를 이메일로 보냈습니다. 받은편지함과 스팸함을 확인해 주세요.
              </p>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-2">
                이메일 주소
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className={`block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ACEE] focus:border-[#00ACEE] outline-none transition-all focus:bg-white ${email ? 'bg-white' : 'bg-gray-50'}`}
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-800 mb-2">
                전화번호
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="010-1234-5678"
                maxLength={13}
                className={`block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ACEE] focus:border-[#00ACEE] outline-none transition-all focus:bg-white ${phone ? 'bg-white' : 'bg-gray-50'}`}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-lg shadow-lg text-base font-semibold text-white bg-[#00ACEE] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00ACEE] disabled:opacity-60"
            >
              {isLoading ? '전송 중...' : '비밀번호 재설정 링크 전송'}
            </button>
            <p className="text-xs text-gray-500 text-center">
              입력한 이메일 주소로 재설정 링크가 발송됩니다.
            </p>
          </form>

          {/* 로그인으로 돌아가기 */}
          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#00ACEE]"
            >
              <FiArrowLeft className="w-4 h-4" />
              로그인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
