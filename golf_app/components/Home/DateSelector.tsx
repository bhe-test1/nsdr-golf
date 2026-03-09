'use client'

import { useState } from 'react'
import { FiCalendar } from 'react-icons/fi'

export default function DateSelector() {
  const [selectedDate, setSelectedDate] = useState(16) // 오늘 날짜
  const today = new Date()
  const currentDay = today.getDate()

  // 날짜 목록 생성 (15일 ~ 28일)
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(today)
    date.setDate(currentDay + i - 1)
    return {
      day: date.getDate(),
      dayName: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
      isToday: date.getDate() === currentDay,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    }
  })

  return (
    <div className="px-4 py-3 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-800 text-sm">12월</span>
          <button className="p-1">
            <FiCalendar className="text-gray-400 text-sm" />
          </button>
        </div>
      </div>

      <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-1">
        {dates.map((date, index) => (
          <button
            key={index}
            onClick={() => setSelectedDate(date.day)}
            className={`flex flex-col items-center justify-center min-w-[56px] py-2 px-2 rounded-lg transition ${
              date.isToday
                ? 'bg-red-500 text-white'
                : date.isWeekend
                ? 'bg-red-50 text-red-600'
                : selectedDate === date.day
                ? 'bg-sky-50 text-blue-600'
                : 'bg-transparent text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="text-xs mb-0.5">{date.dayName}</span>
            <span className={`text-sm font-semibold ${date.isToday ? 'text-white' : ''}`}>
              {date.day}
            </span>
            {date.isToday && (
              <span className="text-[10px] mt-0.5 opacity-90">오늘</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

