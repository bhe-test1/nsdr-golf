'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiCalendar, FiClock, FiUsers, FiMapPin } from 'react-icons/fi'

interface Reservation {
  id: string
  date: string
  time: string
  players: number | null
  status: string
  store: {
    id: string
    name: string
    location: string
  }
}

export default function ReservationsPage() {
  const router = useRouter()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchReservations = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/reservations')
        if (response.ok) {
          const data = await response.json()
          setReservations(data)
        }
      } catch (error) {
        console.error('예약 목록을 불러오는데 실패했습니다:', error)
        setReservations([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchReservations()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-sky-100 text-blue-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '확정'
      case 'PENDING':
        return '대기중'
      case 'CANCELLED':
        return '취소됨'
      default:
        return status
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">예약 내역</h1>

      {reservations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">예약 내역이 없습니다.</p>
          <Link
            href="/stores"
            className="inline-block px-6 py-3 bg-[#00ACEE] text-white rounded-lg hover:bg-[#0088c2] transition"
          >
            골프장 찾기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link
                    href={`/stores/${reservation.store.id}`}
                    className="text-xl font-bold text-gray-800 hover:text-blue-600 transition mb-2"
                  >
                    {reservation.store.name}
                  </Link>
                  
                  <div className="flex items-center text-gray-600 mb-2">
                    <FiMapPin className="mr-1" />
                    <span className="text-sm">{reservation.store.location}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <FiCalendar className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">예약 날짜</p>
                        <p className="font-semibold">
                          {new Date(reservation.date).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <FiClock className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">예약 시간</p>
                        <p className="font-semibold">{reservation.time}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <FiUsers className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">인원</p>
                        <p className="font-semibold">{reservation.players || 4}명</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ml-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                      reservation.status
                    )}`}
                  >
                    {getStatusText(reservation.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

