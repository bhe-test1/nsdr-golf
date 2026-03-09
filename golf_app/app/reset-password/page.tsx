'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FiLock, FiArrowLeft } from 'react-icons/fi'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) setError('유효한 재설정 링크가 아닙니다.')
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setError('')
    if (newPassword.length < 4) {
      setError('비밀번호는 최소 4자 이상이어야 합니다.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await response.json()
      if (response.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/login'), 2000)
      } else {
        setError(data.message || '비밀번호 변경에 실패했습니다.')
      }
    } catch {
      setError('요청 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div
        className="relative min-h-screen flex items-center justify-center px-4 py-12"
        style={{
          backgroundImage: 'url(/golfzone.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/40 pointer-events-none" aria-hidden />
        <div className="max-w-md w-full relative z-10 bg-white rounded-2xl shadow-2xl p-8 text-center">
          <p className="text-red-600 mb-4">유효한 재설정 링크가 아닙니다.</p>
          <Link href="/find-password" className="text-[#00ACEE] font-medium">
            비밀번호 찾기로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div
        className="relative min-h-screen flex items-center justify-center px-4 py-12"
        style={{
          backgroundImage: 'url(/golfzone.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/40 pointer-events-none" aria-hidden />
        <div className="max-w-md w-full relative z-10 bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#00ACEE] flex items-center justify-center mx-auto mb-4">
            <FiLock className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-800 font-medium">비밀번호가 변경되었습니다.</p>
          <p className="text-sm text-gray-500 mt-2">잠시 후 로그인 페이지로 이동합니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        backgroundImage: 'url(/golfzone.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black/40 pointer-events-none" aria-hidden />
      <div className="max-w-md w-full relative z-10 flex-shrink-0 -translate-y-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 border border-gray-100">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-[#00ACEE] flex items-center justify-center shadow-lg">
                <FiLock className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#00ACEE]">새 비밀번호 설정</h1>
            <p className="text-sm text-gray-500">새 비밀번호를 입력해 주세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 py-2 px-3 rounded-lg">{error}</p>
            )}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-800 mb-2">
                새 비밀번호
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="최소 4자"
                minLength={4}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ACEE] focus:border-[#00ACEE] outline-none transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-800 mb-2">
                비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 다시 입력"
                minLength={4}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ACEE] focus:border-[#00ACEE] outline-none transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-lg shadow-lg text-base font-semibold text-white bg-[#00ACEE] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00ACEE] disabled:opacity-60"
            >
              {isLoading ? '처리 중...' : '비밀번호 변경'}
            </button>
          </form>

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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
