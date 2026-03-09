'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiCalendar, FiClock, FiUsers } from 'react-icons/fi'

interface ReservationFormProps {
  storeId: string
}

export default function ReservationForm({ storeId }: ReservationFormProps) {
  const router = useRouter()
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [players, setPlayers] = useState(4)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId,
          date,
          time,
          players,
        }),
      })

      if (response.ok) {
        alert('예약이 완료되었습니다!')
        router.push('/reservations')
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

  const today = new Date().toISOString().split('T')[0]
  const times = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  ]

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">예약하기</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="flex items-center space-x-2 mb-2 text-gray-700 font-semibold">
            <FiCalendar />
            <span>예약 날짜</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={today}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#00ACEE]"
          />
        </div>

        <div>
          <label className="flex items-center space-x-2 mb-2 text-gray-700 font-semibold">
            <FiClock />
            <span>예약 시간</span>
          </label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#00ACEE]"
          >
            <option value="">시간 선택</option>
            {times.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center space-x-2 mb-2 text-gray-700 font-semibold">
            <FiUsers />
            <span>인원 수</span>
          </label>
          <select
            value={players}
            onChange={(e) => setPlayers(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#00ACEE]"
          >
            {[1, 2, 3, 4].map((num) => (
              <option key={num} value={num}>
                {num}명
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !date || !time}
          className="w-full bg-[#00ACEE] text-white py-3 rounded-lg font-semibold hover:bg-[#0088c2] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '예약 중...' : '예약하기'}
        </button>
      </form>
    </div>
  )
}

