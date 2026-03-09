'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiClock, 
  FiFileText,
  FiEdit2,
  FiHome,
  FiX,
  FiMapPin,
  FiUsers,
  FiFlag,
  FiTrash2
} from 'react-icons/fi'
import Link from 'next/link'

interface User {
  id: string
  email: string
  name: string
  phone?: string | null
  createdAt: string
}

interface Reservation {
  id: string
  storeId: string
  date: string
  time: string
  players: number
  status: string
  room?: string | null
  reservatorName?: string
  contactNumber?: string
  playType?: string | null
  holes?: string | null
  gameCount?: string | null
  store?: {
    id: string
    name: string
    location: string
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'reservations' | 'cancelled'>('profile')
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState<Reservation | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Reservation | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    // 페이지 로드 시 스크롤 활성화
    const mainElement = document.querySelector('main')
    if (mainElement) {
      mainElement.style.overflow = 'auto'
      mainElement.style.overflowY = 'auto'
      mainElement.style.height = '100vh'
      mainElement.style.maxHeight = '100vh'
    }

    const fetchUser = async () => {
      setIsLoading(true)
      try {
        // 토큰 가져오기 (localStorage 또는 cookie에서)
        const token = localStorage.getItem('token')
        
        // 토큰이 없으면 바로 로그인 페이지로 리다이렉트
        if (!token) {
          router.push('/login')
          return
        }
        
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          setUser(data)
          
          // 예약 내역도 함께 가져오기
          if (data.id) {
            fetchReservations(data.id, token)
          }
        } else if (response.status === 401) {
          // 인증 실패 시 토큰 제거하고 로그인 페이지로
          localStorage.removeItem('token')
          router.push('/login')
        }
      } catch (error) {
        console.error('사용자 정보를 불러오는데 실패했습니다:', error)
        // 에러 발생 시에도 로그인 페이지로 리다이렉트
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()

    // 컴포넌트 언마운트 시 원래대로 복원
    return () => {
      if (mainElement) {
        mainElement.style.overflow = 'hidden'
        mainElement.style.overflowY = 'hidden'
      }
    }
  }, [router])

  const fetchReservations = async (userId: string, token: string) => {
    try {
      const response = await fetch('/api/reservations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setReservations(data || [])
      }
    } catch (error) {
      console.error('예약 내역을 불러오는데 실패했습니다:', error)
    }
  }

