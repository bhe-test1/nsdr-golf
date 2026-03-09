'use client'

import { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import { FiCalendar, FiClock, FiUser, FiUsers, FiSearch, FiFilter, FiCheckCircle, FiXCircle, FiAlertCircle, FiChevronLeft, FiChevronRight, FiList, FiGrid, FiHome, FiX } from 'react-icons/fi'

interface Reservation {
  id: string
  date: string
  time: string
  customerName: string
  phone: string
  players: number
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED'
  storeName: string
  amount: number
  roomNumber: number
  dayType?: 'weekday' | 'weekend' // 평일/주말 구분
  playType?: string | null
  holes?: string | null
}

function ReservationsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roomFilter, setRoomFilter] = useState<number | '전체'>('전체')
  const [dayTypeFilter, setDayTypeFilter] = useState<'weekday' | 'weekend'>('weekday')
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline')
  
  // URL 파라미터에서 초기 viewMode 설정 (외부에서 URL이 변경된 경우에만)
  useEffect(() => {
    if (isInternalUpdate.current) {
      return // 내부에서 변경한 경우 무시
    }
    const mode = searchParams.get('view') as 'timeline' | 'calendar' | null
    const expectedMode = mode === 'calendar' ? 'calendar' : 'timeline'
    if (viewMode !== expectedMode) {
      setViewMode(expectedMode)
    }
  }, [searchParams]) // searchParams 변경 시 실행
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [datePickerMonth, setDatePickerMonth] = useState<Date>(() => new Date(selectedDate))
  // 오프라인(유인) 운영 시간: 날짜별 시간대별 OFF인 방 번호 배열 저장
  // { '2024-12-30': { '01:00': [1, 2, 3], '01:30': [] } }
  // 빈 배열이면 모든 방이 ON, 특정 방 번호가 포함되어 있으면 해당 방만 OFF
  const [offlineHours, setOfflineHours] = useState<{ [date: string]: { [time: string]: number[] } }>({})
  // 초기 로드된 오프라인 시간 (변경 사항 비교용)
  const [initialOfflineHours, setInitialOfflineHours] = useState<{ [date: string]: { [time: string]: number[] } }>({})
  // 팝오버 상태: 열린 시간대 추적 { '01:00': true, '02:00': false, ... }
  const [openTimePopover, setOpenTimePopover] = useState<{ [time: string]: boolean }>({})
  // 저장 성공 팝업 상태
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  // 매장 총 룸수
  const [totalRooms, setTotalRooms] = useState<number>(0)
  // 상세보기 모달 상태
  const [selectedReservations, setSelectedReservations] = useState<{ time: string; reservations: Reservation[] } | null>(null)
  // 취소 확인 팝업 상태
  const [cancelConfirm, setCancelConfirm] = useState<{ reservationId: string; customerName: string } | null>(null)
  // 내부에서 viewMode를 변경했는지 추적하는 ref
  const isInternalUpdate = useRef(false)

  // 로컬 시간대 기준 날짜 문자열 생성 헬퍼 함수
  const getLocalDateString = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // viewMode 변경 함수
  const handleViewModeChange = (mode: 'timeline' | 'calendar') => {
    isInternalUpdate.current = true
    setViewMode(mode)
    const params = new URLSearchParams(searchParams.toString())
    if (mode === 'calendar') {
      params.set('view', 'calendar')
    } else {
      params.delete('view')
    }
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.replace(newUrl, { scroll: false })
    // 다음 렌더링 사이클에서 플래그 리셋
    setTimeout(() => {
      isInternalUpdate.current = false
    }, 0)
  }

  // 외부 클릭 시 달력 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showDatePicker && !target.closest('.date-picker-container')) {
        setShowDatePicker(false)
      }
      // 팝오버 닫기
      if (!target.closest('.time-popover-container')) {
        setOpenTimePopover({})
      }
    }

    if (showDatePicker || Object.keys(openTimePopover).some(key => openTimePopover[key])) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showDatePicker, openTimePopover])

  useEffect(() => {
    const fetchReservations = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/reservations', {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          // status 필드를 올바른 타입으로 변환
          const formattedData: Reservation[] = data.map((reservation: any) => ({
            ...reservation,
            status: (reservation.status === 'CONFIRMED' || reservation.status === 'PENDING' || reservation.status === 'CANCELLED')
              ? reservation.status
              : ('PENDING' as const),
            // 날짜 형식 확인 및 정규화
            date: reservation.date ? getLocalDateString(reservation.date) : reservation.date,
            // 시간 형식 확인 및 정규화 (HH:MM 형식)
            time: reservation.time ? String(reservation.time).padStart(5, '0').substring(0, 5) : reservation.time,
            // 플레이옵션과 홀수 정보
            playType: reservation.playType || reservation.play_type || null,
            holes: reservation.holes || null,
          }))
          setReservations(formattedData)
        } else {
          console.error('예약 목록을 불러오는데 실패했습니다:', response.status)
          // API 실패 시 임시 데이터 사용
          const tempReservations: Reservation[] = [
          {
            id: '1',
            date: '2024-12-30', // 월요일 (평일)
            time: '06:00',
            customerName: '홍길동',
            phone: '010-1234-5678',
            players: 4,
            status: 'CONFIRMED' as const,
            storeName: '골프장 A',
            amount: 120000,
            roomNumber: 1,
            dayType: 'weekday' as const,
          },
          {
            id: '2',
            date: '2024-12-30', // 월요일 (평일)
            time: '09:00',
            customerName: '김철수',
            phone: '010-2345-6789',
            players: 2,
            status: 'CONFIRMED' as const,
            storeName: '골프장 A',
            amount: 60000,
            roomNumber: 2,
            dayType: 'weekday' as const,
          },
          {
            id: '3',
            date: '2024-12-30', // 월요일 (평일)
            time: '10:30',
            customerName: '이영희',
            phone: '010-3456-7890',
            players: 3,
            status: 'PENDING' as const,
            storeName: '골프장 A',
            amount: 90000,
            roomNumber: 1,
            dayType: 'weekday' as const,
          },
          {
            id: '4',
            date: '2024-12-30', // 월요일 (평일)
            time: '13:00',
            customerName: '박민수',
            phone: '010-4567-8901',
            players: 4,
            status: 'CONFIRMED' as const,
            storeName: '골프장 A',
            amount: 120000,
            roomNumber: 3,
            dayType: 'weekday' as const,
          },
          {
            id: '5',
            date: '2024-12-30', // 월요일 (평일)
            time: '15:30',
            customerName: '최지영',
            phone: '010-5678-9012',
            players: 2,
            status: 'CONFIRMED' as const,
            storeName: '골프장 A',
            amount: 60000,
            roomNumber: 2,
            dayType: 'weekday' as const,
          },
          {
            id: '6',
            date: '2024-12-30', // 월요일 (평일)
            time: '14:00',
            customerName: '장미영',
            phone: '010-1111-2222',
            players: 4,
            status: 'CONFIRMED' as const,
            storeName: '골프장 A',
            amount: 120000,
            roomNumber: 10,
            dayType: 'weekday' as const,
          },
          {
            id: '7',
            date: '2024-12-31', // 화요일 (평일)
            time: '08:00',
            customerName: '정수진',
            phone: '010-6789-0123',
            players: 4,
            status: 'PENDING' as const,
            storeName: '골프장 A',
            amount: 120000,
            roomNumber: 1,
            dayType: 'weekday' as const,
          },
          {
            id: '8',
            date: '2024-12-31', // 화요일 (평일)
            time: '11:00',
            customerName: '강호영',
            phone: '010-7890-1234',
            players: 3,
            status: 'CONFIRMED' as const,
            storeName: '골프장 A',
            amount: 90000,
            roomNumber: 5,
            dayType: 'weekday' as const,
          },
          {
            id: '9',
            date: '2025-01-04', // 토요일 (주말)
            time: '10:00',
            customerName: '주말고객1',
            phone: '010-1111-1111',
            players: 4,
            status: 'CONFIRMED' as const,
            storeName: '골프장 A',
            amount: 150000,
            roomNumber: 1,
            dayType: 'weekend' as const,
          },
          {
            id: '10',
            date: '2025-01-05', // 일요일 (주말)
            time: '14:00',
            customerName: '주말고객2',
            phone: '010-2222-2222',
            players: 2,
            status: 'CONFIRMED' as const,
            storeName: '골프장 A',
            amount: 80000,
            roomNumber: 2,
            dayType: 'weekend' as const,
          },
          ]
          setReservations(tempReservations)
        }
      } catch (error) {
        console.error('예약 목록을 불러오는데 실패했습니다:', error)
        setReservations([])
      } finally {
        setIsLoading(false)
      }
    }

    const fetchOfflineHours = async () => {
      try {
        const response = await fetch(`/api/offline-hours?dayType=${dayTypeFilter}`, {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          setOfflineHours(data.offlineHours || {})
        }
      } catch (error) {
        console.error('오프라인 시간대를 불러오는데 실패했습니다:', error)
      }
    }

    fetchReservations()
  }, [])

  // dayTypeFilter가 변경될 때마다 오프라인 시간대 다시 불러오기
  useEffect(() => {
    const fetchOfflineHours = async () => {
      try {
        const response = await fetch(`/api/offline-hours?dayType=${dayTypeFilter}`, {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          const hours = data.offlineHours || {}
          
          // 기존 형식(날짜별 시간대 배열)을 새 형식(날짜별 시간대별 방 번호 배열)으로 변환
          const convertedHours: { [date: string]: { [time: string]: number[] } } = {}
          
          for (const [date, times] of Object.entries(hours)) {
            if (Array.isArray(times)) {
              // 기존 형식: { '2024-12-30': ['01:00', '01:30'] }
              // 모든 방이 OFF인 것으로 간주 (totalRooms가 있으면 모든 방 번호 추가)
              convertedHours[date] = {}
              times.forEach((time: string) => {
                if (totalRooms > 0) {
                  // 모든 방 번호 추가
                  convertedHours[date][time] = Array.from({ length: totalRooms }, (_, i) => i + 1)
                } else {
                  // totalRooms가 없으면 빈 배열로 설정 (나중에 업데이트됨)
                  convertedHours[date][time] = []
                }
              })
            } else if (typeof times === 'object' && times !== null) {
              // 새 형식: { '2024-12-30': { '01:00': [1, 2], '01:30': [] } }
              convertedHours[date] = times as { [time: string]: number[] }
            }
          }
          
          setOfflineHours(convertedHours)
          setInitialOfflineHours(JSON.parse(JSON.stringify(convertedHours))) // 깊은 복사로 초기 상태 저장
        }
      } catch (error) {
        console.error('오프라인 시간대를 불러오는데 실패했습니다:', error)
      }
    }
    fetchOfflineHours()
  }, [dayTypeFilter, totalRooms])

  // 특정 날짜와 시간에서 특정 방이 오프라인인지 확인
  // roomFilter가 '전체'이면 모든 방이 OFF인지 확인, 개별 방이면 해당 방만 확인
  const isOfflineHour = (date: string, time: string, roomNumber?: number) => {
    const timeData = offlineHours[date]?.[time]
    if (!timeData || !Array.isArray(timeData)) {
      return false
    }
    
    // roomFilter가 '전체'이면 모든 방이 OFF인지 확인
    if (roomFilter === '전체') {
      // totalRooms가 있고, OFF인 방의 개수가 totalRooms와 같으면 모든 방이 OFF
      if (totalRooms > 0) {
        return timeData.length === totalRooms
      }
      // totalRooms가 없으면 기존 로직 (배열에 시간이 있으면 OFF)
      return timeData.length > 0
    }
    
    // 개별 방 선택 시 해당 방만 확인
    const targetRoom = roomNumber || (typeof roomFilter === 'number' ? roomFilter : null)
    if (targetRoom === null) {
      return false
    }
    
    return timeData.includes(targetRoom)
  }

  // 변경 사항이 있는지 확인
  const hasChanges = useMemo(() => {
    const currentStr = JSON.stringify(offlineHours)
    const initialStr = JSON.stringify(initialOfflineHours)
    return currentStr !== initialStr
  }, [offlineHours, initialOfflineHours])

  // 시간대의 30분 단위 상태 확인 (00분 또는 30분 중 하나라도 OFF면 true)
  const isHourPartiallyOffline = (date: string, hour: string) => {
    const [hours] = hour.split(':').map(Number)
    const time00 = `${hours.toString().padStart(2, '0')}:00`
    const time30 = `${hours.toString().padStart(2, '0')}:30`
    return isOfflineHour(date, time00) || isOfflineHour(date, time30)
  }
  
  // 특정 시간대에서 필터링된 예약만 가져오기 (방 필터 적용)
  const getFilteredReservationsForTime = (reservations: Reservation[], time: string) => {
    if (roomFilter === '전체') {
      return reservations
    }
    const targetRoom = typeof roomFilter === 'number' ? roomFilter : null
    if (targetRoom === null) {
      return reservations
    }
    return reservations.filter((r) => r.roomNumber === targetRoom)
  }

  // 왼쪽 컬럼 시간대 (00:00 ~ 12:00) - 모든 시간대를 30분 단위로 표시
  // 왼쪽 컬럼 시간대 (00:00 ~ 11:30) - 12시간을 30분 단위로 표시
  const leftTimeSlots = useMemo(() => {
    const slots: string[] = []
    
    for (let hour = 0; hour <= 11; hour++) {
      const time00 = `${hour.toString().padStart(2, '0')}:00`
      const time30 = `${hour.toString().padStart(2, '0')}:30`
      slots.push(time00)
      slots.push(time30)
    }
    return slots
  }, [selectedDate, offlineHours])

  // 오른쪽 컬럼 시간대 (12:00 ~ 23:30) - 12시간을 30분 단위로 표시
  const rightTimeSlots = useMemo(() => {
    const slots: string[] = []
    
    for (let hour = 12; hour <= 23; hour++) {
      const time00 = `${hour.toString().padStart(2, '0')}:00`
      const time30 = `${hour.toString().padStart(2, '0')}:30`
      slots.push(time00)
      slots.push(time30)
    }
    return slots
  }, [selectedDate, offlineHours])

  // 매장 정보 가져오기 (총 룸수)
  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const response = await fetch('/api/store', {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          setTotalRooms(data.totalRooms || 0)
        }
      } catch (error) {
        console.error('매장 정보를 불러오는데 실패했습니다:', error)
      }
    }
    fetchStoreInfo()
  }, [])

  // 사용 가능한 방 목록 추출 (총 룸수 기반)
  const availableRooms = useMemo(() => {
    if (totalRooms > 0) {
      // 총 룸수에 따라 1번방부터 총 룸수까지 생성
      return Array.from({ length: totalRooms }, (_, i) => i + 1)
    }
    // 총 룸수가 없으면 예약에 있는 방 번호만 표시 (기존 로직)
    const rooms = new Set<number>()
    reservations.forEach((reservation) => {
      rooms.add(reservation.roomNumber)
    })
    return Array.from(rooms).sort((a, b) => a - b)
  }, [totalRooms, reservations])

  // 날짜가 평일인지 주말인지 판단하는 함수
  const getDayType = (dateString: string): 'weekday' | 'weekend' => {
    const date = new Date(dateString)
    const day = date.getDay() // 0 = 일요일, 6 = 토요일
    return (day === 0 || day === 6) ? 'weekend' : 'weekday'
  }

  // 필터링 (검색, 상태, 방 필터, 평일/주말 필터)
  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const matchesSearch =
        reservation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.phone.includes(searchTerm) ||
        reservation.storeName.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRoom = roomFilter === '전체' || reservation.roomNumber === roomFilter
      
      // 평일/주말 필터링
      const reservationDayType = reservation.dayType || getDayType(reservation.date)
      const matchesDayType = reservationDayType === dayTypeFilter
      
      return matchesSearch && matchesRoom && matchesDayType
    })
  }, [reservations, searchTerm, roomFilter, dayTypeFilter])

  // 타임라인 뷰용: 선택한 날짜의 예약만 필터링
  const timelineReservations = useMemo(() => {
    return filteredReservations.filter((reservation) => reservation.date === selectedDate)
  }, [filteredReservations, selectedDate])

  // 달력 뷰용: 날짜별로 예약 그룹화
  const reservationsByDate = useMemo(() => {
    const grouped: { [key: string]: Reservation[] } = {}
    filteredReservations.forEach((reservation) => {
      if (!grouped[reservation.date]) {
        grouped[reservation.date] = []
      }
      grouped[reservation.date].push(reservation)
    })
    return grouped
  }, [filteredReservations])

  // 시간대별로 예약 그룹화 (타임라인 뷰용)
  const reservationsByTime = useMemo(() => {
    const grouped: { [key: string]: Reservation[] } = {}
    const allTimeSlots = [...leftTimeSlots, ...rightTimeSlots]
    allTimeSlots.forEach((time) => {
      grouped[time] = timelineReservations.filter((r) => r.time === time)
    })
    return grouped
  }, [timelineReservations, leftTimeSlots, rightTimeSlots])

  // 달력 생성 함수
  const generateCalendar = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    // 해당 월의 첫 번째 날과 마지막 날
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    // 첫 번째 날의 요일 (0 = 일요일)
    const startDay = firstDay.getDay()
    
    // 달력 배열 생성
    const days: (Date | null)[] = []
    
    // 이전 달의 마지막 날들 (빈 칸 채우기)
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i))
    }
    
    // 현재 달의 날들
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day))
    }
    
    // 다음 달의 첫 날들 (42칸 채우기)
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(year, month + 1, day))
    }
    
    return days
  }, [currentMonth])

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = weekdays[date.getDay()]
    return `${month}월 ${day}일 (${weekday})`
  }

  // 날짜 변경
  const changeDate = (days: number) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + days)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    setSelectedDate(`${year}-${month}-${day}`)
  }

  // 달력 월 변경
  const changeMonth = (months: number) => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + months)
    setCurrentMonth(newMonth)
  }

  // 날짜 포맷 (YYYY-MM-DD) - 로컬 시간대 사용
  const formatDateString = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 날짜가 현재 달인지 확인
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth() && 
           date.getFullYear() === currentMonth.getFullYear()
  }

  // 날짜가 오늘인지 확인
  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // 날짜 선택 달력 생성
  const generateDatePickerCalendar = useMemo(() => {
    const year = datePickerMonth.getFullYear()
    const month = datePickerMonth.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDay = firstDay.getDay()
    
    const days: (Date | null)[] = []
    
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i))
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day))
    }
    
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(year, month + 1, day))
    }
    
    return days
  }, [datePickerMonth])

  // 날짜 선택 달력의 날짜가 현재 달인지 확인
  const isDatePickerCurrentMonth = (date: Date) => {
    return date.getMonth() === datePickerMonth.getMonth() && 
           date.getFullYear() === datePickerMonth.getFullYear()
  }

  // 날짜 선택
  const handleDateSelect = (date: Date) => {
    setSelectedDate(formatDateString(date))
    setShowDatePicker(false)
  }

  // 날짜 선택 달력 월 변경
  const changeDatePickerMonth = (months: number) => {
    const year = datePickerMonth.getFullYear()
    const month = datePickerMonth.getMonth()
    // 월의 첫 번째 날을 기준으로 월을 변경하여 날짜 오버플로우 문제 방지
    const newMonth = new Date(year, month + months, 1)
    setDatePickerMonth(newMonth)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <FiCheckCircle className="w-5 h-5 text-green-600" />
      case 'PENDING':
        return <FiAlertCircle className="w-5 h-5 text-yellow-600" />
      case 'CANCELLED':
        return <FiXCircle className="w-5 h-5 text-red-600" />
      default:
        return null
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch('/api/reservations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id, status: newStatus }),
      })

      if (response.ok) {
        // 취소된 예약은 목록에서 제거
        if (newStatus === 'CANCELLED') {
          setReservations((prev) => prev.filter((reservation) => reservation.id !== id))
          // 상세보기 모달이 열려있고 해당 예약이 포함되어 있으면 모달도 업데이트
          if (selectedReservations) {
            const updatedReservations = selectedReservations.reservations.filter((r) => r.id !== id)
            if (updatedReservations.length === 0) {
              setSelectedReservations(null)
            } else {
              setSelectedReservations({
                ...selectedReservations,
                reservations: updatedReservations,
              })
            }
          }
        } else {
          // 다른 상태 변경은 기존 로직 유지
          setReservations((prev) =>
            prev.map((reservation) =>
              reservation.id === id ? { ...reservation, status: newStatus as any } : reservation
            )
          )
        }
      } else {
        const data = await response.json()
        alert(data.message || '예약 상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('예약 상태 변경 실패:', error)
      alert('예약 상태 변경 중 오류가 발생했습니다.')
    }
  }

  // 오프라인 운영 시간 토글 함수 (30분 단위) - 저장하지 않고 상태만 변경
  const toggleOfflineHour = (date: string, time: string) => {
    setOfflineHours((prev) => {
      const dateData = prev[date] || {}
      const timeData = dateData[time] || []
      
      // roomFilter가 '전체'이면 모든 방에 대해 처리
      if (roomFilter === '전체') {
        if (totalRooms > 0) {
          const allRooms = Array.from({ length: totalRooms }, (_, i) => i + 1)
          const isAllOff = timeData.length === totalRooms
          
          return {
            ...prev,
            [date]: {
              ...dateData,
              [time]: isAllOff ? [] : allRooms, // 모든 방이 OFF면 ON으로, 아니면 모든 방을 OFF로
            },
          }
        }
        // totalRooms가 없으면 기존 로직 (시간대만 추가/제거)
        const isOffline = timeData.length > 0
        return {
          ...prev,
          [date]: {
            ...dateData,
            [time]: isOffline ? [] : [1], // 임시로 1번 방만 표시
          },
        }
      }
      
      // 개별 방 선택 시 해당 방만 처리
      const targetRoom = typeof roomFilter === 'number' ? roomFilter : null
      if (targetRoom === null) {
        return prev
      }
      
      const isRoomOff = timeData.includes(targetRoom)
      
      return {
        ...prev,
        [date]: {
          ...dateData,
          [time]: isRoomOff
            ? timeData.filter((room) => room !== targetRoom) // 해당 방을 OFF에서 제거 (ON으로)
            : [...timeData, targetRoom], // 해당 방을 OFF에 추가
        },
      }
    })
  }

  // 시간대 팝오버 토글
  const toggleTimePopover = (time: string) => {
    setOpenTimePopover((prev) => ({
      ...prev,
      [time]: !prev[time],
    }))
  }

  // 시간대의 30분 단위 상태 확인 (00분, 30분 모두 OFF면 true)
  const isHourFullyOffline = (date: string, hour: string) => {
    const [hours] = hour.split(':').map(Number)
    const time00 = `${hours.toString().padStart(2, '0')}:00`
    const time30 = `${hours.toString().padStart(2, '0')}:30`
    return isOfflineHour(date, time00) && isOfflineHour(date, time30)
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-5">예약관리</h1>

          {/* 통계 카드 */}
          {!isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
              {/* 예약건수 */}
              <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-blue-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-blue-600/90 uppercase tracking-wide mb-0.5">예약건수</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {viewMode === 'timeline' 
                        ? timelineReservations.length 
                        : filteredReservations.length}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <FiCalendar className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* 확정건수 */}
              <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-green-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-green-600/90 uppercase tracking-wide mb-0.5">확정건수</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {(viewMode === 'timeline' ? timelineReservations : filteredReservations)
                        .filter((r) => r.status === 'CONFIRMED').length}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <FiCheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              </div>

              {/* 취소 */}
              <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-red-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-red-600/90 uppercase tracking-wide mb-0.5">취소</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {(viewMode === 'timeline' ? timelineReservations : filteredReservations)
                        .filter((r) => r.status === 'CANCELLED').length}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <FiXCircle className="w-5 h-5 text-red-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 필터/컨트롤 바 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* 뷰 모드 전환 */}
              <div className="flex items-center rounded-xl bg-gray-100/80 p-1">
                <button
                  onClick={() => handleViewModeChange('timeline')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'timeline'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <FiList className="w-4 h-4" />
                    타임라인
                  </span>
                </button>
                <button
                  onClick={() => handleViewModeChange('calendar')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'calendar'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <FiGrid className="w-4 h-4" />
                    달력
                  </span>
                </button>
              </div>

              {/* 검색 */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition placeholder:text-gray-400"
                />
              </div>

              {/* 방 표시 (전체 방만 사용, 세부 방 목록 미표시) */}
              <div className="relative flex items-center">
                <FiHome className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
                <div className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 min-w-[120px] text-gray-700">
                  전체 방
                </div>
              </div>

              {/* 날짜 선택 (타임라인 뷰일 때만 표시) */}
              {viewMode === 'timeline' && (
                <div className="flex items-center gap-2 ml-auto relative">
                  {/* 평일/주말 필터 */}
                  <div className="flex items-center rounded-xl bg-gray-100/80 p-1">
                    <button
                      onClick={() => setDayTypeFilter('weekday')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        dayTypeFilter === 'weekday'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      평일
                    </button>
                    <button
                      onClick={() => setDayTypeFilter('weekend')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        dayTypeFilter === 'weekend'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      주말
                    </button>
                  </div>

                  <button
                    onClick={() => changeDate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <FiChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="relative date-picker-container">
                    <button
                      onClick={() => {
                        setDatePickerMonth(new Date(selectedDate))
                        setShowDatePicker(!showDatePicker)
                      }}
                      className="text-sm font-medium text-gray-700 whitespace-nowrap cursor-pointer hover:text-blue-600 transition-colors px-3 py-2 rounded-xl hover:bg-blue-50 flex items-center gap-2"
                    >
                      <FiCalendar className="w-5 h-5" />
                      {formatDate(selectedDate)}
                    </button>
                    
                    {/* 날짜 선택 달력 */}
                    {showDatePicker && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-xl shadow-xl border-2 border-gray-300/80 p-4 z-50 min-w-[320px]">
                        {/* 달력 헤더 */}
                        <div className="flex items-center justify-between mb-4">
                          <button
                            onClick={() => changeDatePickerMonth(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <FiChevronLeft className="w-4 h-4 text-gray-600" />
                          </button>
                          <span className="text-sm font-semibold text-gray-800">
                            {datePickerMonth.getFullYear()}년 {datePickerMonth.getMonth() + 1}월
                          </span>
                          <button
                            onClick={() => changeDatePickerMonth(1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <FiChevronRight className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>

                        {/* 요일 헤더 */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                            <div
                              key={day}
                              className={`text-center text-xs font-semibold py-2 ${
                                index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-600'
                              }`}
                            >
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* 달력 그리드 */}
                        <div className="grid grid-cols-7 gap-1">
                          {generateDatePickerCalendar.map((date, index) => {
                            if (!date) return <div key={index} className="aspect-square"></div>
                            
                            const dateString = formatDateString(date)
                            const isCurrentMonthDay = isDatePickerCurrentMonth(date)
                            const isTodayDay = isToday(date)
                            const isSelected = dateString === selectedDate

                            return (
                              <button
                                key={dateString}
                                onClick={() => handleDateSelect(date)}
                                className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                                  !isCurrentMonthDay
                                    ? 'text-gray-300'
                                    : isSelected
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : isTodayDay
                                    ? 'bg-blue-100 text-blue-700 font-bold'
                                    : date.getDay() === 0
                                    ? 'text-red-600 hover:bg-red-50'
                                    : date.getDay() === 6
                                    ? 'text-blue-600 hover:bg-blue-50'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {date.getDate()}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => changeDate(1)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <FiChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              )}

              {/* 달력 월 선택 (달력 뷰일 때만 표시) */}
              {viewMode === 'calendar' && (
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                    {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                  </span>
                  <button
                    onClick={() => changeMonth(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}

              {/* 저장하기 (타임라인일 때만) */}
              {viewMode === 'timeline' && (
                <button
                onClick={async () => {
                  try {
                    setSaveError(null)
                    const response = await fetch('/api/offline-hours', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      credentials: 'include',
                      body: JSON.stringify({
                        offlineHours: offlineHours,
                        dayType: dayTypeFilter, // 평일/주말 구분 추가
                      }),
                    })
                    if (response.ok) {
                      // 저장 성공 시 초기 상태 업데이트
                      setInitialOfflineHours(JSON.parse(JSON.stringify(offlineHours)))
                      setShowSaveSuccess(true)
                      // 2초 후 자동으로 팝업 닫기
                      setTimeout(() => {
                        setShowSaveSuccess(false)
                      }, 2000)
                    } else {
                      const errorData = await response.json()
                      setSaveError(errorData.error || '저장에 실패했습니다.')
                      setTimeout(() => {
                        setSaveError(null)
                      }, 3000)
                    }
                  } catch (error) {
                    console.error('저장 실패:', error)
                    setSaveError('저장 중 오류가 발생했습니다.')
                    setTimeout(() => {
                      setSaveError(null)
                    }, 3000)
                  }
                }}
                disabled={!hasChanges}
                className={`ml-auto px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  hasChanges
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                저장하기
              </button>
              )}
            </div>
          </div>

          {/* 저장 성공/실패 팝업 */}
          {showSaveSuccess && (
            <div className="fixed top-20 right-4 z-50 transform transition-all duration-300 ease-out">
              <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 min-w-[200px]">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold">저장되었습니다.</span>
              </div>
            </div>
          )}

          {saveError && (
            <div className="fixed top-20 right-4 z-50 transform transition-all duration-300 ease-out">
              <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 min-w-[200px]">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-semibold">{saveError}</span>
              </div>
            </div>
          )}

          {/* 스케줄표 */}
          {isLoading ? (
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300/80 p-12 text-center">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : viewMode === 'timeline' ? (
            /* 타임라인 뷰 - 두 컬럼 형식 */
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300/80 overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  {/* 헤더 */}
                  <div className="grid grid-cols-2 border-b-2 border-gray-300">
                    {/* 왼쪽 컬럼 헤더 */}
                    <div className="grid grid-cols-[120px_1fr] border-r-2 border-gray-300">
                      <div className="px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 border-r border-blue-400 text-center">
                        시간
                      </div>
                      <div className="px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-slate-600 to-slate-500">
                        예약 내역 {roomFilter !== '전체' && `(${roomFilter}번방)`}
                      </div>
                    </div>
                    {/* 오른쪽 컬럼 헤더 */}
                    <div className="grid grid-cols-[120px_1fr]">
                      <div className="px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 border-r border-blue-400 text-center">
                        시간
                      </div>
                      <div className="px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-slate-600 to-slate-500">
                        예약 내역 {roomFilter !== '전체' && `(${roomFilter}번방)`}
                      </div>
                    </div>
                  </div>

                  {/* 시간대별 스케줄 - 두 컬럼 */}
                  <div>
                    {leftTimeSlots.map((leftTime, index) => {
                      const rightTime = rightTimeSlots[index] || null
                      const allLeftReservations = reservationsByTime[leftTime] || []
                      const allRightReservations = rightTime ? (reservationsByTime[rightTime] || []) : []
                      
                      // 방 필터 적용
                      const leftReservations = getFilteredReservationsForTime(allLeftReservations, leftTime)
                      const rightReservations = rightTime ? getFilteredReservationsForTime(allRightReservations, rightTime) : []
                      
                      const isLeftPast = (() => {
                        const [hours, minutes] = leftTime.split(':').map(Number)
                        const now = new Date()
                        const slotTime = new Date(selectedDate)
                        slotTime.setHours(hours, minutes, 0, 0)
                        return slotTime < now && selectedDate === getLocalDateString(new Date())
                      })()
                      
                      const isRightPast = rightTime ? (() => {
                        const [hours, minutes] = rightTime.split(':').map(Number)
                        const now = new Date()
                        const slotTime = new Date(selectedDate)
                        slotTime.setHours(hours, minutes, 0, 0)
                        return slotTime < now && selectedDate === getLocalDateString(new Date())
                      })() : false

                      const isLastRow = index === leftTimeSlots.length - 1

                      return (
                        <div key={`${leftTime}-${rightTime || 'empty'}`} className={`grid grid-cols-2 border-b border-gray-300 ${isLastRow ? '' : ''}`}>
                          {/* 왼쪽 컬럼 */}
                          <div className="grid grid-cols-[120px_1fr] border-r-2 border-gray-300 bg-white">
                            {/* 시간 */}
                            <div className="relative">
                              <div 
                                className="h-[100px] px-4 py-3 border-r-2 border-gray-300 flex items-center justify-center transition-all duration-200 cursor-pointer hover:bg-gray-50"
                                onClick={() => toggleOfflineHour(selectedDate, leftTime)}
                              >
                                {(() => {
                                  // 모든 시간대는 직접 상태 확인 (00분 또는 30분)
                                  const isOffline = isOfflineHour(selectedDate, leftTime)
                                  const badgeText = isOffline ? 'OFF' : 'ON'
                                  const badgeColor = isOffline 
                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                  
                                  return (
                                    <div className="flex flex-col items-center justify-center gap-1.5 w-full">
                                      <span className="text-sm font-bold text-gray-800 transition-all">
                                        {leftTime}
                                      </span>
                                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold shadow-sm whitespace-nowrap ${badgeColor}`}>
                                        {badgeText}
                                      </span>
                                    </div>
                                  )
                                })()}
                              </div>
                            </div>

                            {/* 예약 카드들 */}
                            <div 
                              className={`h-[100px] px-2 py-2 flex items-center justify-center relative overflow-y-auto ${
                                isOfflineHour(selectedDate, leftTime) ? 'pointer-events-none bg-gray-50 opacity-60' : ''
                              }`}
                              style={(() => {
                                // 모든 시간대는 직접 상태 확인
                                const isOffline = isOfflineHour(selectedDate, leftTime)
                                return isOffline ? {
                                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(239, 68, 68, 0.2) 6px, rgba(239, 68, 68, 0.2) 12px)',
                                } : {}
                              })()}
                            >
                              {(() => {
                                const isLeftOffline = isOfflineHour(selectedDate, leftTime)
                                
                                if (isLeftOffline) {
                                  return (
                                    <span className="text-sm text-gray-400 font-medium">예약 없음</span>
                                  )
                                }
                                
                                return leftReservations.length === 0 ? (
                                <span className="text-sm text-gray-400 font-medium">예약 없음</span>
                              ) : (
                                // 모든 예약을 요약 카드로 표시 (1건이어도 "1건 예약"으로 표시)
                                <div className="w-full">
                                  <div
                                    onClick={() => !isLeftOffline && setSelectedReservations({ time: leftTime, reservations: leftReservations })}
                                    className={`w-full p-1.5 rounded-lg border-2 shadow-sm transition-all cursor-pointer ${
                                      isLeftOffline
                                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                        : 'border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-md hover:border-blue-300'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-1.5">
                                        <FiUser className="w-4 h-4 text-red-500 flex-shrink-0" />
                                        <span className="font-bold text-gray-900 text-base">
                                          {leftReservations.length}건 예약
                                        </span>
                                      </div>
                                      <FiSearch className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    </div>
                                  </div>
                                </div>
                              )
                              })()}
                            </div>
                          </div>

                          {/* 오른쪽 컬럼 */}
                          {rightTime && (
                            <div className="grid grid-cols-[120px_1fr] bg-white">
                              {/* 시간 */}
                              <div className="relative">
                                <div 
                                  className="h-[100px] px-4 py-3 border-r-2 border-gray-300 flex items-center justify-center transition-all duration-200 cursor-pointer hover:bg-gray-50"
                                  onClick={() => toggleOfflineHour(selectedDate, rightTime)}
                                >
                                  {(() => {
                                    // 모든 시간대는 직접 상태 확인 (00분 또는 30분)
                                    const isOffline = isOfflineHour(selectedDate, rightTime)
                                    const badgeText = isOffline ? 'OFF' : 'ON'
                                    const badgeColor = isOffline 
                                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                    
                                    return (
                                      <div className="flex flex-col items-center justify-center gap-1.5 w-full">
                                        <span className="text-sm font-bold text-gray-800 transition-all">
                                          {rightTime}
                                        </span>
                                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold shadow-sm whitespace-nowrap ${badgeColor}`}>
                                          {badgeText}
                                        </span>
                                      </div>
                                    )
                                  })()}
                                </div>
                              </div>

                              {/* 예약 카드들 */}
                              <div 
                                className={`h-[100px] px-2 py-2 flex items-center justify-center relative overflow-y-auto ${
                                  isOfflineHour(selectedDate, rightTime) ? 'pointer-events-none bg-gray-50 opacity-60' : ''
                                }`}
                                style={(() => {
                                  // 모든 시간대는 직접 상태 확인
                                  const isOffline = isOfflineHour(selectedDate, rightTime)
                                  return isOffline ? {
                                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(239, 68, 68, 0.2) 6px, rgba(239, 68, 68, 0.2) 12px)',
                                  } : {}
                                })()}
                              >
                                {(() => {
                                  const isRightOffline = isOfflineHour(selectedDate, rightTime)
                                  
                                  if (isRightOffline) {
                                    return (
                                      <span className="text-sm text-gray-400 font-medium">예약 없음</span>
                                    )
                                  }
                                  
                                  return rightReservations.length === 0 ? (
                                  <span className="text-sm text-gray-400 font-medium">예약 없음</span>
                                ) : (
                                  // 모든 예약을 요약 카드로 표시 (1건이어도 "1건 예약"으로 표시)
                                  <div className="w-full">
                                    <div
                                      onClick={() => !isRightOffline && setSelectedReservations({ time: rightTime, reservations: rightReservations })}
                                      className={`w-full p-1.5 rounded-lg border-2 shadow-sm transition-all cursor-pointer ${
                                        isRightOffline
                                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                          : 'border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-md hover:border-blue-300'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-1.5">
                                          <FiUser className="w-4 h-4 text-red-500 flex-shrink-0" />
                                          <span className="font-bold text-gray-900 text-base">
                                            {rightReservations.length}건 예약
                                          </span>
                                        </div>
                                        <FiSearch className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                      </div>
                                    </div>
                                  </div>
                                )
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 달력 뷰 */
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300/80 overflow-hidden">
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                  <div
                    key={day}
                    className={`px-4 py-3 text-center text-sm font-semibold ${
                      index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 달력 그리드 */}
              <div className="grid grid-cols-7 divide-x divide-y divide-gray-200">
                {generateCalendar.map((date, index) => {
                  if (!date) return <div key={index} className="min-h-[120px]"></div>
                  
                  const dateString = formatDateString(date)
                  const dayReservations = reservationsByDate[dateString] || []
                  const isCurrentMonthDay = isCurrentMonth(date)
                  const isTodayDay = isToday(date)
                  const confirmedCount = dayReservations.filter((r) => r.status === 'CONFIRMED').length
                  const pendingCount = dayReservations.filter((r) => r.status === 'PENDING').length
                  const cancelledCount = dayReservations.filter((r) => r.status === 'CANCELLED').length

                  return (
                    <div
                      key={dateString}
                      className={`min-h-[120px] p-2 relative ${
                        !isCurrentMonthDay ? 'bg-gray-50' : 'bg-white'
                      }`}
                      style={isTodayDay ? { 
                        boxShadow: 'inset 0 0 0 2px rgb(59 130 246)',
                        zIndex: 10
                      } : undefined}
                    >
                      <div
                        className={`text-sm font-medium mb-2 ${
                          !isCurrentMonthDay
                            ? 'text-gray-400'
                            : isTodayDay
                            ? 'text-blue-600 font-bold'
                            : date.getDay() === 0
                            ? 'text-red-600'
                            : date.getDay() === 6
                            ? 'text-blue-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {date.getDate()}
                      </div>
                      {dayReservations.length > 0 && (
                        <div 
                          className="mt-2 cursor-pointer hover:opacity-80"
                          onClick={() => {
                            setSelectedReservations({ 
                              time: formatDate(dateString), 
                              reservations: dayReservations 
                            })
                          }}
                        >
                          <div className="text-center mb-2">
                            <span className="text-lg font-bold text-gray-900">
                              {dayReservations.length}건
                            </span>
                          </div>
                          <div className="flex flex-col items-center space-y-1 text-xs">
                            {confirmedCount > 0 && (
                              <span className="text-green-600 font-medium">확정 {confirmedCount}</span>
                            )}
                            {pendingCount > 0 && (
                              <span className="text-yellow-600 font-medium">대기 {pendingCount}</span>
                            )}
                            {cancelledCount > 0 && (
                              <span className="text-red-600 font-medium">취소 {cancelledCount}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 상세보기 모달 */}
      {selectedReservations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReservations(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-800">예약 상세보기</h2>
                <p className="text-gray-500 text-sm mt-1">{selectedReservations.time} - 총 {selectedReservations.reservations.length}건</p>
              </div>
              <button
                onClick={() => setSelectedReservations(null)}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
              >
                <FiX className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="overflow-y-auto flex-1 bg-white p-6">
              <div className="space-y-4">
                {selectedReservations.reservations.map((reservation, index) => (
                  <div
                    key={reservation.id}
                    className="bg-blue-50 border border-blue-200 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FiUser className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {reservation.customerName || '예약자 정보 없음'}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {reservation.phone || '연락처 없음'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {(() => {
                          // 예약시간과 현재시간 비교
                          const reservationDateTime = new Date(reservation.date)
                          const [hours, minutes] = reservation.time.split(':').map(Number)
                          reservationDateTime.setHours(hours, minutes || 0, 0, 0)
                          const now = new Date()
                          const isPastTime = reservationDateTime < now
                          
                          // 예약시간이 지났으면 확정 태그만, 지나기 전이면 대기 태그 + 강제취소 버튼
                          if (isPastTime) {
                            return (
                              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                확정
                              </span>
                            )
                          } else {
                            return (
                              <>
                                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                                  대기
                                </span>
                                {reservation.status !== 'CANCELLED' && (
                                  <button
                                    onClick={() => {
                                      setCancelConfirm({ reservationId: reservation.id, customerName: reservation.customerName })
                                    }}
                                    className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                                  >
                                    강제취소
                                  </button>
                                )}
                              </>
                            )
                          }
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                          <FiUsers className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">인원</p>
                          <p className="font-semibold text-gray-800">{reservation.players}명</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                          <FiCalendar className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">예약 날짜</p>
                          <p className="font-semibold text-gray-800">
                            {new Date(reservation.date).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              weekday: 'short'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                          <FiClock className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">예약 시간</p>
                          <p className="font-semibold text-gray-800">{reservation.time}</p>
                        </div>
                      </div>

                      {reservation.playType && (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                            <FiFilter className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">플레이 옵션</p>
                            <p className="font-semibold text-gray-800">{reservation.playType}</p>
                          </div>
                        </div>
                      )}

                      {reservation.holes && (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                            <FiCalendar className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">홀수</p>
                            <p className="font-semibold text-gray-800">
                              {reservation.holes.toString().replace(/홀$/, '')}홀
                            </p>
                          </div>
                        </div>
                      )}

                      {reservation.amount != null && reservation.amount !== undefined && reservation.amount !== 0 && Number(reservation.amount) > 0 && (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-600">₩</span>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">금액</p>
                            <p className="font-semibold text-gray-800">{Number(reservation.amount).toLocaleString()}원</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedReservations(null)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 강제 취소 확인 팝업 */}
      {cancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" onClick={() => setCancelConfirm(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">강제 취소 확인</h3>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">{cancelConfirm.customerName}</span>님의 예약을 강제 취소하시겠습니까?
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setCancelConfirm(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  await handleStatusChange(cancelConfirm.reservationId, 'CANCELLED')
                  setCancelConfirm(null)
                  // 상세보기 모달이 열려있으면 닫기
                  if (selectedReservations) {
                    setSelectedReservations(null)
                  }
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-sm"
              >
                강제 취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReservationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300/80 p-12 text-center">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        </main>
      </div>
    }>
      <ReservationsContent />
    </Suspense>
  )
}




