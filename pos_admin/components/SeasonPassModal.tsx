'use client'

import { useState } from 'react'
import { FiX, FiChevronLeft } from 'react-icons/fi'

export type PassType = '회원권' | '레슨비' | '기타'

/** 결제방식: 쿠폰 | 현금 | 카드 | 포스 */
export type PaymentMethod = 'coupon' | 'cash' | 'card' | 'pos'
/** 결제방법: 일반결제 | 부분결제 | 분할결제 */
export type PaymentType = 'normal' | 'partial' | 'installment'

export type SeasonPassFormData = {
  passType: PassType
  name: string
  phone: string
  amount: number
  paymentMethod: PaymentMethod
  paymentType: PaymentType
  startDate: string
  endDate: string
}

const PASS_TYPES: PassType[] = ['회원권', '레슨비', '기타']

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'coupon', label: '쿠폰' },
  { value: 'cash', label: '현금' },
  { value: 'card', label: '카드' },
  { value: 'pos', label: '포스' },
]

const PAYMENT_TYPES: { value: PaymentType; label: string }[] = [
  { value: 'normal', label: '일반결제' },
  { value: 'partial', label: '부분결제' },
  { value: 'installment', label: '분할결제' },
]

interface SeasonPassModalProps {
  onClose: () => void
  onConfirm?: (data: SeasonPassFormData) => void
}

export default function SeasonPassModal({ onClose, onConfirm }: SeasonPassModalProps) {
  const [selectedType, setSelectedType] = useState<PassType>('회원권')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [paymentType, setPaymentType] = useState<PaymentType>('normal')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || paymentMethod === '' || !startDate || !endDate) return
    setSubmitting(true)
    try {
      const data: SeasonPassFormData = {
        passType: selectedType,
        name: name.trim(),
        phone: phone.trim(),
        amount: Number(amount) || 0,
        paymentMethod: paymentMethod as PaymentMethod,
        paymentType,
        startDate,
        endDate,
      }
      onConfirm?.(data)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* 공통 헤더: 한 줄 구분선으로 정렬 */}
          <div className="flex flex-1 border-b border-gray-200">
            <div className="flex-1 px-6 py-4 flex items-center">
              <h2 className="text-lg font-semibold text-gray-900">정기권 구매</h2>
            </div>
            <div className="flex-1 px-6 py-4 flex items-center justify-between border-l border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">결제하기</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="닫기"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-1">
          {/* 왼쪽: 정기권 구매 정보 */}
          <div className="flex-1 border-r border-gray-200 p-6 pt-5">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">구매 유형</label>
                <div className="flex gap-2">
                  {PASS_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`flex-1 rounded-lg border-2 py-2.5 text-sm font-medium transition-colors ${
                        selectedType === type
                          ? 'border-sky-500 bg-sky-500 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
                <div>
                  <label htmlFor="season-name" className="mb-1 block text-sm font-medium text-gray-700">
                    이름
                  </label>
                  <input
                    id="season-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="이름 입력"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="season-phone" className="mb-1 block text-sm font-medium text-gray-700">
                    핸드폰 번호
                  </label>
                  <input
                    id="season-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="010-0000-0000"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="season-start" className="mb-1 block text-sm font-medium text-gray-700">
                    시작일자
                  </label>
                  <input
                    id="season-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={today}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="season-end" className="mb-1 block text-sm font-medium text-gray-700">
                    종료일자
                  </label>
                  <input
                    id="season-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || today}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-gray-300 bg-white py-3 font-medium text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-sky-200 bg-sky-50 py-3 font-medium text-sky-700 hover:bg-sky-100 flex items-center justify-center gap-1"
                >
                  <FiChevronLeft className="w-4 h-4" />
                  이전
                </button>
              </div>
            </div>

            {/* 오른쪽: 결제하기 */}
            <div className="flex-1 p-6 pt-5 flex flex-col bg-gray-50/50">
              <div className="mb-5">
                <label className="mb-1 block text-sm font-medium text-gray-700">결제 금액</label>
                <div className="rounded-xl border border-sky-100 bg-white px-4 py-4">
                  <span className="text-2xl font-bold text-sky-600">
                    {(amount || 0).toLocaleString()}원
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={amount || ''}
                      onChange={(e) => setAmount(Number(e.target.value) || 0)}
                      className="w-32 rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900"
                      placeholder="금액 입력"
                    />
                    <span className="text-sm text-gray-500">원</span>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">결제방식</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      className={`rounded-lg border-2 py-2.5 text-sm font-medium transition-colors ${
                        paymentMethod === opt.value
                          ? 'border-sky-500 bg-sky-500 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">결제방법</label>
                <div className="flex gap-2">
                  {PAYMENT_TYPES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentType(opt.value)}
                      className={`flex-1 rounded-lg border-2 py-2.5 text-sm font-medium transition-colors ${
                        paymentType === opt.value
                          ? 'border-sky-500 bg-sky-500 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-auto flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-gray-300 bg-white py-3 font-medium text-gray-700 hover:bg-gray-50"
                >
                  이전
                </button>
                <button
                  type="submit"
                  disabled={submitting || paymentMethod === ''}
                  className="flex-1 rounded-xl bg-sky-500 py-3 font-medium text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '처리 중...' : '결제하기'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