  const handleCancelReservation = async (reservation: Reservation) => {
    setIsCancelling(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('로그인이 필요합니다.')
        router.push('/login')
        return
      }

      const response = await fetch(`/api/reservations?id=${reservation.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // 예약 목록 새로고침
        if (user) {
          await fetchReservations(user.id, token)
        }
        // 모달이 열려있으면 닫기
        if (showDetailModal) {
          setShowDetailModal(false)
          setSelectedReservation(null)
        }
      } else {
        const data = await response.json()
        alert(data.message || '예약 취소에 실패했습니다.')
      }
    } catch (error) {
      console.error('예약 취소 실패:', error)
      alert('예약 취소 중 오류가 발생했습니다.')
    } finally {
      setIsCancelling(false)
      setCancelConfirm(null)
    }
  }

  const handleDeleteReservation = async (reservation: Reservation) => {
    setIsDeleting(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('로그인이 필요합니다.')
        router.push('/login')
        return
      }

      const response = await fetch(`/api/reservations?id=${reservation.id}&permanent=true`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // 예약 목록 새로고침
        if (user) {
          await fetchReservations(user.id, token)
        }
        // 모달이 열려있으면 닫기
        if (showDetailModal) {
          setShowDetailModal(false)
          setSelectedReservation(null)
        }
      } else {
        const data = await response.json()
        alert(data.message || '예약 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('예약 삭제 실패:', error)
      alert('예약 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
      setDeleteConfirm(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; color: string } } = {
      'PENDING': { text: '대기중', color: 'bg-yellow-100 text-yellow-800' },
      'CONFIRMED': { text: '확정', color: 'bg-sky-100 text-blue-800' },
      'CANCELLED': { text: '취소', color: 'bg-red-100 text-red-800' },
    }
    
    const statusInfo = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    )
  }

  // 예약 시간이 지났는지 확인하는 함수
  const isReservationTimePassed = (reservation: Reservation): boolean => {
    try {
      // 예약 날짜를 Date 객체로 변환
      const reservationDate = new Date(reservation.date)
      
      // 시간 문자열 파싱 (예: "16:00" 또는 "14:30")
      const timeMatch = reservation.time.match(/(\d{1,2}):(\d{2})/)
      if (!timeMatch) {
        console.error('시간 형식이 올바르지 않습니다:', reservation.time)
        return false
      }
      
      const hours = parseInt(timeMatch[1], 10)
      const minutes = parseInt(timeMatch[2], 10)
      
      // 예약 날짜에 시간 설정
      reservationDate.setHours(hours, minutes, 0, 0)
      
      // 현재 시간과 비교
      const now = new Date()
      return reservationDate < now
    } catch (error) {
      console.error('예약 시간 확인 중 오류:', error)
      return false
    }
  }

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-white">
        <div className="relative z-10 text-center bg-white border border-gray-100 rounded-xl shadow-sm p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-900 font-semibold">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-white">
        <div className="relative z-10 text-center bg-white border border-gray-100 rounded-xl shadow-sm p-8">
          <p className="text-gray-900 font-semibold mb-4">로그인이 필요합니다.</p>
          <Link 
            href="/login"
            className="inline-block px-6 py-2 bg-[#3952B6] text-white rounded-lg hover:bg-[#2d4190] transition"
          >
            로그인하기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen h-full flex flex-col overflow-y-auto bg-gray-100">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 pb-24 md:pb-8 flex flex-col flex-1 min-h-0 w-full">
        {/* 프로필 요약 - 심플한 원형 아바타 + 이름/이메일, 하단 여백으로 탭과 간격 */}
        <div className="bg-gray-100 border-b border-gray-200 pt-5 sm:pt-6 pb-8 sm:pb-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <FiUser className="text-gray-400 text-2xl sm:text-3xl" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{user.name}</h1>
              <p className="text-gray-700 text-sm sm:text-base mt-0.5 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 + 컨텐츠 - 흰색 한 블록, 좌우·아래 끝까지 */}
        <div className="w-screen relative left-1/2 -translate-x-1/2 bg-white border-t border-gray-200 flex-1 flex flex-col min-h-0">
          {/* 탭 버튼 행 - 활성 시 탭 바 전체 아래에 색상 바 */}
          <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 border-b border-gray-100">
            <div className="max-w-6xl mx-auto flex gap-0 w-full">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 min-w-0 px-2 sm:px-5 py-3.5 text-center text-sm sm:text-base font-bold transition whitespace-nowrap border-b-2 flex items-center justify-center ${
                  activeTab === 'profile' ? 'border-[#3952B6] text-[#3952B6]' : 'border-transparent text-gray-900'
                }`}
              >
                <span className="font-bold truncate block w-full">프로필</span>
              </button>
              <button
                onClick={() => setActiveTab('reservations')}
                className={`flex-1 min-w-0 px-2 sm:px-5 py-3.5 text-center text-sm sm:text-base font-bold transition whitespace-nowrap border-b-2 flex items-center justify-center gap-0.5 ${
                  activeTab === 'reservations' ? 'border-[#3952B6] text-[#3952B6]' : 'border-transparent text-gray-900'
                }`}
              >
                <span className="font-bold truncate block">예약내역</span>
                {reservations.filter(r => r.status !== 'CANCELLED').length > 0 && (
                  <span className="text-gray-400 font-normal shrink-0">({reservations.filter(r => r.status !== 'CANCELLED').length})</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('cancelled')}
                className={`flex-1 min-w-0 px-2 sm:px-5 py-3.5 text-center text-sm sm:text-base font-bold transition whitespace-nowrap border-b-2 flex items-center justify-center gap-0.5 ${
                  activeTab === 'cancelled' ? 'border-[#3952B6] text-[#3952B6]' : 'border-transparent text-gray-900'
                }`}
              >
                <span className="font-bold truncate block">취소내역</span>
                {reservations.filter(r => r.status === 'CANCELLED').length > 0 && (
                  <span className="text-gray-400 font-normal shrink-0">({reservations.filter(r => r.status === 'CANCELLED').length})</span>
                )}
              </button>
            </div>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="flex-1 flex flex-col min-h-0 pt-4 sm:pt-6 pb-8 px-3 sm:px-6 lg:px-8 overflow-y-auto">
          {activeTab === 'profile' && (
            <div className="flex-1 min-h-[50vh] pt-8 sm:pt-10">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between gap-3 mb-0 pb-2 border-b border-gray-100">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-600">프로필정보</h2>
                  {!isEditingProfile ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditEmail(user.email)
                        setEditPhone(user.phone || '')
                        setProfileError(null)
                        setIsEditingProfile(true)
                      }}
                      className="flex items-center gap-1.5 text-[#3952B6] hover:text-[#2d4190] hover:underline text-sm font-medium"
                    >
                      <FiEdit2 className="w-4 h-4" />
                      <span>수정</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setProfileError(null)
                          setIsSavingProfile(true)
                          try {
                            const token = localStorage.getItem('token')
                            if (!token) {
                              router.push('/login')
                              return
                            }
                            const res = await fetch('/api/auth/me', {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({ email: editEmail.trim(), phone: editPhone.trim() || null }),
                            })
                            const data = await res.json()
                            if (!res.ok) {
                              setProfileError(data.message || '저장에 실패했습니다.')
                              return
                            }
                            setUser(data)
                            setIsEditingProfile(false)
                          } catch (e) {
                            console.error(e)
                            setProfileError('저장에 실패했습니다.')
                          } finally {
                            setIsSavingProfile(false)
                          }
                        }}
                        disabled={isSavingProfile}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3952B6] text-white rounded-lg hover:bg-[#2d4190] text-sm font-medium disabled:opacity-60"
                      >
                        {isSavingProfile ? '저장 중…' : '저장'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingProfile(false)
                          setProfileError(null)
                        }}
                        disabled={isSavingProfile}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-60"
                      >
                        취소
                      </button>
                    </div>
                  )}
                </div>
                {profileError && (
                  <p className="mt-2 text-sm text-red-600">{profileError}</p>
                )}
                <div className="divide-y divide-gray-100 mt-3 sm:mt-4 pb-20 sm:pb-28">
                  <div className="py-4">
                    <p className="text-sm text-gray-500 mb-1">이메일</p>
                    {isEditingProfile ? (
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3952B6] focus:border-transparent"
                        placeholder="이메일"
                      />
                    ) : (
                      <p className="text-gray-900">{user.email}</p>
                    )}
                  </div>
                  <div className="py-4">
                    <p className="text-sm text-gray-500 mb-1">전화번호</p>
                    {isEditingProfile ? (
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3952B6] focus:border-transparent"
                        placeholder="전화번호"
                      />
                    ) : (
                      <p className="text-gray-900">{user.phone || '-'}</p>
                    )}
                  </div>
                  <div className="py-4">
                    <p className="text-sm text-gray-500 mb-1">가입일</p>
                    <p className="text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reservations' && (
              <div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">예약 내역</h2>
              {(() => {
                const activeReservations = reservations.filter(r => r.status !== 'CANCELLED')
                return activeReservations.length === 0 ? (
                  <div className="text-center py-12">
                    <FiClock className="text-gray-400 text-5xl mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">예약 내역이 없습니다.</p>
                    <Link
                      href="/stores"
                      className="inline-block px-6 py-2 bg-[#3952B6] text-white rounded-lg hover:bg-[#2d4190] transition"
                    >
                      매장 둘러보기
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeReservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="bg-white border border-gray-100 rounded-lg p-4 hover:bg-gray-50/50 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => {
                              setSelectedReservation(reservation)
                              setShowDetailModal(true)
                            }}
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              <FiHome className="text-blue-600" />
                              <h3 className="font-semibold text-gray-900">
                                {reservation.store?.name || '매장 정보 없음'}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-700 mb-1">
                              {reservation.store?.location || ''}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>
                                {new Date(reservation.date).toLocaleDateString('ko-KR')} {reservation.time}
                              </span>
                              <span>{reservation.players}명</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {getStatusBadge(reservation.status)}
                            {!isReservationTimePassed(reservation) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setCancelConfirm(reservation)
                                }}
                                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition flex items-center space-x-1"
                                disabled={isCancelling}
                              >
                                <FiTrash2 className="w-4 h-4" />
                                <span>취소</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}

          {activeTab === 'cancelled' && (
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">취소 내역</h2>
              {(() => {
                const cancelledReservations = reservations.filter(r => r.status === 'CANCELLED')
                return cancelledReservations.length === 0 ? (
                  <div className="text-center py-12">
                    <FiClock className="text-gray-400 text-5xl mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">취소된 예약 내역이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cancelledReservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="bg-white border border-gray-100 rounded-lg p-4 hover:bg-gray-50/50 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div 
                            className="flex-1 cursor-pointer min-w-0"
                            onClick={() => {
                              setSelectedReservation(reservation)
                              setShowDetailModal(true)
                            }}
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              <FiHome className="text-blue-600 shrink-0" />
                              <h3 className="font-semibold text-gray-900">
                                {reservation.store?.name || '매장 정보 없음'}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-700 mb-1">
                              {reservation.store?.location || ''}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>
                                {new Date(reservation.date).toLocaleDateString('ko-KR')} {reservation.time}
                              </span>
                              <span>{reservation.players}명</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end justify-start space-y-2 shrink-0">
                            {getStatusBadge(reservation.status)}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteConfirm(reservation)
                              }}
                              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition flex items-center space-x-1"
                              disabled={isDeleting}
                            >
                              <FiTrash2 className="w-4 h-4" />
                              <span>삭제</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}

          </div>
        </div>
      </div>

      {/* 예약 상세보기 모달 */}
      {showDetailModal && selectedReservation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => {
            setShowDetailModal(false)
            setSelectedReservation(null)
          }}
        >
          <div
            className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">예약 상세 정보</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedReservation(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <FiX className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-6 space-y-6">
              {/* 예약자 정보 */}
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">예약자 정보</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <FiUser className="text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">예약자명</p>
                      <p className="font-semibold text-gray-900">{selectedReservation.reservatorName || user?.name || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FiPhone className="text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">연락처</p>
                      <p className="font-semibold text-gray-900">{selectedReservation.contactNumber || user?.phone || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 매장 정보 */}
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">매장 정보</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <FiHome className="text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">매장명</p>
                      <p className="font-semibold text-gray-900">{selectedReservation.store?.name || '매장 정보 없음'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FiMapPin className="text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">주소</p>
                      <p className="font-semibold text-gray-900">{selectedReservation.store?.location ? selectedReservation.store.location.replace(/\|/g, ', ') : '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 예약 정보 - 2열 그리드 */}
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">예약 정보</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="flex items-center space-x-3">
                    <FiCalendar className="text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-600">예약 날짜</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {new Date(selectedReservation.date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FiClock className="text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-600">예약 시간</p>
                      <p className="font-semibold text-gray-900">{selectedReservation.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FiUsers className="text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-600">인원</p>
                      <p className="font-semibold text-gray-900">{selectedReservation.players}명</p>
                    </div>
                  </div>
                  {selectedReservation.playType && (
                    <div className="flex items-center space-x-3">
                      <FiFlag className="text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-600">플레이 타입</p>
                        <p className="font-semibold text-gray-900">{selectedReservation.playType}</p>
                      </div>
                    </div>
                  )}
                  {selectedReservation.holes && (
                    <div className="flex items-center space-x-3">
                      <FiFlag className="text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-600">홀</p>
                        <p className="font-semibold text-gray-900">{selectedReservation.holes}</p>
                      </div>
                    </div>
                  )}
                  {selectedReservation.gameCount && (
                    <div className="flex items-center space-x-3">
                      <FiFlag className="text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-600">게임 수</p>
                        <p className="font-semibold text-gray-900">{selectedReservation.gameCount}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end space-x-3">
              {selectedReservation.status !== 'CANCELLED' && !isReservationTimePassed(selectedReservation) && (
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setCancelConfirm(selectedReservation)
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
                  disabled={isCancelling}
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span>예약 취소</span>
                </button>
              )}
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedReservation(null)
                }}
                className="px-6 py-2 bg-[#3952B6] text-white rounded-lg hover:bg-[#2d4190] transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 취소 확인 팝업 */}
      {cancelConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" 
          onClick={() => !isCancelling && setCancelConfirm(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">예약 취소 확인</h3>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">{cancelConfirm.store?.name || '매장'}</span>의 예약을 정말 취소하시겠습니까?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(cancelConfirm.date).toLocaleDateString('ko-KR')} {cancelConfirm.time}
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setCancelConfirm(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                disabled={isCancelling}
              >
                아니오
              </button>
              <button
                onClick={() => handleCancelReservation(cancelConfirm)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-sm flex items-center space-x-2"
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>처리 중...</span>
                  </>
                ) : (
                  <>
                    <FiTrash2 className="w-4 h-4" />
                    <span>예, 취소합니다</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 팝업 */}
      {deleteConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" 
          onClick={() => !isDeleting && setDeleteConfirm(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">예약 삭제 확인</h3>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">{deleteConfirm.store?.name || '매장'}</span>의 취소된 예약을 완전히 삭제하시겠습니까?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(deleteConfirm.date).toLocaleDateString('ko-KR')} {deleteConfirm.time}
              </p>
              <p className="text-sm text-red-600 mt-2 font-medium">
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                disabled={isDeleting}
              >
                아니오
              </button>
              <button
                onClick={() => handleDeleteReservation(deleteConfirm)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-sm flex items-center space-x-2"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>삭제 중...</span>
                  </>
                ) : (
                  <>
                    <FiTrash2 className="w-4 h-4" />
                    <span>예, 삭제합니다</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

