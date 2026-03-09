'use client'

import { FiGrid, FiStar, FiUsers, FiMessageCircle } from 'react-icons/fi'
import { MdLightbulb } from 'react-icons/md'

interface PostFiltersProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

const categories = [
  { value: 'all', label: '전체', icon: FiGrid },
  { value: 'review', label: '☆ 후기', icon: FiStar },
  { value: 'tip', label: '💡 팁', icon: MdLightbulb },
  { value: 'mate', label: '👥 동반자', icon: FiUsers },
  { value: 'general', label: '💬 자유', icon: FiMessageCircle },
]

export default function PostFilters({
  selectedCategory,
  onCategoryChange,
}: PostFiltersProps) {
  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      {categories.map((category) => {
        const Icon = category.icon
        const isSelected = selectedCategory === category.value
        return (
          <button
            key={category.value}
            onClick={() => onCategoryChange(category.value)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 border shrink-0 ${
              isSelected
                ? 'bg-[#00ACEE] text-white border-[#00ACEE] shadow-sm'
                : 'bg-gray-50/80 text-gray-600 border-gray-100 hover:bg-sky-50 hover:border-sky-100 hover:text-blue-700'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-current opacity-70'}`} />
            {category.label}
          </button>
        )
      })}
    </div>
  )
}
