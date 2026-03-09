'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiShield, FiLock, FiUser } from 'react-icons/fi'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      alert('이메일과 비밀번호를 입력해주세요.')
      return
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || '로그인에 실패했습니다.')
        return
      }

      // 로그인 성공
      sessionStorage.setItem('isAuthenticated', 'true')
      sessionStorage.setItem('isPowerAdmin', 'true')
      sessionStorage.setItem('adminName', data.admin.name || '최고 관리자')
      sessionStorage.setItem('adminId', data.admin.id)
      router.push('/dashboard')
    } catch (error) {
      console.error('로그인 에러:', error)
      alert('로그인 중 오류가 발생했습니다.')
    }
  }

  const handleCreateAdmin = async () => {
    if (!confirm('관리자 계정을 생성하시겠습니까?\n이메일: bhe@naver.com\n비밀번호: 1111')) {
      return
    }

    try {
      const response = await fetch('/api/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'bhe@naver.com',
          password: '1111',
          name: '관리자',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || '관리자 생성에 실패했습니다.')
        return
      }

      alert('관리자 계정이 생성되었습니다!\n이메일: bhe@naver.com\n비밀번호: 1111')
      setEmail('bhe@naver.com')
      setPassword('1111')
    } catch (error) {
      console.error('관리자 생성 에러:', error)
      alert('관리자 생성 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-100 to-orange-200 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md p-8 relative z-10 border border-orange-100/60">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full mb-4 shadow-lg">
            <FiShield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">최고 관리자</h1>
          <p className="text-gray-600 mt-2">시스템 관리자 로그인</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiUser className="inline w-4 h-4 mr-1" />
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@nsdr.com"
              className="w-full px-4 py-3 border border-orange-200 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-colors placeholder:text-orange-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiLock className="inline w-4 h-4 mr-1" />
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-3 border border-orange-200 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-colors placeholder:text-orange-300"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 bg-gradient-to-r from-orange-400 to-amber-400 text-white rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            로그인
          </button>
        </form>

        {/* 임시 관리자 생성 버튼 (개발용) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 pt-4 border-t border-orange-200">
            <button
              type="button"
              onClick={handleCreateAdmin}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
            >
              🔧 관리자 계정 생성 (개발용)
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            ⚠️ 최고 관리자만 접근 가능합니다
          </p>
        </div>
      </div>
    </div>
  )
}

