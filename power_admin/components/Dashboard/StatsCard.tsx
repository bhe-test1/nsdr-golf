'use client'

import { IconType } from 'react-icons'

interface StatsCardProps {
  title: string
  value: string
  change?: string
  icon: IconType
  color: string
  trend?: 'up' | 'down'
}

export default function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  trend = 'up',
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {change && (
            <div className="flex items-center gap-1">
              <span
                className={`text-sm font-medium ${
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend === 'up' ? '↑' : '↓'} {change}
              </span>
              <span className="text-sm text-gray-500">전월 대비</span>
            </div>
          )}
        </div>
        <div className={`${color} p-4 rounded-xl`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  )
}

