'use client'

import Link from 'next/link'
import { FiMail, FiArrowLeft } from 'react-icons/fi'

const SUPPORT_EMAIL = 'nsdr0748@gmail.com'
const MAILTO_SUBJECT = encodeURIComponent('POS 비밀번호 찾기 요청')
const MAILTO_BODY = encodeURIComponent(
  '안녕하세요,\n\n비밀번호를 잊어버려 문의드립니다.\n\n- 이름(또는 아이디): \n- 등록된 이메일: \n- 연락처: \n\n위 정보를 알려주시면 비밀번호 재설정을 도와드리겠습니다.'
)

export default function ForgotPasswordPage() {
  const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${MAILTO_SUBJECT}&body=${MAILTO_BODY}`

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* 헤더 */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <FiMail className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">비밀번호 찾기</h1>
            <p className="text-gray-500 text-sm">비밀번호를 잊으셨나요? 아래 안내에 따라 문의해 주세요.</p>
          </div>

          {/* 안내 문구 */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-gray-700 space-y-2">
            <p>비밀번호 재설정을 원하시면 <strong>관리자 이메일</strong>로 문의해 주세요.</p>
            <p>아래 버튼을 누르면 이메일 작성 화면이 열립니다. 이름, 등록된 이메일, 연락처를 적어 보내 주시면 안내해 드리겠습니다.</p>
          </div>

          {/* 이메일 보내기 버튼 */}
          <a
            href={mailtoUrl}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
          >
            <FiMail className="w-5 h-5" />
            <span>nsdr0748@gmail.com으로 이메일 보내기</span>
          </a>

          {/* 로그인으로 돌아가기 */}
          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              로그인으로 돌아가기
            </Link>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2025 골프 매장 POS 시스템. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
