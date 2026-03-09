'use client'

import { useState, useEffect } from 'react'
import { FiX, FiChevronDown } from 'react-icons/fi'

export type Member = {
  id: string
  name: string
  phone: string
  email: string
  joinDate: string
  totalReservations: number
  totalSpent: number
  status: string
}

export type RegisterFormData = {
  memberId: string
  memberName: string
  memberPhone?: string
  playOption: string
  peopleCount: number
  startTime: string
  endTime?: string
  amount: number
  /** 결제방식: coupon | cash | card | pos */
  paymentType?: string
  /** 결제방법: normal | partial | installment */
  paymentMethod?: string
  /** 분할 횟수 (분할결제 시 2회, 3회 등) */
  splitCount?: number
}

const DEFAULT_PLAY_OPTIONS = [
  { label: '일반', value: '일반', pricePerPerson: 30000 },
  { label: '스트로크 18홀', value: 'stroke18', pricePerPerson: 30000 },
  { label: '연습장', value: 'practice', pricePerPerson: 10000 },
]

/** 업장구분별 가격관리 컬럼 (매장정보 가격관리와 동일) */
const PRICE_COLUMNS_BY_STORE_TYPE: Record<string, { key: string; label: string }[]> = {
  스크린골프: [
    { key: 'stroke18', label: '스트로크 18홀' },
    { key: 'stroke9', label: '스트로크 9홀' },
    { key: 'pome18', label: '포썸 18홀' },
    { key: 'pome9', label: '포썸 9홀' },
    { key: 'practice', label: '연습장' },
  ],
  파크골프: [
    { key: 'hole9', label: '스트로크 9홀' },
    { key: 'hole18', label: '스트로크 18홀' },
    { key: 'practice30', label: '연습장 30분' },
    { key: 'practice60', label: '연습장 60분' },
  ],
  연습장: [
    { key: 'month1', label: '1개월권' },
    { key: 'month3', label: '3개월권' },
    { key: 'month6', label: '6개월권' },
    { key: 'month12', label: '12개월권' },
    { key: 'day1', label: '1일권' },
  ],
}

type GamePricesRow = { id: string; time: string; [key: string]: string | number }
type GamePrices = { weekday: GamePricesRow[]; weekend: GamePricesRow[] }

/** 30분 단위 예약 시간 슬롯 (00:00 ~ 24:00) */
const TIME_SLOTS_30MIN: string[] = (() => {
  const slots: string[] = []
  for (let hour = 0; hour <= 24; hour++) {
    if (hour < 24) slots.push(`${hour.toString().padStart(2, '0')}:00`)
    if (hour < 24) slots.push(`${hour.toString().padStart(2, '0')}:30`)
  }
  slots.push('24:00')
  return slots
})()

