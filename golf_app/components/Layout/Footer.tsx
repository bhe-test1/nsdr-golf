export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">골프 예약 시스템</h3>
            <p className="text-gray-400">
              최고의 골프장을 찾고 예약하세요
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">고객센터</h3>
            <p className="text-gray-400">전화: 1588-0000</p>
            <p className="text-gray-400">이메일: support@golf.com</p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">이용안내</h3>
            <ul className="space-y-2 text-gray-400">
              <li>이용약관</li>
              <li>개인정보처리방침</li>
              <li>예약 취소 정책</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 골프 예약 시스템. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

