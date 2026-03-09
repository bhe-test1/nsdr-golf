'use client'

import { useState, useEffect } from 'react'
import { FiX, FiChevronLeft, FiUser } from 'react-icons/fi'
import type { Store } from '@/lib/types'
import PaymentModal from './PaymentModal'

interface ReservationModalProps {
  store: Store
  selectedDate: Date
  selectedTime: string | null
  selectedRoom: string | null
  onClose: () => void
  onComplete?: () => void
}

export default function ReservationModal({
  store,
  selectedDate,
  selectedTime,
  selectedRoom,
  onClose,
  onComplete
}: ReservationModalProps) {
  const [reservatorName, setReservatorName] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [selectedReservationDate, setSelectedReservationDate] = useState(selectedDate)
  const [selectedReservationTime, setSelectedReservationTime] = useState(selectedTime || '')
  const [playType, setPlayType] = useState<string>('')
  const [holes, setHoles] = useState<string>('')
  const [gameCount, setGameCount] = useState<'1게임' | '2게임'>('1게임')
  const [players, setPlayers] = useState(2)
  
  // 가격 정보에서 사용 가능한 플레이 옵션과 홀 수 추출
  const [availablePlayTypes, setAvailablePlayTypes] = useState<string[]>([])
  const [availableHoles, setAvailableHoles] = useState<{ [playType: string]: string[] }>({})
  // 룸 이름 정규화 (공백 제거)
  const normalizeRoomName = (room: string) => {
    return room.replace(/\s/g, '') // 모든 공백 제거
  }

  // 초기 선택된 룸을 정규화하여 설정
  const [selectedReservationRoom, setSelectedReservationRoom] = useState(
    selectedRoom ? normalizeRoomName(selectedRoom) : ''
  )
  const [price, setPrice] = useState(0)
  const [gamePrices, setGamePrices] = useState<{ weekday: any[]; weekend: any[] }>({ weekday: [], weekend: [] })
  const [golfPrices, setGolfPrices] = useState<Array<{ id: string; name: string; price: number | string }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // pos_admin에서 활성화된 예약 시간 (availability API 기반)
  const [availabilityTimeSlots, setAvailabilityTimeSlots] = useState<{ morning: string[]; afternoon: string[] }>({ morning: [], afternoon: [] })
  const [availabilityLoading, setAvailabilityLoading] = useState(false)

  // 전화번호 포맷팅
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  // 가격 정보 가져오기 및 사용 가능한 옵션 추출
  useEffect(() => {
    const fetchPriceInfo = async () => {
      try {
        const response = await fetch(`/api/stores/${store.id}/price`)
        if (response.ok) {
          const data = await response.json()
          const prices = data.gamePrices || { weekday: [], weekend: [] }
          const golfPricesData = data.golfPrices || []
          setGamePrices(prices)
          setGolfPrices(golfPricesData)
          
          // 연습장인 경우 gamePrices에서 이용권 옵션 추출 (1개월권, 3개월권 등)
          if (store.type === '골프연습장') {
            const allPrices = [...prices.weekday, ...prices.weekend]
            const playTypesSet = new Set<string>()
            const holesMap: { [playType: string]: Set<string> } = {}
            
            allPrices.forEach((priceItem: any) => {
              // 이용권 확인
              if (priceItem.month1 || priceItem.month3 || priceItem.month6 || priceItem.month12 || priceItem.day1) {
                playTypesSet.add('이용권')
                if (!holesMap['이용권']) {
                  holesMap['이용권'] = new Set<string>()
                }
                if (priceItem.month1) holesMap['이용권'].add('1개월권')
                if (priceItem.month3) holesMap['이용권'].add('3개월권')
                if (priceItem.month6) holesMap['이용권'].add('6개월권')
                if (priceItem.month12) holesMap['이용권'].add('12개월권')
                if (priceItem.day1) holesMap['이용권'].add('1일권')
              }
            })
            
            const playTypesArray = Array.from(playTypesSet)
            const holesObject: { [playType: string]: string[] } = {}
            Object.keys(holesMap).forEach(key => {
              holesObject[key] = Array.from(holesMap[key])
            })
            
            setAvailablePlayTypes(playTypesArray)
            setAvailableHoles(holesObject)
            
            if (playTypesArray.length > 0 && !playType) {
              setPlayType(playTypesArray[0])
              if (holesObject[playTypesArray[0]] && holesObject[playTypesArray[0]].length > 0) {
                setHoles(holesObject[playTypesArray[0]][0])
              }
            }
          } else {
            // 스크린골프/파크골프인 경우 gamePrices에서 옵션 추출
            // 모든 가격 항목을 확인하여 사용 가능한 옵션 추출
            const allPrices = [...prices.weekday, ...prices.weekend]
            const playTypesSet = new Set<string>()
            const holesMap: { [playType: string]: Set<string> } = {}
            
            allPrices.forEach((priceItem: any) => {
              // 스트로크 확인
              if (priceItem.stroke18 || priceItem.stroke9 || priceItem.hole18 || priceItem.hole9) {
                playTypesSet.add('스트로크')
                if (!holesMap['스트로크']) {
                  holesMap['스트로크'] = new Set<string>()
                }
                if (priceItem.stroke18 || priceItem.hole18) {
                  holesMap['스트로크'].add('18홀')
                }
                if (priceItem.stroke9 || priceItem.hole9) {
                  holesMap['스트로크'].add('9홀')
                }
              }
              
              // 포썸 확인
              if (priceItem.pome18 || priceItem.pome9) {
                playTypesSet.add('포썸')
                if (!holesMap['포썸']) {
                  holesMap['포썸'] = new Set<string>()
                }
                if (priceItem.pome18) {
                  holesMap['포썸'].add('18홀')
                }
                if (priceItem.pome9) {
                  holesMap['포썸'].add('9홀')
                }
              }
              
              // 연습장 확인
              if (priceItem.practice || priceItem.practice60 || priceItem.practice30) {
                playTypesSet.add('연습장')
                if (!holesMap['연습장']) {
                  holesMap['연습장'] = new Set<string>()
                }
                if (priceItem.practice) {
                  holesMap['연습장'].add('연습장')
                }
                if (priceItem.practice60) {
                  holesMap['연습장'].add('60분')
                }
                if (priceItem.practice30) {
                  holesMap['연습장'].add('30분')
                }
              }
            })
            
            const playTypesArray = Array.from(playTypesSet)
            const holesObject: { [playType: string]: string[] } = {}
            Object.keys(holesMap).forEach(key => {
              holesObject[key] = Array.from(holesMap[key])
            })
            
            setAvailablePlayTypes(playTypesArray)
            setAvailableHoles(holesObject)
            
            // 첫 번째 플레이 타입과 첫 번째 홀 수를 기본값으로 설정
            if (playTypesArray.length > 0 && !playType) {
              setPlayType(playTypesArray[0])
              if (holesObject[playTypesArray[0]] && holesObject[playTypesArray[0]].length > 0) {
                setHoles(holesObject[playTypesArray[0]][0])
              }
            }
          }
        } else {
          console.error('가격 정보 조회 실패:', response.status)
          setGamePrices({ weekday: [], weekend: [] })
          setGolfPrices([])
        }
      } catch (error) {
        console.error('가격 정보를 불러오는데 실패했습니다:', error)
        setGamePrices({ weekday: [], weekend: [] })
        setGolfPrices([])
      }
    }
    fetchPriceInfo()
  }, [store.id, store.type])
  
  // 플레이 타입이 변경되면 해당 타입의 첫 번째 홀 수로 설정
  useEffect(() => {
    if (playType && availableHoles[playType] && availableHoles[playType].length > 0) {
      if (!availableHoles[playType].includes(holes)) {
        setHoles(availableHoles[playType][0])
      }
    }
  }, [playType, availableHoles])

  // 사용자 정보 가져오기 (로그인된 경우에만)
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          // 로그인하지 않은 경우 빈 필드로 시작
          return
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const user = await response.json()
          // 회원가입 시 입력한 이름과 연락처를 자동으로 설정
          if (user.name) {
            setReservatorName(user.name)
          }
          if (user.phone) {
            // 전화번호를 하이픈 포함 형식으로 포맷팅
            const formattedPhone = formatPhoneNumber(user.phone)
            setContactNumber(formattedPhone)
          }
        } else {
          console.warn('사용자 정보를 불러올 수 없습니다:', response.status)
        }
      } catch (error) {
        console.error('사용자 정보를 불러오는데 실패했습니다:', error)
        // 에러가 발생해도 계속 진행 (로그인 없이 예약 가능)
      }
    }
    fetchUserInfo()
  }, [])

  // 날짜 포맷팅 (날짜와 요일 표시)
  const formatDateShort = (date: Date) => {
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
    const dayName = dayNames[date.getDay()]
    return `${month}.${day.toString().padStart(2, '0')}(${dayName})`
  }

  // 가격 계산 함수
  const calculatePrice = () => {
    // 연습장인 경우 gamePrices에서 가격 조회 (1개월권, 3개월권 등)
    if (store.type === '골프연습장') {
      if (!selectedReservationTime || !holes) {
        return 0
      }

      // 선택한 날짜가 평일인지 주말인지 확인
      const dayOfWeek = selectedReservationDate.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const priceList = Array.isArray(isWeekend ? gamePrices.weekend : gamePrices.weekday)
        ? (isWeekend ? gamePrices.weekend : gamePrices.weekday)
        : []

      if (priceList.length === 0) {
        return 0
      }

      // 선택한 시간이 포함된 시간대 찾기
      const selectedTimeMinutes = getTimeInMinutes(selectedReservationTime)
      let matchedPrice: any = null

      for (const priceItem of priceList) {
        const timeStr = (priceItem.time || '').trim()
        if (!timeStr || !timeStr.includes('-')) continue
        const timeRange = timeStr.split('-').map((s: string) => s.trim())
        if (timeRange.length < 2) continue
        const startTime = timeRange[0]
        const endTime = timeRange[1]
        const startMinutes = getTimeInMinutes(startTime)
        let endMinutes = getTimeInMinutes(endTime)
        if (endTime === '24:00' || endTime.startsWith('24:')) {
          endMinutes = 24 * 60
        }
        if (selectedTimeMinutes >= startMinutes && selectedTimeMinutes < endMinutes) {
          matchedPrice = priceItem
          break
        }
      }

      // 시간대 매칭 실패 시 첫 번째 유효 이용권 가격 사용 (폴백)
      if (!matchedPrice) {
        for (const priceItem of priceList) {
          let fallbackPrice = 0
          if (holes === '1개월권') fallbackPrice = Number(priceItem.month1 || 0)
          else if (holes === '3개월권') fallbackPrice = Number(priceItem.month3 || 0)
          else if (holes === '6개월권') fallbackPrice = Number(priceItem.month6 || 0)
          else if (holes === '12개월권') fallbackPrice = Number(priceItem.month12 || 0)
          else if (holes === '1일권') fallbackPrice = Number(priceItem.day1 || 0)
          if (fallbackPrice > 0) {
            matchedPrice = priceItem
            break
          }
        }
      }

      if (!matchedPrice) {
        return 0
      }

      let pricePerPerson = 0
      if (holes === '1개월권') {
        pricePerPerson = Number(matchedPrice.month1 || 0)
      } else if (holes === '3개월권') {
        pricePerPerson = Number(matchedPrice.month3 || 0)
      } else if (holes === '6개월권') {
        pricePerPerson = Number(matchedPrice.month6 || 0)
      } else if (holes === '12개월권') {
        pricePerPerson = Number(matchedPrice.month12 || 0)
      } else if (holes === '1일권') {
        pricePerPerson = Number(matchedPrice.day1 || 0)
      }

      return pricePerPerson
    }

    // 스크린골프/파크골프인 경우 기존 로직 사용
    if (!selectedReservationTime || !playType || !holes) {
      return 0
    }

    // 선택한 날짜가 평일인지 주말인지 확인
    const dayOfWeek = selectedReservationDate.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const priceList = Array.isArray(isWeekend ? gamePrices.weekend : gamePrices.weekday)
      ? (isWeekend ? gamePrices.weekend : gamePrices.weekday)
      : []

    if (priceList.length === 0) {
      return 0
    }

    // 선택한 시간이 포함된 시간대 찾기 (시간 형식: "14:00-22:00" 또는 "06:00 - 24:00")
    const selectedTimeMinutes = getTimeInMinutes(selectedReservationTime)
    let matchedPrice: any = null

    for (const priceItem of priceList) {
      const timeStr = (priceItem.time || '').trim()
      if (!timeStr || !timeStr.includes('-')) continue
      const timeRange = timeStr.split('-').map((s: string) => s.trim())
      if (timeRange.length < 2) continue
      const startTime = timeRange[0]
      const endTime = timeRange[1]
      const startMinutes = getTimeInMinutes(startTime)
      let endMinutes = getTimeInMinutes(endTime)
      if (endTime === '24:00' || endTime.startsWith('24:')) {
        endMinutes = 24 * 60
      }
      if (selectedTimeMinutes >= startMinutes && selectedTimeMinutes < endMinutes) {
        matchedPrice = priceItem
        break
      }
    }

    // 시간대 매칭 실패 시 같은 요일의 첫 번째 유효 가격 항목 사용 (폴백)
    if (!matchedPrice) {
      for (const priceItem of priceList) {
        let fallbackPrice = 0
        if (playType === '스트로크') {
          if (holes === '18홀') fallbackPrice = Number(priceItem.stroke18 || priceItem.hole18 || 0)
          else if (holes === '9홀') fallbackPrice = Number(priceItem.stroke9 || priceItem.hole9 || 0)
        } else if (playType === '포썸') {
          if (holes === '18홀') fallbackPrice = Number(priceItem.pome18 || 0)
          else if (holes === '9홀') fallbackPrice = Number(priceItem.pome9 || 0)
        } else if (playType === '연습장') {
          if (holes === '연습장') fallbackPrice = Number(priceItem.practice || 0)
          else if (holes === '60분') fallbackPrice = Number(priceItem.practice60 || 0)
          else if (holes === '30분') fallbackPrice = Number(priceItem.practice30 || 0)
        }
        if (fallbackPrice > 0) {
          matchedPrice = priceItem
          break
        }
      }
    }

    if (!matchedPrice) {
      return 0
    }

    // 선택한 옵션에 맞는 가격 필드 찾기
    let pricePerPerson = 0
    if (playType === '스트로크') {
      if (holes === '18홀') {
        pricePerPerson = Number(matchedPrice.stroke18 || matchedPrice.hole18 || 0)
      } else if (holes === '9홀') {
        pricePerPerson = Number(matchedPrice.stroke9 || matchedPrice.hole9 || 0)
      }
    } else if (playType === '포썸') {
      if (holes === '18홀') {
        pricePerPerson = Number(matchedPrice.pome18 || 0)
      } else if (holes === '9홀') {
        pricePerPerson = Number(matchedPrice.pome9 || 0)
      }
    } else if (playType === '연습장') {
      if (holes === '연습장') {
        pricePerPerson = Number(matchedPrice.practice || 0)
      } else if (holes === '60분') {
        pricePerPerson = Number(matchedPrice.practice60 || 0)
      } else if (holes === '30분') {
        pricePerPerson = Number(matchedPrice.practice30 || 0)
      }
    }

    return pricePerPerson * players
  }

  // 시간을 분으로 변환하는 함수 (공백 제거, 24:00 처리)
  const getTimeInMinutes = (time: string): number => {
    const t = (time || '').trim()
    if (!t) return 0
    if (t === '24:00') return 24 * 60
    const parts = t.split(':').map((s) => parseInt(s.trim(), 10))
    const hours = isNaN(parts[0]) ? 0 : parts[0]
    const minutes = isNaN(parts[1]) ? 0 : parts[1]
    return hours * 60 + minutes
  }

  // 기본 이용시간(분): 1명 기준. 9홀=30분, 18홀=60분. 인원×홀에 따라 N배 적용
  const getBaseMinutes = (): number => {
    if (store.type === '골프연습장') {
      if (holes === '30분') return 30
      if (holes === '60분') return 60
      return 60
    }
    if (holes === '9홀') return 30
    if (holes === '18홀') return 60
    return 60
  }

  // 총 이용시간(분) = 기본 이용시간 × 인원
  const durationMinutes = (playType && holes) ? getBaseMinutes() * players : 60

  // 가격이 변경될 때마다 재계산
  useEffect(() => {
    const calculatedPrice = calculatePrice()
    setPrice(calculatedPrice)
  }, [selectedReservationTime, playType, holes, players, selectedReservationDate, gamePrices])

  // 날짜가 같은지 확인
  const isSameDate = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  // 선택 가능한 날짜 목록 생성 (오늘부터 +1일)
  const getAvailableDates = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const dates: Date[] = []
    for (let i = 0; i <= 1; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }
    
    return dates
  }

  const availableDates = getAvailableDates()

  // pos_admin에서 활성화된 예약 시간 조회 (선택 날짜 변경 시)
  useEffect(() => {
    if (!store?.id || !selectedReservationDate) return
    const dateStr = selectedReservationDate.getFullYear() + '-' +
      String(selectedReservationDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(selectedReservationDate.getDate()).padStart(2, '0')
    let cancelled = false
    setAvailabilityLoading(true)
    fetch(`/api/stores/${store.id}/availability?date=${dateStr}`)
      .then((res) => res.ok ? res.json() : Promise.reject(new Error('예약 가능 시간을 불러올 수 없습니다.')))
      .then((data) => {
        if (cancelled) return
        const timeSlots: string[] = data.timeSlots || []
        const availability: Record<string, boolean> = data.availability || {}
        const rooms: string[] = data.rooms || []
        // 해당 시간에 최소 한 방이라도 예약 가능하면 "활성화된 시간"으로 표시
        const activatedTimes = timeSlots.filter((time) =>
          rooms.some((room) => availability[`${room}-${time}`] === true)
        )
        const morning = activatedTimes.filter((t) => {
          const [h] = t.split(':').map(Number)
          return h < 12
        })
        const afternoon = activatedTimes.filter((t) => {
          const [h] = t.split(':').map(Number)
          return h >= 12
        })
        setAvailabilityTimeSlots({ morning, afternoon })
        const allActivated = [...morning, ...afternoon]
        // 현재 선택이 없거나 새 목록에 없으면 첫 번째 활성 시간으로 설정
        setSelectedReservationTime((prev) =>
          prev && allActivated.includes(prev) ? prev : allActivated[0] || ''
        )
      })
      .catch(() => {
        if (!cancelled) setAvailabilityTimeSlots({ morning: [], afternoon: [] })
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false)
      })
    return () => { cancelled = true }
  }, [store?.id, selectedReservationDate])

  const morningTimes = availabilityTimeSlots.morning
  const afternoonTimes = availabilityTimeSlots.afternoon

  // 룸 목록 생성
  const getRooms = () => {
    if (store.totalRooms) {
      return Array.from({ length: store.totalRooms }, (_, i) => `${i + 1}번방`)
    }
    return ['1번방', '2번방', '3번방', '4번방', '5번방', '6번방', '7번방', '8번방']
  }

  const rooms = getRooms()

  // 요약 텍스트 생성 (포썸일 때는 팀 단위 표시)
  const getSummary = () => {
    const month = selectedReservationDate.getMonth() + 1
    const day = selectedReservationDate.getDate()
    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
    const dayName = dayNames[selectedReservationDate.getDay()]
    const holesText = holes ? ` ${holes}` : ''
    const unit = playType === '포썸' ? '팀' : '명'
    return `${month}월${day}일(${dayName}) ${selectedReservationTime} ${players}${unit} ${playType || ''}${holesText} ${gameCount}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setContactNumber(formatted)
  }

  const handleSubmit = () => {
    if (!reservatorName || !contactNumber || !selectedReservationTime) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }
    setShowPaymentModal(true)
  }

  // 룸선택 UI 제거됨 → 제출 시 사용할 룸 (기존 선택값 또는 첫 번째 룸)
  const roomForReservation = selectedReservationRoom || (rooms.length > 0 ? normalizeRoomName(rooms[0]) : '1번방')

  // 결제 단계일 때는 결제 화면만 표시 (예약하기 폼 숨김 → "결제하기인데 예약하기 폼이 뜨는" 문제 해결)
  if (showPaymentModal) {
    return (
      <div className="absolute inset-0 z-[100] flex flex-col min-h-0 bg-white overflow-hidden">
        <PaymentModal
          store={store}
          reservationData={{
            reservatorName,
            contactNumber,
            date: selectedReservationDate,
            time: selectedReservationTime,
            players,
            playType,
            holes,
            gameCount,
            room: roomForReservation,
            price,
            durationMinutes
          }}
          onClose={() => {
            setShowPaymentModal(false)
            onClose()
          }}
          onBack={() => setShowPaymentModal(false)}
          onComplete={() => {
            if (onComplete) onComplete()
            onClose()
          }}
        />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-[100] flex items-end md:items-start md:justify-center md:pt-0 bg-white overflow-hidden">
      <div 
        className="w-full h-full md:h-auto md:max-h-[90vh] md:w-full md:max-w-none bg-white flex flex-col overflow-hidden flex-shrink-0 md:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 - 상단 여백 없이 붙임 */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <FiChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-bold">예약하기</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <FiUser className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 스크롤 가능한 컨텐츠 - 모바일에서 하단 네비 위로 버튼이 보이도록 여백 확보 */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-3 pb-4 min-h-0 space-y-5">
          {/* 안내 문구 */}
          <p className="text-sm text-gray-600">예약 확인을 위한 정보를 입력해 주세요.</p>

          {/* 예약자명 */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              예약자명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={reservatorName}
              onChange={(e) => setReservatorName(e.target.value)}
              placeholder="이름을 입력해 주세요."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ACEE] focus:border-[#00ACEE] outline-none"
              required
            />
          </div>

          {/* 연락처 */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              연락처 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={contactNumber}
              onChange={handlePhoneChange}
              placeholder="010-1234-5678"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ACEE] focus:border-[#00ACEE] outline-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">해당 연락처를 이용하여 출입문 입장이 가능합니다.</p>
          </div>

          {/* 예약날짜 */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">예약날짜</label>
            <div className="px-3 py-2 rounded-lg border-2 border-gray-300 bg-white text-sm font-medium text-gray-700">
              {formatDateShort(selectedReservationDate)}
            </div>
          </div>

          {/* 예약시간 (pos_admin에서 활성화된 시간만 표시) */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">예약시간</label>
            {availabilityLoading ? (
              <div className="py-6 flex items-center justify-center gap-2 text-gray-500 text-sm">
                <span className="w-5 h-5 rounded-full border-2 border-sky-200 border-t-sky-500 animate-spin" />
                예약 가능 시간 불러오는 중...
              </div>
            ) : morningTimes.length === 0 && afternoonTimes.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">해당 날짜에 예약 가능한 시간이 없습니다.</p>
            ) : (
              <>
                {/* 오전 */}
                {morningTimes.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2">오전</div>
                    <div className="grid grid-cols-4 gap-2">
                      {morningTimes.map((time) => {
                        const isSelected = selectedReservationTime === time
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedReservationTime(time)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                              isSelected
                                ? 'bg-[#00ACEE] text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:border-sky-300'
                            }`}
                          >
                            {time}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 오후 */}
                {afternoonTimes.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 mb-2">오후</div>
                    <div className="grid grid-cols-4 gap-2">
                      {afternoonTimes.map((time) => {
                        const isSelected = selectedReservationTime === time
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedReservationTime(time)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                              isSelected
                                ? 'bg-[#00ACEE] text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:border-sky-300'
                            }`}
                          >
                            {time}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 플레이 옵션 */}
          {availablePlayTypes.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">플레이 옵션</label>
            
            {/* 형태 */}
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-2">형태</div>
                <div className="flex flex-wrap gap-2">
                  {availablePlayTypes.map((type) => (
                <button
                      key={type}
                      onClick={() => setPlayType(type)}
                      className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition ${
                        playType === type
                      ? 'bg-[#00ACEE] text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-sky-300'
                  }`}
                >
                      {type}
                </button>
                  ))}
              </div>
            </div>

              {/* 홀/시간 */}
              {playType && availableHoles[playType] && availableHoles[playType].length > 0 && (
            <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-2">
                    {playType === '연습장' ? '시간' : '홀'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableHoles[playType].map((hole) => (
                <button
                        key={hole}
                        onClick={() => setHoles(hole)}
                        className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition ${
                          holes === hole
                      ? 'bg-[#00ACEE] text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-sky-300'
                  }`}
                >
                        {hole}
                </button>
                    ))}
              </div>
            </div>
              )}

          </div>
          )}

          {/* 인원 (포썸일 때는 팀 단위 표시) */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {playType === '포썸' ? '팀 수' : '인원'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setPlayers(num)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    players === num
                      ? 'bg-[#00ACEE] text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-sky-300'
                  }`}
                >
                  {num}{playType === '포썸' ? '팀' : '명'}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* 하단 고정 영역 - 버튼 아래 여백 없이 아래로 착 붙임 */}
        <div className="bg-white pt-0 px-4 pb-0 space-y-2 flex-shrink-0">
          {/* 요약 */}
          <div className="bg-sky-50 border border-sky-200 rounded-lg px-4 py-3 text-base font-semibold text-gray-800">
            {getSummary()}
          </div>

          {/* 총 합계 및 다음 버튼 */}
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-black rounded-lg px-4 py-3">
              <div className="text-yellow-400 font-bold text-lg">
                총 합계 {price.toLocaleString()}원
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !reservatorName || !contactNumber || !selectedReservationTime}
              className="px-6 py-3 bg-[#00ACEE] text-white rounded-lg font-semibold hover:bg-[#0088c2] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '처리 중...' : '다음'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