/** 시간 문자열을 분 단위로 (예: "09:00" -> 540) */
function timeToMinutes(t: string): number {
  const [h, m] = (t || '00:00').split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** 분 단위를 "HH:mm" 문자열로 (0~1439 분, 24시 넘으면 23:59로 제한) */
function minutesToTimeStr(totalMinutes: number): string {
  const capped = Math.min(24 * 60 - 1, Math.max(0, totalMinutes))
  const h = Math.floor(capped / 60)
  const m = capped % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/** 플레이 옵션별 1인 기준 이용 시간(분) - 인원수 N이면 N배 적용 */
function getDurationMinutesPerPerson(playOptionKey: string): number {
  const map: Record<string, number> = {
    stroke18: 60,
    stroke9: 30,
    pome18: 60,
    pome9: 30,
    practice: 60,
    hole18: 60,
    hole9: 30,
    practice30: 30,
    practice60: 60,
    month1: 60,
    month3: 60,
    month6: 60,
    month12: 60,
    day1: 60,
  }
  return map[playOptionKey] ?? 60
}

/** 해당 시간이 시간대 구간 안에 있는지 (start 포함, end 미포함) */
function isTimeInSlot(startTime: string, slotTime: string): boolean {
  if (!slotTime || !slotTime.includes('-')) return false
  const [start, end] = slotTime.split('-').map((s) => s.trim())
  const t = timeToMinutes(startTime)
  const s = timeToMinutes(start)
  const e = timeToMinutes(end)
  return t >= s && t < e
}

/** 선택한 플레이 옵션·시작 시간에 맞는 시간대별 단가 조회 */
function getPriceForSlot(
  playOptionKey: string,
  startTime: string,
  gamePrices: GamePrices,
  isWeekend: boolean
): number {
  const rows = isWeekend ? gamePrices.weekend : gamePrices.weekday
  if (!rows?.length) return 0
  const row = rows.find((r) => isTimeInSlot(startTime, r.time || ''))
  const target = row ?? rows[0]
  const raw = target[playOptionKey]
  if (raw == null || raw === '') return 0
  const num = typeof raw === 'number' ? raw : Number(String(raw).replace(/,/g, ''))
  return Number.isNaN(num) ? 0 : num
}

/** 핸드폰 번호 3-4-4 하이픈 포맷 (예: 010-3212-0822) */
function formatPhoneHyphen(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

interface RegisterModalProps {
  roomNumber: number
  onClose: () => void
  onConfirm: (data: RegisterFormData) => void
}

type MemberMode = 'existing' | 'new'

export default function RegisterModal({ roomNumber, onClose, onConfirm }: RegisterModalProps) {
  const [memberMode, setMemberMode] = useState<MemberMode>('existing')
  const [members, setMembers] = useState<Member[]>([])
  const [storeType, setStoreType] = useState<string>('스크린골프')
  const [gamePrices, setGamePrices] = useState<GamePrices>({ weekday: [], weekend: [] })
  const [playOptions, setPlayOptions] = useState<{ label: string; value: string; pricePerPerson?: number }[]>(DEFAULT_PLAY_OPTIONS)
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [searchName, setSearchName] = useState('')
  const [searchPhoneLast, setSearchPhoneLast] = useState('')
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberPhone, setNewMemberPhone] = useState('')
  const [playOption, setPlayOption] = useState('')
  const [peopleCount, setPeopleCount] = useState(2)
  const [startTime, setStartTime] = useState('09:00')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'payment'>('payment')
  const [paymentType, setPaymentType] = useState<string>('card')
  const [paymentMethod, setPaymentMethod] = useState<string>('normal')
  const [splitCount, setSplitCount] = useState<number>(1)
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [usersRes, storeRes, priceRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/store', { credentials: 'include' }),
          fetch('/api/price'),
        ])
        if (usersRes.ok) {
          const usersData = await usersRes.json()
          setMembers(usersData.users || [])
          if ((usersData.users?.length ?? 0) > 0 && !selectedMemberId) {
            setSelectedMemberId(usersData.users[0].id)
          }
        }
        if (storeRes.ok) {
          const storeData = await storeRes.json()
          const type = storeData.storeType || '스크린골프'
          setStoreType(type)
          const columns = PRICE_COLUMNS_BY_STORE_TYPE[type] ?? PRICE_COLUMNS_BY_STORE_TYPE['스크린골프']
          const options = columns.map((c) => ({ label: c.label, value: c.key }))
          if (options.length > 0) {
            setPlayOptions(options)
          }
        }
        if (priceRes.ok) {
          const priceData = await priceRes.json()
          const gp = priceData.gamePrices
          if (gp) {
            setGamePrices({
              weekday: Array.isArray(gp.weekday) ? gp.weekday : [],
              weekend: Array.isArray(gp.weekend) ? gp.weekend : [],
            })
          }
        }
      } catch (e) {
        setError('데이터를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const selectedOption = playOptions.find((o) => o.value === playOption)
  const isWeekend = (() => {
    const d = new Date().getDay()
    return d === 0 || d === 6
  })()
  const pricePerPerson = getPriceForSlot(playOption, startTime, gamePrices, isWeekend)
  const effectivePeopleCount = peopleCount < 1 ? 1 : peopleCount
  const amount = pricePerPerson * effectivePeopleCount

  /** 종료 시간 = 시작 시간 + (1인 기준 이용시간 × 인원수) */
  const endTime =
    playOption.trim() === ''
      ? ''
      : minutesToTimeStr(
          timeToMinutes(startTime) + getDurationMinutesPerPerson(playOption) * effectivePeopleCount
        )

  // 회원 조회: 이름·핸드폰 뒷자리로 필터
  const filteredMembers = members.filter((m) => {
    const nameMatch = !searchName.trim() || (m.name ?? '').toLowerCase().includes(searchName.trim().toLowerCase())
    const phone = (m.phone ?? '').replace(/\D/g, '')
    const lastDigits = searchPhoneLast.replace(/\D/g, '')
    const phoneMatch = !lastDigits || phone.endsWith(lastDigits)
    return nameMatch && phoneMatch
  })

  const displayMemberId =
    filteredMembers.some((m) => m.id === selectedMemberId) ? selectedMemberId : filteredMembers[0]?.id ?? ''
  const selectedMember = members.find((m) => m.id === displayMemberId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!playOption.trim()) {
      setError('플레이 옵션을 선택해주세요.')
      return
    }
    if (peopleCount < 1) {
      setError('인원을 입력해주세요.')
      return
    }
    if (memberMode === 'existing') {
      if (filteredMembers.length > 0 && !selectedMemberId) {
        setError('회원을 선택해주세요.')
        return
      }
    }
    setError('')
    setStep('payment')
  }

  const handlePaymentConfirm = async () => {
    if (!playOption.trim()) {
      setError('플레이 옵션을 선택해주세요.')
      return
    }
    if (peopleCount < 1) {
      setError('인원을 입력해주세요.')
      return
    }
    const memberName =
      memberMode === 'existing'
        ? (selectedMember?.name ?? '')
        : (newMemberName.trim() || '신규회원')

    setPaymentSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/payment/koven', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          memberName,
          roomNumber,
          playOption,
          peopleCount: effectivePeopleCount,
          startTime,
          endTime: endTime || undefined,
          paymentType,
          paymentMethod,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || '결제 요청에 실패했습니다.')
        setPaymentSubmitting(false)
        return
      }
      const { pgUrl, formData } = data as { pgUrl: string; formData: Record<string, string> }
      if (!pgUrl || !formData) {
        setError('결제 정보를 받지 못했습니다.')
        setPaymentSubmitting(false)
        return
      }
      onConfirm({
        memberId: memberMode === 'existing' ? displayMemberId : '',
        memberName,
        ...(memberMode === 'new' && { memberPhone: newMemberPhone.replace(/\D/g, '').trim() || undefined }),
        playOption,
        peopleCount: effectivePeopleCount,
        startTime,
        ...(endTime && { endTime }),
        amount,
        paymentType,
        paymentMethod,
        splitCount,
      })
      onClose()
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
    } catch (e) {
      setError('결제 요청 중 오류가 발생했습니다.')
      setPaymentSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex ${step === 'payment' ? 'max-w-3xl w-full' : 'max-w-md w-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 왼쪽: 이용등록 폼 (항상 표시) */}
        <div className={`flex flex-col ${step === 'payment' ? 'w-[26rem] shrink-0 border-r border-gray-200' : 'w-full'} max-h-[90vh]`}>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl shrink-0 min-h-[3.5rem]">
            <h2 className="text-xl font-bold text-gray-800 leading-none">
              {roomNumber}번방 이용등록
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 -m-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors flex items-center justify-center shrink-0"
              aria-label="닫기"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* 1. 회원 선택 / 신규회원 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              회원 구분
            </label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setMemberMode('existing')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors border ${
                  memberMode === 'existing'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                회원 조회
              </button>
              <button
                type="button"
                onClick={() => setMemberMode('new')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors border ${
                  memberMode === 'new'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                신규회원
              </button>
            </div>

            {memberMode === 'existing' ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">이름</label>
                    <input
                      type="text"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      placeholder="이름 검색"
                      className="w-full min-w-0 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 placeholder-gray-400 focus:ring-0 focus:border-gray-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">핸드폰 뒷자리</label>
                    <input
                      type="text"
                      value={searchPhoneLast}
                      onChange={(e) => setSearchPhoneLast(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="뒷 4자리"
                      maxLength={4}
                      className="w-full min-w-0 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 placeholder-gray-400 focus:ring-0 focus:border-gray-400 outline-none"
                    />
                  </div>
                </div>
                {!loading && filteredMembers.length > 0 ? (
                  <select
                    value={displayMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 focus:ring-0 focus:border-gray-400 outline-none"
                  >
                    {filteredMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.phone || m.email})
                      </option>
                    ))}
                  </select>
                ) : null}
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">이름</label>
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="이름"
                    className="w-full min-w-0 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 placeholder-gray-400 focus:ring-0 focus:border-gray-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">핸드폰번호</label>
                  <input
                    type="tel"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(formatPhoneHyphen(e.target.value))}
                    placeholder="010-0000-0000"
                    className="w-full min-w-0 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 placeholder-gray-400 focus:ring-0 focus:border-gray-400 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. 플레이 옵션 & 인원 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                플레이 옵션
              </label>
              <div className="relative">
                <select
                  value={playOption}
                  onChange={(e) => setPlayOption(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-gray-800 focus:ring-0 focus:border-gray-400 outline-none appearance-none bg-white"
                >
                  <option value="">선택해주세요</option>
                  {playOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                인원
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-gray-400">
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={peopleCount === 0 ? '' : peopleCount}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw === '') {
                      setPeopleCount(0)
                      return
                    }
                    const v = Number(raw)
                    setPeopleCount(Number.isNaN(v) ? 0 : Math.min(99, Math.max(0, Math.floor(v))))
                  }}
                  placeholder="0"
                  className="flex-1 min-w-0 border-0 py-2.5 pl-3 pr-2 text-gray-800 focus:ring-0 focus:border-0 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-gray-600 font-medium shrink-0 pr-3 py-2.5">명</span>
              </div>
            </div>
          </div>

          {/* 3. 예약시간 (슬라이더 형식 - 버튼 없음) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              예약시간
            </label>
            <div className="px-1">
              <div className="text-center mb-2">
                <span className="text-2xl font-bold text-blue-600 tabular-nums">{startTime}</span>
              </div>
              <input
                type="range"
                min={0}
                max={TIME_SLOTS_30MIN.length - 1}
                step={1}
                value={Math.min(TIME_SLOTS_30MIN.length - 1, Math.max(0, TIME_SLOTS_30MIN.indexOf(startTime)))}
                onChange={(e) => {
                  const idx = Number(e.target.value)
                  setStartTime(TIME_SLOTS_30MIN[idx] ?? startTime)
                }}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                aria-label="예약 시간 선택"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>00:00</span>
                <span>24:00</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">바를 좌우로 드래그하여 예약 시간을 선택하세요.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              종료 시간
            </label>
            <input
              type="text"
              readOnly
              value={endTime ? `${endTime}` : '플레이 옵션을 선택하면 자동 계산됩니다'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-600 bg-gray-50 focus:ring-0 focus:border-gray-300 outline-none"
            />
          </div>

        </form>
        </div>

        {/* 오른쪽: 결제 팝업 (등록하기 클릭 시 옆에 붙어서 표시) */}
        {step === 'payment' && (
          <div className="w-[22rem] shrink-0 flex flex-col bg-white max-h-[90vh] overflow-hidden rounded-r-2xl">
            <div className="border-b border-gray-200 px-6 py-4 shrink-0 min-h-[3.5rem] flex items-center">
              <h3 className="text-xl font-bold text-gray-800 leading-none">결제하기</h3>
            </div>
            <div className="p-5 space-y-5 overflow-y-auto flex-1 min-h-0">
              {/* 결제 금액 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">결제 금액</label>
                <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                  <p className="text-2xl font-bold text-blue-600">
                    {amount.toLocaleString()}원
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedOption?.label ?? '-'} × {effectivePeopleCount}명 = {amount.toLocaleString()}원
                  </p>
                </div>
              </div>

              {/* 결제방식: 쿠폰, 현금, 카드, 포스 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">결제방식</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'coupon', label: '쿠폰' },
                    { value: 'cash', label: '현금' },
                    { value: 'card', label: '카드' },
                    { value: 'pos', label: '포스' },
                  ].map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentType(m.value)}
                      className={`py-2.5 px-3 rounded-lg font-medium text-sm transition-colors border ${
                        paymentType === m.value
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 결제방법: 일반결제, 부분결제, 분할결제 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">결제방법</label>
                <div className="flex gap-2">
                  {[
                    { value: 'normal', label: '일반결제' },
                    { value: 'partial', label: '부분결제' },
                    { value: 'installment', label: '분할결제' },
                  ].map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className={`flex-1 py-2.5 px-3 rounded-lg font-medium text-sm transition-colors border ${
                        paymentMethod === m.value
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
            <button
              type="button"
              onClick={handlePaymentConfirm}
              disabled={paymentSubmitting}
              className="flex-1 py-3 px-4 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {paymentSubmitting ? '처리 중...' : '결제하기'}
            </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
