'use client'

import { useState, useEffect } from 'react'
import { FiMonitor, FiZap, FiVideo, FiCpu, FiClock, FiUsers, FiDollarSign } from 'react-icons/fi'

interface RoomCardProps {
  roomNumber: number
  isActive: boolean
  gameTime?: string
  remainingTime?: string
  players?: number
  gameName?: string
  paymentAmount?: number
  onRegister?: () => void
  onRoomTransfer?: () => void
  onControl?: (type: 'light' | 'beam' | 'pc' | 'monitor') => void
  onToggleAll?: () => void
}

export default function RoomCard({
  roomNumber,
  isActive,
  gameTime,
  remainingTime,
  players,
  gameName,
  paymentAmount,
  onRegister,
  onRoomTransfer,
  onControl,
  onToggleAll,
}: RoomCardProps) {
  const [allOn, setAllOn] = useState(isActive)
  const [monitorOn, setMonitorOn] = useState(isActive)
  const [lightOn, setLightOn] = useState(isActive)
  const [beamOn, setBeamOn] = useState(isActive)
  const [pcOn, setPcOn] = useState(isActive)
  const [showRegisterMessage, setShowRegisterMessage] = useState(false)

  // 이용등록으로 룸이 활성화되면 전체켜기 + 모든 장비 자동 ON
  useEffect(() => {
    if (isActive) {
      setAllOn(true)
      setMonitorOn(true)
      setLightOn(true)
      setBeamOn(true)
      setPcOn(true)
    }
  }, [isActive])

  const handleToggleAll = () => {
    if (!isActive) {
      setShowRegisterMessage(true)
      setTimeout(() => setShowRegisterMessage(false), 2500)
      return
    }
    const newState = !allOn
    setAllOn(newState)
    setMonitorOn(newState)
    setLightOn(newState)
    setBeamOn(newState)
    setPcOn(newState)
    onToggleAll?.()
  }

  const handleControl = (type: 'monitor' | 'light' | 'beam' | 'pc') => {
    if (type === 'monitor') setMonitorOn(!monitorOn)
    if (type === 'light') setLightOn(!lightOn)
    if (type === 'beam') setBeamOn(!beamOn)
    if (type === 'pc') setPcOn(!pcOn)
    onControl?.(type)
  }

  return (
    <div
      className={`rounded-2xl bg-white p-4 shadow-md transition-all ${
        isActive
          ? 'border-2 border-blue-400 shadow-[0_0_0_1px_rgba(59,130,246,0.4),0_0_20px_rgba(59,130,246,0.2),0_0_40px_rgba(59,130,246,0.1)]'
          : 'border-2 border-blue-200/60 shadow-[0_0_15px_rgba(59,130,246,0.08)] hover:border-blue-300 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.2),0_0_18px_rgba(59,130,246,0.12)]'
      }`}
    >
      {/* 룸 번호 + 전체켜기/끄기 토글 - 이용등록 완료 시 흰 배경 + 연한 테두리 + 진한 숫자 */}
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg ${
            isActive
              ? 'bg-white border-2 border-blue-300 text-blue-800'
              : 'bg-gray-200 text-gray-900'
          }`}
        >
          {roomNumber}
        </div>
        <div className="relative flex items-center gap-2">
          {showRegisterMessage && (
            <span
              className="absolute bottom-full right-0 mb-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-full shadow-lg whitespace-nowrap z-10"
              aria-live="polite"
            >
              이용등록 바랍니다.
            </span>
          )}
          <span className="text-xs font-medium text-gray-600">
            {allOn ? '전체끄기' : '전체켜기'}
          </span>
          <button
            onClick={handleToggleAll}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              allOn ? 'bg-amber-400' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                allOn ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 장비 아이콘 영역 - 활성 시 파란 바, 비활성 시 회색 아이콘만 */}
      <div
        className={`flex items-center justify-between rounded-xl px-3 py-2.5 mb-4 ${
          isActive ? 'bg-blue-600' : 'bg-transparent'
        }`}
      >
        {[
          { type: 'monitor' as const, label: 'PC', on: monitorOn, Icon: FiMonitor },
          { type: 'light' as const, label: '조명', on: lightOn, Icon: FiZap },
          { type: 'beam' as const, label: '정면빔', on: beamOn, Icon: FiVideo },
          { type: 'pc' as const, label: '냉난방기', on: pcOn, Icon: FiCpu },
        ].map(({ type, label, on, Icon }) => (
          <div key={type} className="relative group">
            <button
              type="button"
              onClick={() => handleControl(type)}
              className={`p-1.5 rounded-lg transition-colors ${
                isActive
                  ? on
                    ? 'text-amber-300'
                    : 'text-blue-200'
                  : on
                    ? 'text-amber-500'
                    : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
            <span
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-20 whitespace-nowrap"
              aria-hidden
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* 활성 룸 정보 (아이콘 + 텍스트) */}
      {isActive ? (
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-gray-600">
              <FiClock className="w-4 h-4 shrink-0 text-gray-400" />
              게임시간
            </span>
            <span className="font-medium text-gray-800 truncate">{gameTime}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-gray-600">
              <FiUsers className="w-4 h-4 shrink-0 text-gray-400" />
              인원
            </span>
            <span className="font-medium text-gray-800">
              {players}명{gameName === '스트로크18홀' ? ' (스트로크18홀)' : ''}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-gray-600">
              <FiClock className="w-4 h-4 shrink-0 text-gray-400" />
              남은시간
            </span>
            <span className="font-medium text-red-600">{remainingTime}</span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
            <span className="flex items-center gap-1.5 text-gray-600">
              <FiDollarSign className="w-4 h-4 shrink-0 text-gray-400" />
              결제금액
            </span>
            <span className="font-bold text-blue-600">
              {paymentAmount?.toLocaleString()}원
            </span>
          </div>
          {onRoomTransfer && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRoomTransfer()
              }}
              className="w-full mt-3 py-2 px-3 text-sm font-medium text-white bg-sky-500 rounded-xl hover:bg-sky-600 transition-colors"
            >
              룸이동
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center py-6">
          <button
            onClick={onRegister}
            className="px-8 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors border border-gray-200"
          >
            이용등록
          </button>
        </div>
      )}
    </div>
  )
}
