'use client'

import { useState, useCallback } from 'react'
import { FiX, FiChevronLeft, FiUser } from 'react-icons/fi'
import type { Store } from '@/lib/types'

type DetailModalType = 'personalInfo' | 'cancellation' | 'termsAll' | null

interface PaymentModalProps {
  store: Store
  reservationData: {
    reservatorName: string
    contactNumber: string
    date: Date
    time: string
    players: number
    playType: string
    holes: string
    gameCount: '1게임' | '2게임'
    room: string
    price: number
    durationMinutes?: number
  }
  onClose: () => void
  onBack: () => void
  onComplete?: () => void
}

export default function PaymentModal({
  store,
  reservationData,
  onClose,
  onBack,
  onComplete
}: PaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [kovenLoading, setKovenLoading] = useState(false)
  const [detailModal, setDetailModal] = useState<DetailModalType>(null)
  const [agreements, setAgreements] = useState({
    personalInfo: false,
    cancellation: false,
    terms1: false, // 1인당 1시간 게임 운영 방침
    terms2: false, // 룸 청소 및 정리정돈
    terms3: false, // 분실 및 파손 책임
    allTerms: false
  })

  // 전체 동의 체크박스 핸들러
  const handleAllTermsChange = (checked: boolean) => {
    setAgreements({
      personalInfo: checked,
      cancellation: checked,
      terms1: checked,
      terms2: checked,
      terms3: checked,
      allTerms: checked
    })
  }

  // 개별 체크박스 변경 시 전체 동의 상태 업데이트
  const handleAgreementChange = (key: keyof typeof agreements, value: boolean) => {
    const newAgreements = { ...agreements, [key]: value }
    newAgreements.allTerms = 
      newAgreements.personalInfo &&
      newAgreements.cancellation &&
      newAgreements.terms1 &&
      newAgreements.terms2 &&
      newAgreements.terms3
    setAgreements(newAgreements)
  }

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
    const dayName = dayNames[date.getDay()]
    return `${year}년 ${month}월${day}일(${dayName})`
  }

  // KOVEN 결제 테스트: pos_admin API 호출 후 PG 결제창으로 이동
  const handleKovenTest = useCallback(async () => {
    if (kovenLoading) return
    setKovenLoading(true)
    try {
      const durationMin = reservationData.durationMinutes ?? 60
      const [startH = 0, startM = 0] = reservationData.time.split(':').map(Number)
      const endMin = startH * 60 + startM + durationMin
      const endHour = Math.floor(endMin / 60)
      const endMinute = endMin % 60
      const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`

      const roomNum = parseInt(String(reservationData.room).replace(/[^0-9]/g, ''), 10) || 0
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const returnUrlWithStore = origin ? `${origin}/payment/return${store?.id ? `?storeId=${store.id}` : ''}` : ''
      // 취소 시 새 탭 말고 같은 탭에서 결제하기 전 페이지(매장 상세)로 이동
      const cancelUrl = origin && store?.id ? `${origin}/stores/${store.id}` : origin ? `${origin}/payment/cancel` : undefined
      const res = await fetch('/api/payment/koven', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: reservationData.price,
          memberName: reservationData.reservatorName,
          roomNumber: roomNum,
          playOption: `${reservationData.playType} ${reservationData.holes} ${reservationData.gameCount}`.trim(),
          peopleCount: reservationData.players,
          startTime: reservationData.time,
          endTime: endTimeStr,
          paymentType: 'card',
          paymentMethod: 'card',
          cancelUrl,
          returnUrl: returnUrlWithStore,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert((data as { error?: string }).error || '결제 요청에 실패했습니다.')
        setKovenLoading(false)
        return
      }
      const { pgUrl, formData } = data as { pgUrl?: string; formData?: Record<string, string> }
      if (!pgUrl || !formData) {
        alert('결제 정보를 받지 못했습니다.')
        setKovenLoading(false)
        return
      }
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = pgUrl
      form.target = '_self'
      Object.entries(formData).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      })
      document.body.appendChild(form)
      form.submit()
    } catch {
      alert('결제 요청 중 오류가 발생했습니다.')
    } finally {
      setKovenLoading(false)
    }
  }, [kovenLoading, reservationData])

  // 이용시간: 기본(1명 기준) × 인원. 9홀=30분, 18홀=60분
  const durationMin = reservationData.durationMinutes ?? 60

  // 시간 계산 (이용시간만큼 표시)
  const getTimeRange = (time: string, durationMinutes: number = durationMin) => {
    const [hours, minutes] = time.split(':').map(Number)
    const startMinutes = hours * 60 + minutes
    const endMinutes = startMinutes + durationMinutes
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ~ ${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')} (${durationMinutes}분)`
  }

  const handlePayment = async () => {
    if (!agreements.allTerms) {
      alert('모든 약관에 동의해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          storeId: store.id,
          date: reservationData.date.toISOString().split('T')[0],
          time: reservationData.time,
          players: reservationData.players,
          room: reservationData.room,
          reservatorName: reservationData.reservatorName,
          contactNumber: reservationData.contactNumber,
          playType: reservationData.playType,
          holes: reservationData.holes,
          gameCount: reservationData.gameCount,
          durationMinutes: reservationData.durationMinutes ?? 60,
        }),
      })

      if (response.ok) {
        alert('예약이 완료되었습니다!')
        if (onComplete) onComplete()
        onClose()
      } else {
        const errorData = await response.json()
        alert(errorData.message || '예약에 실패했습니다.')
      }
    } catch (error) {
      alert('예약 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col min-h-0 md:items-start md:justify-start bg-white overflow-hidden">
      {/* 자세히보기 오버레이 - 결제 페이지 전체를 덮어서 표시 (최상단 레이어) */}
      {detailModal && (
        <div className="absolute inset-0 z-[100] flex flex-col bg-white min-h-0">
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-bold text-gray-900">
              {detailModal === 'personalInfo' && '개인정보 제3자 제공동의'}
              {detailModal === 'cancellation' && '예약취소 및 패널티 규정안내'}
              {detailModal === 'termsAll' && '이용약관 전체동의'}
            </h2>
            <button
              type="button"
              onClick={() => setDetailModal(null)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              aria-label="닫기"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-4 text-sm text-gray-700 leading-relaxed">
            {detailModal === 'personalInfo' && (
              <div className="space-y-4">
                <p>캐디BAE(이하 &quot;서비스&quot;)는 예약 및 결제 서비스 제공을 위해 아래와 같이 개인정보를 제3자에게 제공합니다.</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><strong>제공받는 자:</strong> 예약 매장(골프연습장/스크린골프)</p>
                  <p><strong>제공 목적:</strong> 예약 확인, 방문자 확인, 출입문 연동</p>
                  <p><strong>제공 항목:</strong> 예약자명, 연락처, 예약일시, 인원/팀 수</p>
                  <p><strong>보유 및 이용 기간:</strong> 예약일로부터 1년 (관련 법령에 따라 보존할 수 있음)</p>
                </div>
                <p>동의를 거부할 수 있으며, 거부 시 예약 서비스 이용이 제한될 수 있습니다.</p>
              </div>
            )}
            {detailModal === 'cancellation' && (
              <div className="space-y-4">
                <p>예약 취소 및 패널티는 아래 규정을 따릅니다.</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <p><strong>예약일 1일 전까지:</strong> 무료 취소</p>
                  <p><strong>예약일 당일:</strong> 취소 시 결제 금액의 50% 패널티가 부과될 수 있습니다.</p>
                  <p><strong>노쇼(미방문):</strong> 결제 금액 전액이 패널티로 부과될 수 있습니다.</p>
                  <p><strong>취소 방법:</strong> 앱 내 예약 내역에서 취소하거나, 해당 매장에 직접 연락해 주세요.</p>
                </div>
                <p>매장별로 상이할 수 있으니, 자세한 내용은 해당 매장에 문의하시기 바랍니다.</p>
              </div>
            )}
            {detailModal === 'termsAll' && (
              <div className="space-y-6">
                <section>
                  <h3 className="font-bold text-gray-900 mb-2">1. 게임 운영 방침</h3>
                  <p>무인 게임운영은 1인당 1시간을 기본으로 진행됩니다. 1인당 1시간 게임 운영 방침에 동의합니다.</p>
                </section>
                <section>
                  <h3 className="font-bold text-gray-900 mb-2">2. 룸 청소 및 정리정돈</h3>
                  <p>예약자는 스크린 골프 이용 후 사용한 룸을 청소하고, 정리정돈 한 후 퇴실할 것에 동의합니다.</p>
                </section>
                <section>
                  <h3 className="font-bold text-gray-900 mb-2">3. 분실 및 파손 책임</h3>
                  <p>예약자는 스크린 골프 이용 중 발생하는 모든 분실 및 파손에 대해 본인이 책임을 질 것에 동의합니다.</p>
                </section>
              </div>
            )}
          </div>
          <div 
            className="flex-shrink-0 px-4 pt-3 pb-4 border-t border-gray-200 bg-white"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <button
              type="button"
              onClick={() => setDetailModal(null)}
              className="w-full py-3.5 px-4 bg-[#00ACEE] text-white font-semibold rounded-xl hover:bg-[#0088c2] transition text-base"
            >
              확인
            </button>
          </div>
        </div>
      )}

      <div 
        className="w-full min-h-0 flex-1 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 - 컴팩트 */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white flex-shrink-0">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition" aria-label="뒤로">
            <FiChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">결제하기</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition" aria-label="닫기">
            <FiUser className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* 스크롤 가능한 컨텐츠 - 컴팩트 */}
        <div className="flex-1 overflow-y-auto bg-gray-50/80 min-h-0">
          <div className="p-3 space-y-3">
            {/* 결제 금액 강조 - 상단 배치 */}
            <div className="rounded-xl border-2 border-[#00ACEE] bg-white p-3 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">총 결제 금액</span>
              <span className="text-xl font-bold text-[#00ACEE]">
                {reservationData.price.toLocaleString()}<span className="text-base font-semibold text-gray-600 ml-0.5">원</span>
              </span>
            </div>

            {/* 예약·상품 정보 - 한 블록에 컴팩트 행 */}
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-0.5 h-3.5 bg-[#00ACEE] rounded-full" /> 예약·상품 정보
              </h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex gap-2 py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 shrink-0 w-20">예약자</span>
                  <span className="font-medium text-gray-900">{reservationData.reservatorName}</span>
                </div>
                <div className="flex gap-2 py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 shrink-0 w-20">연락처</span>
                  <span className="font-medium text-gray-900">{reservationData.contactNumber}</span>
                </div>
                <div className="flex gap-2 py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 shrink-0 w-20">매장</span>
                  <span className="font-medium text-gray-900 truncate">{store.name}</span>
                </div>
                <div className="flex gap-2 py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 shrink-0 w-20">날짜</span>
                  <span className="font-medium text-gray-900">{formatDate(reservationData.date)}</span>
                </div>
                <div className="flex gap-2 py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 shrink-0 w-20">시간</span>
                  <span className="font-medium text-gray-900">{reservationData.time} ({durationMin}분)</span>
                </div>
                <div className="flex gap-2 py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 shrink-0 w-20">{reservationData.playType === '포썸' ? '팀' : '인원'}</span>
                  <span className="font-medium text-gray-900">{reservationData.players}{reservationData.playType === '포썸' ? '팀' : '명'}</span>
                </div>
                <div className="flex gap-2 py-1.5">
                  <span className="text-gray-500 shrink-0 w-20">옵션</span>
                  <span className="font-medium text-gray-900">{reservationData.playType} {reservationData.holes} · {reservationData.room.replace('번방', '')}</span>
                </div>
              </div>
            </div>

            {/* 약관 동의 - 컴팩트 */}
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-0.5 h-3.5 bg-[#00ACEE] rounded-full" /> 약관 동의
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs font-medium text-gray-700">개인정보 제3자 제공동의</span>
                  <button type="button" onClick={() => setDetailModal('personalInfo')} className="text-xs text-[#00ACEE] font-medium">자세히</button>
                </div>
                <div className="flex items-center justify-between py-1.5 border-t border-gray-100">
                  <span className="text-xs font-medium text-gray-700">예약취소 및 패널티</span>
                  <button type="button" onClick={() => setDetailModal('cancellation')} className="text-xs text-[#00ACEE] font-medium">자세히</button>
                </div>
                <div className="bg-sky-50 rounded-lg p-2.5 border border-sky-200 mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={agreements.allTerms}
                        onChange={(e) => handleAllTermsChange(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-[#00ACEE] focus:ring-0 cursor-pointer"
                      />
                      <span className="text-sm font-bold text-gray-900">이용약관 전체동의</span>
                    </label>
                    <button type="button" onClick={() => setDetailModal('termsAll')} className="text-xs text-[#00ACEE] font-medium shrink-0">자세히</button>
                  </div>
                  <div className="space-y-1.5 pt-1.5 border-t border-sky-200">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={agreements.terms1} onChange={(e) => handleAgreementChange('terms1', e.target.checked)} className="w-4 h-4 rounded mt-0.5 cursor-pointer shrink-0" />
                      <span className="text-xs text-gray-700 leading-snug">1인당 1시간 게임 운영 방침 동의</span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={agreements.terms2} onChange={(e) => handleAgreementChange('terms2', e.target.checked)} className="w-4 h-4 rounded mt-0.5 cursor-pointer shrink-0" />
                      <span className="text-xs text-gray-700 leading-snug">룸 청소·정리정돈 후 퇴실 동의</span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={agreements.terms3} onChange={(e) => handleAgreementChange('terms3', e.target.checked)} className="w-4 h-4 rounded mt-0.5 cursor-pointer shrink-0" />
                      <span className="text-xs text-gray-700 leading-snug">분실·파손 책임 동의</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 결제하기 버튼 - 약관 동의 박스 바로 아래 */}
            <div className="pt-1 pb-2" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}>
              <button
                type="button"
                onClick={handlePayment}
                disabled={isSubmitting || !agreements.allTerms}
                className={`w-full py-3.5 rounded-xl font-semibold text-base transition ${
                  agreements.allTerms && !isSubmitting
                    ? 'bg-[#00ACEE] text-white hover:bg-[#0088c2]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? '처리 중...' : '결제하기'}
              </button>
              <button
                type="button"
                onClick={handleKovenTest}
                disabled={kovenLoading}
                className="mt-3 w-full py-3 rounded-xl border-2 border-[#00ACEE] bg-white font-medium text-[#00ACEE] transition hover:bg-sky-50 disabled:opacity-50 active:scale-[0.98]"
              >
                {kovenLoading ? '로딩 중…' : '테스트'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


