'use client'

import { useState } from 'react'
import { FiCloud, FiSun, FiMoon } from 'react-icons/fi'

export default function TimeFilters() {
  const [selectedTime, setSelectedTime] = useState('all')

  const timeFilters = [
    { id: 'all', label: '전체', icon: null },
    { id: 'dawn', label: '새벽', icon: <FiCloud className="text-lg" /> },
    { id: 'morning', label: '오전', icon: <FiSun className="text-lg" /> },
    { id: 'afternoon', label: '오후', icon: <FiSun className="text-lg" /> },
    { id: 'night', label: '야간', icon: <FiMoon className="text-lg" /> },
  ]

  return (
    <div className="px-4 py-3 bg-white border-b border-gray-100">
      <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-1">
        {timeFilters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setSelectedTime(filter.id)}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
              selectedTime === filter.id
                ? 'bg-[#00ACEE] text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.icon && <span className="flex-shrink-0">{filter.icon}</span>}
            <span>{filter.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

