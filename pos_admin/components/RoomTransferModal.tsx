'use client'

import { FiX } from 'react-icons/fi'

interface RoomTransferModalProps {
  fromRoomId: number
  rooms: Array<{
    id: number
    isActive: boolean
    gameTime?: string
    remainingTime?: string
    players?: number
    gameName?: string
    paymentAmount?: number
  }>
  onClose: () => void
  onConfirm: (toRoomId: number) => void
}

export default function RoomTransferModal({
  fromRoomId,
  rooms,
  onClose,
  onConfirm,
}: RoomTransferModalProps) {
  const fromRoom = rooms.find((r) => r.id === fromRoomId)
  const availableRooms = rooms.filter((r) => r.id !== fromRoomId && !r.isActive)

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">
            {fromRoomId}번방 → 이동할 방 선택
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            aria-label="닫기"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {fromRoom && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 text-sm text-gray-600">
            현재 {fromRoomId}번방 이용 중 · {fromRoom.gameTime} · {fromRoom.players}명 ·{' '}
            {fromRoom.paymentAmount?.toLocaleString()}원
          </div>
        )}

        <div className="p-6">
          {availableRooms.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              이동 가능한 빈 방이 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {availableRooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => onConfirm(room.id)}
                  className="py-4 rounded-xl border-2 border-gray-200 bg-white hover:border-sky-500 hover:bg-sky-50/50 font-bold text-gray-800 transition-colors"
                >
                  {room.id}번
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
