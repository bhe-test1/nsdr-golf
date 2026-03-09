'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import Header from '@/components/Header'
import { FiMail, FiEdit, FiSave, FiImage, FiX, FiSearch, FiPlus, FiTrash2, FiCamera } from 'react-icons/fi'

function CherryBatch() {
  const [configs] = useState(() =>
    Array.from({ length: 28 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 5 + Math.random() * 2,
      size: 10 + Math.random() * 12,
      rotate: Math.random() * 360,
    }))
  )
  return (
    <>
      {configs.map((c, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${c.left}%`,
            top: '-5%',
            width: `${c.size}px`,
            height: `${c.size * 1.4}px`,
            background: 'linear-gradient(135deg, #fbb6ce 0%, #f9a8d4 50%, #f472b6 100%)',
            borderRadius: '50% 50% 50% 0',
            transform: `rotate(${c.rotate}deg)`,
            boxShadow: '0 0 6px rgba(244,114,182,0.3)',
            animation: `cherry-fall ${c.duration}s linear ${c.delay}s 1 forwards`,
            opacity: 0,
          }}
        />
      ))}
    </>
  )
}

export default function StorePage() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSavePopup, setShowSavePopup] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isStoreTypeOpen, setIsStoreTypeOpen] = useState(false)
  const storeTypeRef = useRef<HTMLDivElement>(null)
  const [isPlatformOpen, setIsPlatformOpen] = useState(false)
  const platformRef = useRef<HTMLDivElement>(null)
  const storeInfoFetchedRef = useRef(false)
  const pricesFetchedRef = useRef(false)
  const [priceTab, setPriceTab] = useState<'game' | 'food' | 'golf'>('game')
  const [gamePrices, setGamePrices] = useState<{
    weekday: Array<{ id: string; time: string; [key: string]: string | number }>
    weekend: Array<{ id: string; time: string; [key: string]: string | number }>
  }>({
    weekday: [],
    weekend: [],
  })
  const [foodPrices, setFoodPrices] = useState<Array<{ id: string; name: string; price: number | string }>>([])
  const [golfPrices, setGolfPrices] = useState<Array<{ id: string; name: string; price: number | string }>>([])
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null)
  const [timeInputErrors, setTimeInputErrors] = useState<{ [key: string]: boolean }>({})
  const [cherryBatches, setCherryBatches] = useState<number[]>([])
  const cherryBlossomTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [storeInfo, setStoreInfo] = useState({
    storeName: '', // 매장명
    businessNumber: '',
    ownerName: '',
    phone: '',
    address: '',
    detailAddress: '', // 상세주소
    openDate: '', // 설치일
    storeType: '스크린골프', // 업장구분: 연습장, 파크골프, 스크린골프
    platform: '', // 플랫폼
    storeNumber: '', // 매장번호
    email: '',
    operatingHours: {
      weekday: '06:00 - 24:00',
      weekend: '06:00 - 24:00',
    },
    description: '',
    oneLineIntro: '', // 한줄소개
    notice: '', // 공지사항
    totalRooms: 0,
    parkingAvailable: false,
    parkingSpaces: 0, // 주차 가능 대수
    amenities: [],
    facilities: [] as string[],
    photos: [] as string[], // 이미지 URL 배열
  })

  // 초기 데이터 저장 (변경사항 감지용)
  const [initialStoreInfo, setInitialStoreInfo] = useState(storeInfo)
  const [initialGamePrices, setInitialGamePrices] = useState(gamePrices)
  const [initialFoodPrices, setInitialFoodPrices] = useState(foodPrices)
  const [initialGolfPrices, setInitialGolfPrices] = useState(golfPrices)

  // 시설정보 옵션 목록
  const facilityOptions = ['바닥스크린', '왼손타석', '단체실', '프로교습', '장비보관', '스윙무빙', '야외스크린', '퍼팅연습', '샌드연습']
  
  // 업장구분 옵션 목록
  const storeTypeOptions = ['스크린골프', '파크골프', '연습장']
  
  // 업장구분에 따른 플랫폼 옵션 목록
  const platformOptions = useMemo(() => {
    switch (storeInfo.storeType) {
      case '스크린골프':
        return ['골프존파크', '비젼플러스', '프렌즈스크린', 'SG', '기타']
      case '파크골프':
        return ['파크존', '마실파크', '레저로파크', 'GTR', '기타']
      case '연습장':
        return ['GDR', 'QED', '프렌즈스크린', 'SG', '기타']
      default:
        return []
    }
  }, [storeInfo.storeType])

  // 시간 옵션 생성 (00:00 ~ 24:00, 30분 단위)
  const timeOptions = useMemo(() => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      options.push(`${hour.toString().padStart(2, '0')}:00`)
      options.push(`${hour.toString().padStart(2, '0')}:30`)
    }
    options.push('24:00')
    return options
  }, [])

  // 미리 정의된 시간대 옵션
  const timeRangePresets = [
    { label: '새벽', start: '00:00', end: '06:00' },
    { label: '오전', start: '06:00', end: '12:00' },
    { label: '오후', start: '12:00', end: '18:00' },
    { label: '저녁', start: '18:00', end: '24:00' },
  ]

  // 시간 문자열 파싱 (예: "06:00-12:00" -> { start: "06:00", end: "12:00" })
  const parseTime = (timeString: string) => {
    if (!timeString || !timeString.includes('-')) {
      return { start: '', end: '' }
    }
    const [start, end] = timeString.split('-').map(t => t.trim())
    return { start: start || '', end: end || '' }
  }

  // 30분 단위 검증 함수
  const isValidMinute = (minute: string): boolean => {
    if (!minute || minute === '') return true // 빈 값은 허용 (입력 중일 수 있음)
    const minuteNum = parseInt(minute)
    if (isNaN(minuteNum)) return false
    // 30분 단위만 허용: 00, 30
    return (minuteNum === 0 || minuteNum === 30) && minuteNum >= 0 && minuteNum < 60
  }

  // 시간 입력 자동 포맷팅 (예: "00" -> "00:", "0000" -> "00:00")
  const formatTimeInput = (value: string, inputKey?: string) => {
    // 숫자와 콜론만 허용
    let cleaned = value.replace(/[^0-9:]/g, '')
    
    // 콜론이 이미 있으면 그대로 유지
    if (cleaned.includes(':')) {
      // 콜론 뒤 숫자만 2자리로 제한
      const parts = cleaned.split(':')
      if (parts.length === 2) {
        const hour = parts[0].slice(0, 2)
        const minute = parts[1].slice(0, 2)
        const formatted = minute ? `${hour}:${minute}` : `${hour}:`
        
        // 30분 단위 검증
        if (inputKey && minute) {
          const isValid = isValidMinute(minute)
          setTimeInputErrors(prev => ({
            ...prev,
            [inputKey]: !isValid
          }))
        }
        
        return formatted
      }
      return cleaned
    }
    
    // 숫자만 있는 경우 자동 포맷팅
    if (cleaned.length === 0) {
      if (inputKey) {
        setTimeInputErrors(prev => ({
          ...prev,
          [inputKey]: false
        }))
      }
      return ''
    }
    if (cleaned.length <= 2) {
      // 2자리까지는 그대로 (예: "00", "06")
      return cleaned
    } else if (cleaned.length <= 4) {
      // 3-4자리면 중간에 콜론 추가 (예: "000" -> "00:0", "0000" -> "00:00")
      const hour = cleaned.slice(0, 2)
      const minute = cleaned.slice(2, 4)
      const formatted = `${hour}:${minute}`
      
      // 30분 단위 검증
      if (inputKey && minute) {
        const isValid = isValidMinute(minute)
        setTimeInputErrors(prev => ({
          ...prev,
          [inputKey]: !isValid
        }))
      }
      
      return formatted
    } else {
      // 4자리 초과면 앞 4자리만 사용
      const hour = cleaned.slice(0, 2)
      const minute = cleaned.slice(2, 4)
      const formatted = `${hour}:${minute}`
      
      // 30분 단위 검증
      if (inputKey && minute) {
        const isValid = isValidMinute(minute)
        setTimeInputErrors(prev => ({
          ...prev,
          [inputKey]: !isValid
        }))
      }
      
      return formatted
    }
  }

  // 시간 조합 (예: { start: "06:00", end: "12:00" } -> "06:00-12:00")
  const formatTime = (start: string, end: string) => {
    // 부분 입력도 허용 (한쪽만 입력해도 저장)
    if (!start && !end) return ''
    if (!start) return `-${end}`
    if (!end) return `${start}-`
    return `${start}-${end}`
  }

  // 숫자에 콤마 추가 (예: "1111" -> "1,111")
  const formatNumberWithComma = (value: string | number): string => {
    if (value === '' || value === null || value === undefined) return ''
    const numStr = String(value).replace(/,/g, '')
    if (numStr === '') return ''
    const num = parseInt(numStr)
    if (isNaN(num)) return ''
    return num.toLocaleString()
  }

  // 콤마 제거하고 숫자만 반환 (예: "1,111" -> 1111)
  const removeComma = (value: string): string => {
    return value.replace(/,/g, '')
  }

  // 매장 전화번호 자동 하이픈 포맷팅
  // 11자리: 3-4-4 형식
  // 10자리: 3-3-4 형식
  // 10자리이면서 02로 시작: 2-4-4 형식
  // 9자리: 2-3-4 형식
  const formatStorePhoneNumber = (value: string) => {
    // 숫자만 추출
    const cleaned = value.replace(/[^0-9]/g, '')
    
    if (cleaned.length === 0) return ''
    
    // 11자리 초과 시 11자리까지만
    if (cleaned.length > 11) {
      const limited = cleaned.slice(0, 11)
      return `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7, 11)}`
    }
    
    // 11자리: 3-4-4 형식
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`
    }
    
    // 10자리
    if (cleaned.length === 10) {
      // 02로 시작하면 2-4-4 형식
      if (cleaned.startsWith('02')) {
        return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`
      }
      // 그 외는 3-3-4 형식
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
    }
    
    // 9자리: 2-3-4 형식
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5, 9)}`
    }
    
    // 입력 중일 때 하이픈 추가 (11자리 형식으로 진행 중)
    if (cleaned.length > 7) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
    }
    
    // 입력 중일 때 하이픈 추가 (10자리 형식으로 진행 중)
    if (cleaned.length > 6) {
      // 02로 시작하는 경우 2-4-4 형식
      if (cleaned.startsWith('02')) {
        return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
      }
      // 그 외는 3-3-4 형식
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    
    // 입력 중일 때 하이픈 추가 (9자리 형식으로 진행 중)
    if (cleaned.length > 5) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`
    }
    
    // 입력 중일 때 하이픈 추가
    if (cleaned.length > 3) {
      // 02로 시작하는 경우
      if (cleaned.startsWith('02')) {
        return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`
      }
      // 그 외는 3자리로 시작
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
    }
    
    if (cleaned.length > 2) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`
    }
    
    return cleaned
  }

  // 전화번호 자동 하이픈 포맷팅 (예: "01012345678" -> "010-1234-5678")
  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const cleaned = value.replace(/[^0-9]/g, '')
    
    if (cleaned.length === 0) return ''
    
    // 휴대폰 번호 (010, 011, 016, 017, 018, 019)
    if (cleaned.startsWith('010') || cleaned.startsWith('011') || 
        cleaned.startsWith('016') || cleaned.startsWith('017') || 
        cleaned.startsWith('018') || cleaned.startsWith('019')) {
      if (cleaned.length <= 3) {
        return cleaned
      } else if (cleaned.length <= 7) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
      } else {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`
      }
    }
    
    // 서울 지역번호 (02)
    if (cleaned.startsWith('02')) {
      if (cleaned.length <= 2) {
        return cleaned
      } else if (cleaned.length <= 6) {
        return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`
      } else {
        return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`
      }
    }
    
    // 기타 지역번호 (031, 032, 033, 041, 042, 043, 044, 051, 052, 053, 054, 055, 061, 062, 063, 064)
    if (cleaned.length <= 3) {
      return cleaned
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
    } else if (cleaned.length <= 9) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    } else {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
    }
  }

  // 업장구분에 따른 가격 컬럼 정의
  const priceColumns = useMemo(() => {
    switch (storeInfo.storeType) {
      case '스크린골프':
        return [
          { key: 'stroke18', label: '스트로크 18홀' },
          { key: 'stroke9', label: '스트로크 9홀' },
          { key: 'pome18', label: '포썸 18홀' },
          { key: 'pome9', label: '포썸 9홀' },
          { key: 'practice', label: '연습장' },
        ]
      case '파크골프':
        return [
          { key: 'hole9', label: '스트로크 9홀' },
          { key: 'hole18', label: '스트로크 18홀' },
          { key: 'practice30', label: '연습장 30분' },
          { key: 'practice60', label: '연습장 60분' },
        ]
      case '연습장':
        return [
          { key: 'month1', label: '1개월권' },
          { key: 'month3', label: '3개월권' },
          { key: 'month6', label: '6개월권' },
          { key: 'month12', label: '12개월권' },
          { key: 'day1', label: '1일권' },
        ]
      default:
        return []
    }
  }, [storeInfo.storeType])

  // localStorage에서 매장 정보 불러오기
  const loadStoreInfoFromLocal = () => {
    try {
      const saved = localStorage.getItem('storeInfo')
      if (saved) {
        const parsed = JSON.parse(saved)
        setStoreInfo(parsed)
        setInitialStoreInfo(parsed)
        return true
      }
    } catch (error) {
      console.error('로컬 스토리지에서 매장 정보 불러오기 실패:', error)
    }
    return false
  }

  // 매장 정보를 localStorage에 저장
  const saveStoreInfoToLocal = (info: typeof storeInfo) => {
    try {
      localStorage.setItem('storeInfo', JSON.stringify(info))
    } catch (error) {
      console.error('로컬 스토리지에 매장 정보 저장 실패:', error)
    }
  }

  // 페이지 로드 시 저장된 매장 정보 불러오기 (항상 API 호출)
  useEffect(() => {
    // 이미 불러왔으면 다시 불러오지 않음
    if (storeInfoFetchedRef.current) {
      return
    }

    // 현재 로그인한 점주의 ownerId 확인
    const currentOwnerId = sessionStorage.getItem('currentOwnerId')
    const lastOwnerId = localStorage.getItem('lastOwnerId')
    
    // 다른 점주로 로그인했으면 localStorage 무시
    const shouldIgnoreLocalStorage = currentOwnerId && lastOwnerId && currentOwnerId !== lastOwnerId
    
    if (shouldIgnoreLocalStorage) {
      console.log('다른 점주로 로그인 감지 - localStorage 무시하고 API 호출')
      // 다른 점주의 데이터 삭제
      localStorage.removeItem('storeInfo')
      localStorage.removeItem('storePrices')
    }
    
    // 항상 API에서 최신 데이터 조회 (localStorage 무시)
    const fetchStoreInfo = async (force = false) => {

      try {
        storeInfoFetchedRef.current = true
        const response = await fetch('/api/store', {
          credentials: 'include', // 쿠키를 포함하여 요청
        })
        
        // 401 에러 (인증 실패)인 경우 로그인 페이지로 리다이렉트
        if (response.status === 401) {
          sessionStorage.removeItem('isAuthenticated')
          router.push('/login')
          return
        }
        
        if (response.ok) {
          const data = await response.json()
          console.log('매장 정보 불러오기 - 받은 데이터:', data)
          console.log('매장 정보 불러오기 - ownerId:', data.ownerId)
          console.log('매장 정보 불러오기 - ownerName:', data.ownerName)
          console.log('매장 정보 불러오기 - 현재 로그인한 ownerId:', sessionStorage.getItem('currentOwnerId'))
          console.log('매장 정보 불러오기 - photos:', data.photos)
          
          // ownerId 확인 - 다른 점주의 데이터면 무시
          const currentOwnerId = sessionStorage.getItem('currentOwnerId')
          if (data.ownerId && currentOwnerId && data.ownerId !== currentOwnerId) {
            console.error('⚠️ 다른 점주의 데이터 수신! 무시합니다.', {
              받은ownerId: data.ownerId,
              현재ownerId: currentOwnerId,
            })
            return
          }
          
          const updatedStoreInfo = {
            storeName: data.storeName || '',
            businessNumber: data.businessNumber || '',
            ownerName: data.ownerName || '',
            phone: data.phone || '',
            address: data.address || '',
            detailAddress: data.detailAddress || '',
            openDate: data.openDate || '',
            storeType: data.storeType || '스크린골프',
            platform: data.platform || '',
            storeNumber: data.storeNumber || '',
            email: data.email || '',
            operatingHours: {
              weekday: '06:00 - 24:00',
              weekend: '06:00 - 24:00',
            },
            description: data.description || '',
            oneLineIntro: data.oneLineIntro || '',
            notice: data.notice || '',
            totalRooms: data.totalRooms || 0,
            parkingAvailable: data.parkingAvailable ?? false,
            parkingSpaces: data.parkingSpaces || 0,
            amenities: [],
            facilities: data.facilities || [],
            photos: Array.isArray(data.photos) ? data.photos : (data.photos ? [data.photos] : []),
          }
          
          setStoreInfo(updatedStoreInfo)
          setInitialStoreInfo(updatedStoreInfo)
          saveStoreInfoToLocal(updatedStoreInfo) // localStorage에 저장
        } else {
          storeInfoFetchedRef.current = false
        }
      } catch (error) {
        console.error('매장 정보를 불러오는데 실패했습니다:', error)
        storeInfoFetchedRef.current = false
      }
    }

    fetchStoreInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 파크골프 데이터 변환 함수
  const convertToParkGolfStructure = (prices: Array<{ id: string; time: string; [key: string]: string | number }>) => {
    return prices.map((price) => {
      const converted: { id: string; time: string; [key: string]: string | number } = {
        id: price.id,
        time: price.time || '',
      }
      
      // 스크린골프 구조에서 파크골프 구조로 변환
      if ('stroke9' in price) {
        converted.hole9 = price.stroke9 || ''
      } else if (!('hole9' in price)) {
        converted.hole9 = ''
      } else {
        converted.hole9 = price.hole9 || ''
      }
      
      if ('stroke18' in price) {
        converted.hole18 = price.stroke18 || ''
      } else if (!('hole18' in price)) {
        converted.hole18 = ''
      } else {
        converted.hole18 = price.hole18 || ''
      }
      
      if ('practice' in price) {
        // practice가 있으면 practice30과 practice60으로 분리하지 않고, 둘 다 같은 값으로 설정하거나 빈 값으로
        converted.practice30 = ''
        converted.practice60 = ''
      } else {
        converted.practice30 = price.practice30 || ''
        converted.practice60 = price.practice60 || ''
      }
      
      // 기타 필드 제거 (pome9, pome18 등)
      return converted
    })
  }

  // localStorage에서 가격 정보 불러오기
  const loadPricesFromLocal = () => {
    try {
      const saved = localStorage.getItem('storePrices')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.gamePrices) {
          let gamePricesData = parsed.gamePrices
          
          // 파크골프일 때만 스크린골프 구조가 있는 경우에만 변환
          if (storeInfo.storeType === '파크골프') {
            const needsConversion = gamePricesData.weekday?.some((price: any) => 
              'stroke9' in price || 'stroke18' in price || 'pome9' in price || 'pome18' in price
            ) || gamePricesData.weekend?.some((price: any) => 
              'stroke9' in price || 'stroke18' in price || 'pome9' in price || 'pome18' in price
            )
            
            if (needsConversion) {
              gamePricesData = {
                weekday: convertToParkGolfStructure(gamePricesData.weekday || []),
                weekend: convertToParkGolfStructure(gamePricesData.weekend || []),
              }
            }
          }
          
          setGamePrices(gamePricesData)
          setInitialGamePrices(gamePricesData)
        }
        if (parsed.foodPrices) {
          // 기존 데이터가 배열이면 그대로 사용, 객체 형태면 weekday와 weekend를 합쳐서 사용
          let foodPricesData: Array<{ id: string; name: string; price: number | string }>
          if (Array.isArray(parsed.foodPrices)) {
            foodPricesData = parsed.foodPrices || []
          } else {
            // 객체 형태면 weekday와 weekend를 합침
            const weekday = parsed.foodPrices.weekday || []
            const weekend = parsed.foodPrices.weekend || []
            foodPricesData = [...weekday, ...weekend]
          }
          setFoodPrices(foodPricesData)
          setInitialFoodPrices(foodPricesData)
        }
        if (parsed.golfPrices) {
          setGolfPrices(parsed.golfPrices)
          setInitialGolfPrices(parsed.golfPrices)
        }
        return true
      }
    } catch (error) {
      console.error('로컬 스토리지에서 가격 정보 불러오기 실패:', error)
    }
    return false
  }

  // 가격 정보를 localStorage에 저장
  const savePricesToLocal = (prices: { gamePrices: typeof gamePrices; foodPrices: typeof foodPrices; golfPrices: typeof golfPrices }) => {
    try {
      localStorage.setItem('storePrices', JSON.stringify(prices))
    } catch (error) {
      console.error('로컬 스토리지에 가격 정보 저장 실패:', error)
    }
  }

  // 페이지 로드 시 저장된 가격 정보 불러오기 (로컬 우선, 없으면 API 호출)
  useEffect(() => {
    // 이미 불러왔으면 다시 불러오지 않음
    if (pricesFetchedRef.current) {
      return
    }

    // 먼저 localStorage에서 불러오기
    const hasLocalData = loadPricesFromLocal()

    const fetchPrices = async (force = false) => {
      // 로컬에 데이터가 있고 강제 새로고침이 아니면 API 호출 안 함
      if (!force && hasLocalData) {
        pricesFetchedRef.current = true
        return
      }

      try {
        pricesFetchedRef.current = true
        const response = await fetch('/api/price', {
          credentials: 'include',
        })
        
        if (response.status === 401) {
          pricesFetchedRef.current = false
          return
        }
        
        if (response.ok) {
          const data = await response.json()
          const pricesData: { gamePrices?: typeof gamePrices; foodPrices?: typeof foodPrices; golfPrices?: typeof golfPrices } = {}
          
          if (data.gamePrices) {
            let gamePricesData = {
              weekday: data.gamePrices.weekday || [],
              weekend: data.gamePrices.weekend || [],
            }
            
            // 파크골프일 때만 스크린골프 구조가 있는 경우에만 변환
            if (storeInfo.storeType === '파크골프') {
              const needsConversion = gamePricesData.weekday.some((price: any) => 
                'stroke9' in price || 'stroke18' in price || 'pome9' in price || 'pome18' in price
              ) || gamePricesData.weekend.some((price: any) => 
                'stroke9' in price || 'stroke18' in price || 'pome9' in price || 'pome18' in price
              )
              
              if (needsConversion) {
                gamePricesData = {
                  weekday: convertToParkGolfStructure(gamePricesData.weekday),
                  weekend: convertToParkGolfStructure(gamePricesData.weekend),
                }
              }
            }
            
            setGamePrices(gamePricesData)
            setInitialGamePrices(gamePricesData)
            pricesData.gamePrices = gamePricesData
          }
          if (data.foodPrices) {
            // 기존 데이터가 배열이면 그대로 사용, 객체 형태면 weekday와 weekend를 합쳐서 사용
            let foodPricesData: Array<{ id: string; name: string; price: number | string }>
            if (Array.isArray(data.foodPrices)) {
              foodPricesData = data.foodPrices || []
            } else {
              // 객체 형태면 weekday와 weekend를 합침
              const weekday = data.foodPrices.weekday || []
              const weekend = data.foodPrices.weekend || []
              foodPricesData = [...weekday, ...weekend]
            }
            setFoodPrices(foodPricesData)
            setInitialFoodPrices(foodPricesData)
            pricesData.foodPrices = foodPricesData
          }
          if (data.golfPrices) {
            const golfPricesData = data.golfPrices || []
            setGolfPrices(golfPricesData)
            setInitialGolfPrices(golfPricesData)
            pricesData.golfPrices = golfPricesData
          }
          
          // localStorage에 저장
          if (Object.keys(pricesData).length > 0) {
            savePricesToLocal(pricesData as { gamePrices: typeof gamePrices; foodPrices: typeof foodPrices; golfPrices: typeof golfPrices })
          }
        } else {
          pricesFetchedRef.current = false
        }
      } catch (error) {
        console.error('가격 정보를 불러오는데 실패했습니다:', error)
        pricesFetchedRef.current = false
      }
    }

    fetchPrices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // storeType이 변경될 때 가격 데이터 구조 변환 (스크린골프에서 파크골프로 변경될 때만)
  useEffect(() => {
    if (storeInfo.storeType === '파크골프' && gamePrices.weekday.length > 0) {
      // 기존 데이터가 스크린골프 구조인지 확인 (stroke9, stroke18 등이 있는지)
      // 이미 파크골프 구조(hole9, hole18, practice30, practice60)가 있으면 변환하지 않음
      const hasParkGolfStructure = gamePrices.weekday.some(price => 
        'hole9' in price || 'hole18' in price || 'practice30' in price || 'practice60' in price
      ) || gamePrices.weekend.some(price => 
        'hole9' in price || 'hole18' in price || 'practice30' in price || 'practice60' in price
      )
      
      // 스크린골프 구조가 있고, 파크골프 구조가 없을 때만 변환
      const needsConversion = !hasParkGolfStructure && (
        gamePrices.weekday.some(price => 
          'stroke9' in price || 'stroke18' in price || 'pome9' in price || 'pome18' in price
        ) || gamePrices.weekend.some(price => 
          'stroke9' in price || 'stroke18' in price || 'pome9' in price || 'pome18' in price
        )
      )
      
      if (needsConversion) {
        const convertedGamePrices = {
          weekday: convertToParkGolfStructure(gamePrices.weekday),
          weekend: convertToParkGolfStructure(gamePrices.weekend),
        }
        setGamePrices(convertedGamePrices)
        setInitialGamePrices(convertedGamePrices)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeInfo.storeType])

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (storeTypeRef.current && !storeTypeRef.current.contains(event.target as Node)) {
        setIsStoreTypeOpen(false)
      }
      if (platformRef.current && !platformRef.current.contains(event.target as Node)) {
        setIsPlatformOpen(false)
      }
    }

    if (isStoreTypeOpen || isPlatformOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isStoreTypeOpen, isPlatformOpen])

  // 외부 클릭으로 자동 취소되는 로직 제거 - 취소 버튼을 통해서만 취소 가능

  // 가격 정보 변경 시 localStorage에 자동 저장 (draft)
  useEffect(() => {
    if (pricesFetchedRef.current) {
      savePricesToLocal({
        gamePrices,
        foodPrices,
        golfPrices,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePrices, foodPrices, golfPrices])

  // 변경사항 감지 함수
  const hasChanges = useMemo(() => {
    // 매장 정보 변경사항 확인
    const storeInfoChanged = JSON.stringify(storeInfo) !== JSON.stringify(initialStoreInfo)
    
    // 가격 정보 변경사항 확인
    const gamePricesChanged = JSON.stringify(gamePrices) !== JSON.stringify(initialGamePrices)
    const foodPricesChanged = JSON.stringify(foodPrices) !== JSON.stringify(initialFoodPrices)
    const golfPricesChanged = JSON.stringify(golfPrices) !== JSON.stringify(initialGolfPrices)
    
    return storeInfoChanged || gamePricesChanged || foodPricesChanged || golfPricesChanged
  }, [storeInfo, initialStoreInfo, gamePrices, initialGamePrices, foodPrices, initialFoodPrices, golfPrices, initialGolfPrices])

  // 필수사항 완성도 체크 (메모이제이션)
  const storeCompletionStatus = useMemo(() => {
    // 필수 항목 체크
    // 1. 매장 전화번호
    const storeNumberOk = storeInfo.storeNumber && String(storeInfo.storeNumber).trim() !== ''
    
    // 2. 총 룸 수 (1개 이상)
    const totalRoomsValue = Number(storeInfo.totalRooms) || 0
    const totalRoomsOk = totalRoomsValue > 0
    
    // 3. 주차여부 (가능/불가능 선택)
    const parkingOk = storeInfo.parkingAvailable !== undefined && storeInfo.parkingAvailable !== null
    
    // 필수 항목 완성도
    const isAllComplete = storeNumberOk && totalRoomsOk && parkingOk
    
    // 매장 정보 체크 (참고용)
    const businessNumberOk = storeInfo.businessNumber && String(storeInfo.businessNumber).trim() !== ''
    const ownerNameOk = storeInfo.ownerName && String(storeInfo.ownerName).trim() !== ''
    const phoneOk = storeInfo.phone && String(storeInfo.phone).trim() !== ''
    const openDateOk = storeInfo.openDate && String(storeInfo.openDate).trim() !== ''
    const addressOk = storeInfo.address && String(storeInfo.address).trim() !== ''
    const detailAddressOk = storeInfo.detailAddress && String(storeInfo.detailAddress).trim() !== ''
    const storeTypeOk = storeInfo.storeType && String(storeInfo.storeType).trim() !== ''
    const platformOk = storeInfo.platform && String(storeInfo.platform).trim() !== ''
    
    const isStoreInfoComplete = 
      businessNumberOk &&
      ownerNameOk &&
      phoneOk &&
      openDateOk &&
      addressOk &&
      detailAddressOk &&
      storeTypeOk &&
      platformOk
    
    // 운영 정보 체크 (공지사항, 편의시설, 한줄소개는 선택사항)
    const isOperationInfoComplete = 
      totalRoomsOk &&
      parkingOk
    
    return {
      isAllComplete,
      isStoreInfoComplete,
      isOperationInfoComplete,
      details: {
        필수항목: {
          storeNumber: { 값: storeInfo.storeNumber, 체크: storeNumberOk },
          totalRooms: { 값: storeInfo.totalRooms, 변환: totalRoomsValue, 체크: totalRoomsOk },
          parking: { 가능: storeInfo.parkingAvailable, 체크: parkingOk },
        },
        매장정보: {
          businessNumber: businessNumberOk,
          ownerName: ownerNameOk,
          phone: phoneOk,
          openDate: openDateOk,
          address: addressOk,
          detailAddress: detailAddressOk,
          storeType: storeTypeOk,
          platform: platformOk,
          isStoreInfoComplete
        },
        운영정보: {
          totalRooms: { 값: storeInfo.totalRooms, 변환: totalRoomsValue, 체크: totalRoomsOk },
          parking: { 가능: storeInfo.parkingAvailable, 대수: storeInfo.parkingSpaces, 체크: parkingOk },
          facilities: { 값: storeInfo.facilities, 길이: storeInfo.facilities?.length || 0, 체크: true },
          oneLineIntro: { 값: storeInfo.oneLineIntro, 체크: true },
          isOperationInfoComplete
        },
        최종결과: isAllComplete
      }
    }
  }, [
    storeInfo.businessNumber,
    storeInfo.ownerName,
    storeInfo.phone,
    storeInfo.openDate,
    storeInfo.address,
    storeInfo.detailAddress,
    storeInfo.storeType,
    storeInfo.platform,
    storeInfo.storeNumber,
    storeInfo.totalRooms,
    storeInfo.parkingAvailable,
    storeInfo.parkingSpaces,
    storeInfo.facilities,
    storeInfo.oneLineIntro
  ])

  // 필수사항 체크 로그 제거 (필요시 주석 해제)
  // useEffect(() => {
  //   if (process.env.NODE_ENV === 'development') {
  //     console.log('필수사항 체크:', storeCompletionStatus.details)
  //   }
  // }, [storeCompletionStatus.isAllComplete])

  const handleSave = async () => {
    setIsLoading(true)
    // 저장 버튼 클릭 시 즉시 팝업 표시
    setShowSavePopup(true)
    setSaveMessage('매장 정보가 업데이트 되었습니다.')
    
    try {
      setIsEditing(false)
      
      console.log('매장 정보 저장 요청 - photos:', storeInfo.photos)
      
      // 매장 정보 저장 API 호출
      const response = await fetch('/api/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 쿠키를 포함하여 요청
        body: JSON.stringify({
          ...storeInfo,
          // 추가 필드들
          businessNumber: storeInfo.businessNumber,
          ownerName: storeInfo.ownerName,
          phone: storeInfo.phone,
          address: storeInfo.address,
          detailAddress: storeInfo.detailAddress,
          openDate: storeInfo.openDate,
          storeType: storeInfo.storeType,
          platform: storeInfo.platform,
          storeNumber: storeInfo.storeNumber,
          email: storeInfo.email,
          description: storeInfo.description,
          oneLineIntro: storeInfo.oneLineIntro,
          notice: storeInfo.notice,
          totalRooms: storeInfo.totalRooms,
          parkingAvailable: storeInfo.parkingAvailable,
          parkingSpaces: storeInfo.parkingSpaces,
          facilities: storeInfo.facilities,
          photos: storeInfo.photos,
        }),
      })

      // 401 에러 (인증 실패)인 경우 로그인 페이지로 리다이렉트
      if (response.status === 401) {
        sessionStorage.removeItem('isAuthenticated')
        setSaveMessage('인증이 만료되었습니다. 다시 로그인해주세요.')
        router.push('/login')
        return
      }

      if (response.ok) {
        const data = await response.json()
        
        // 초기 데이터 업데이트 (새로고침 없이 상태만 업데이트)
        setInitialStoreInfo(storeInfo)
        // localStorage에도 저장
        saveStoreInfoToLocal(storeInfo)
        
        // 저장 성공 후 최신 데이터 다시 불러오기 (에러 처리 포함)
        try {
          const refreshResponse = await fetch('/api/store', {
            credentials: 'include',
          })
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json()
            const currentOwnerId = sessionStorage.getItem('currentOwnerId')
            if (refreshData.ownerId && currentOwnerId && refreshData.ownerId !== currentOwnerId) {
              console.error('⚠️ 다른 점주의 데이터 수신! 무시합니다.')
            } else {
              const updatedStoreInfo = {
                storeName: refreshData.storeName || '',
                businessNumber: refreshData.businessNumber || '',
                ownerName: refreshData.ownerName || '',
                phone: refreshData.phone || '',
                address: refreshData.address || '',
                detailAddress: refreshData.detailAddress || '',
                openDate: refreshData.openDate || '',
                storeType: refreshData.storeType || '스크린골프',
                platform: refreshData.platform || '',
                storeNumber: refreshData.storeNumber || '',
                email: refreshData.email || '',
                operatingHours: {
                  weekday: '06:00 - 24:00',
                  weekend: '06:00 - 24:00',
                },
                description: refreshData.description || '',
                oneLineIntro: refreshData.oneLineIntro || '',
                notice: refreshData.notice || '',
                totalRooms: refreshData.totalRooms || 0,
                parkingAvailable: refreshData.parkingAvailable ?? false,
                parkingSpaces: refreshData.parkingSpaces || 0,
                amenities: [],
                facilities: refreshData.facilities || [],
                photos: Array.isArray(refreshData.photos) ? refreshData.photos : (refreshData.photos ? [refreshData.photos] : []),
              }
              
              setStoreInfo(updatedStoreInfo)
              setInitialStoreInfo(updatedStoreInfo)
              saveStoreInfoToLocal(updatedStoreInfo)
            }
          } else {
            console.warn('저장 후 데이터 새로고침 실패, 하지만 저장은 성공했습니다.')
          }
        } catch (refreshError) {
          console.warn('저장 후 데이터 새로고침 중 오류 발생, 하지만 저장은 성공했습니다:', refreshError)
          // 새로고침 실패해도 저장은 성공했으므로 계속 진행
        }
      } else {
        let errorMessage = '매장 정보 저장에 실패했습니다.'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          if (errorData.details) {
            console.error('저장 실패 상세:', errorData.details)
            errorMessage += `\n\n상세: ${errorData.details}`
          }
        } catch (parseError) {
          const errorText = await response.text()
          console.error('저장 실패 응답:', errorText)
        }
        setSaveMessage(errorMessage)
        setIsEditing(true) // 실패 시 다시 편집 모드로
      }
    } catch (error: any) {
      console.error('저장 오류:', error)
      // 네트워크 에러인 경우 더 명확한 메시지 표시
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setSaveMessage('네트워크 연결을 확인해주세요. 저장 요청이 실패했습니다.')
      } else {
        setSaveMessage(`매장 정보 저장 중 오류가 발생했습니다.\n\n${error.message || '알 수 없는 오류'}`)
      }
      setIsEditing(true) // 실패 시 다시 편집 모드로
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean | number) => {
    setStoreInfo((prev) => {
      const updated = { ...prev, [field]: value }
      // 업장구분이 변경되면 플랫폼 초기화 및 드롭다운 닫기
      if (field === 'storeType') {
        updated.platform = ''
        setIsPlatformOpen(false)
      }
      // 변경사항을 localStorage에 draft로 저장 (자동 저장)
      saveStoreInfoToLocal(updated)
      return updated
    })
  }

  const handleFacilityToggle = (facility: string) => {
    setStoreInfo((prev) => {
      const facilities = prev.facilities || []
      if (facilities.includes(facility)) {
        return {
          ...prev,
          facilities: facilities.filter((f) => f !== facility),
        }
      } else {
        return {
          ...prev,
          facilities: [...facilities, facility],
        }
      }
    })
  }

  // 가격관리 핸들러
  const handleAddGamePrice = (type: 'weekday' | 'weekend') => {
    // 30분 단위 검증 오류가 있으면 추가 불가
    const hasErrors = Object.values(timeInputErrors).some(error => error)
    if (hasErrors) {
      alert('시간은 30분단위로 설정 가능합니다. 올바른 시간을 입력해주세요.')
      return
    }

    const newPrice: { id: string; time: string; [key: string]: string | number } = {
      id: Date.now().toString(),
      time: '',
    }
    // 업장구분에 맞는 필드 초기화
    priceColumns.forEach((column) => {
      newPrice[column.key] = ''
    })
    setGamePrices((prev) => ({
      ...prev,
      [type]: [...prev[type], newPrice],
    }))
    setEditingPriceId(newPrice.id)
  }

  const handleUpdateGamePrice = (type: 'weekday' | 'weekend', id: string, field: string, value: string | number) => {
    setGamePrices((prev) => ({
      ...prev,
      [type]: prev[type].map((price) =>
        price.id === id ? { ...price, [field]: value } : price
      ),
    }))
  }

  const handleDeleteGamePrice = (type: 'weekday' | 'weekend', id: string) => {
    setGamePrices((prev) => ({
      ...prev,
      [type]: prev[type].filter((price) => price.id !== id),
    }))
  }

  // 빈 행인지 확인하는 함수
  const isEmptyPrice = (price: { id: string; time: string; [key: string]: string | number }) => {
    // 시간이 비어있는지 확인
    const hasTime = price.time && price.time.trim() !== ''
    
    // 가격이 하나라도 입력되었는지 확인
    const hasPrice = priceColumns.some(column => {
      const value = price[column.key]
      return value !== '' && value !== 0 && value !== null && value !== undefined
    })
    
    return !hasTime && !hasPrice
  }

  // 가격 입력 취소 핸들러
  const handleCancelEditing = () => {
    if (!editingPriceId) return
    
    // 현재 편집 중인 행이 평일인지 주말인지 확인
    const weekdayPrice = gamePrices.weekday.find(p => p.id === editingPriceId)
    const weekendPrice = gamePrices.weekend.find(p => p.id === editingPriceId)
    const foodPrice = foodPrices.find(p => p.id === editingPriceId)
    const golfPrice = golfPrices.find(p => p.id === editingPriceId)
    
    if (weekdayPrice) {
      // 빈 행이면 삭제
      if (isEmptyPrice(weekdayPrice)) {
        handleDeleteGamePrice('weekday', editingPriceId)
      }
    } else if (weekendPrice) {
      // 빈 행이면 삭제
      if (isEmptyPrice(weekendPrice)) {
        handleDeleteGamePrice('weekend', editingPriceId)
      }
    } else if (foodPrice) {
      // 식음료 빈 행이면 삭제
      if ((!foodPrice.name || foodPrice.name.trim() === '') && (!foodPrice.price || foodPrice.price === 0)) {
        handleDeleteFoodPrice(editingPriceId)
      }
    } else if (golfPrice) {
      // 골프용품 빈 행이면 삭제
      if ((!golfPrice.name || golfPrice.name.trim() === '') && (!golfPrice.price || golfPrice.price === 0)) {
        handleDeleteGolfPrice(editingPriceId)
      }
    }
    
    // 편집 모드 종료
    setEditingPriceId(null)
  }

  // 가격 저장 핸들러
  const handleSavePrices = async () => {
    try {
      // 30분 단위 검증 오류가 있으면 저장 불가
      const hasErrors = Object.values(timeInputErrors).some(error => error)
      if (hasErrors) {
        alert('시간은 30분단위로 설정 가능합니다. 올바른 시간을 입력해주세요.')
        return
      }

      // 시간이 입력된 행만 필터링
      const filteredWeekday = gamePrices.weekday.filter(price => {
        const time = price.time || ''
        return time.trim() !== '' && time !== '-' && !time.startsWith('-') && !time.endsWith('-')
      })
      
      const filteredWeekend = gamePrices.weekend.filter(price => {
        const time = price.time || ''
        return time.trim() !== '' && time !== '-' && !time.startsWith('-') && !time.endsWith('-')
      })

      // 식음료 가격 유효성 검사 - 품목명과 가격이 모두 입력된 항목만 필터링
      const filteredFoodPrices = foodPrices.filter(price => {
        const name = (price.name || '').trim()
        const priceValue = price.price
        return name !== '' && priceValue !== '' && priceValue !== 0 && priceValue !== null && priceValue !== undefined
      })

      // 식음료 가격에 빈 항목이 있는지 확인
      const hasEmptyFoodItems = foodPrices.some(price => {
        const name = (price.name || '').trim()
        const priceValue = price.price
        return name === '' || priceValue === '' || priceValue === 0 || priceValue === null || priceValue === undefined
      })

      if (hasEmptyFoodItems) {
        alert('식음료 가격에서 품목명과 가격을 모두 입력해주세요.')
        return
      }

      // 골프용품 가격 유효성 검사 - 품목명과 가격이 모두 입력된 항목만 필터링
      const filteredGolfPrices = golfPrices.filter(price => {
        const name = (price.name || '').trim()
        const priceValue = price.price
        return name !== '' && priceValue !== '' && priceValue !== 0 && priceValue !== null && priceValue !== undefined
      })

      // 골프용품 가격에 빈 항목이 있는지 확인
      const hasEmptyGolfItems = golfPrices.some(price => {
        const name = (price.name || '').trim()
        const priceValue = price.price
        return name === '' || priceValue === '' || priceValue === 0 || priceValue === null || priceValue === undefined
      })

      if (hasEmptyGolfItems) {
        alert('골프용품 가격에서 품목명과 가격을 모두 입력해주세요.')
        return
      }

      // 가격 데이터 저장 API 호출
      const response = await fetch('/api/price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          gamePrices: {
            weekday: filteredWeekday,
            weekend: filteredWeekend,
          },
          foodPrices: filteredFoodPrices,
          golfPrices: filteredGolfPrices,
        }),
      })

      // 401 에러 (인증 실패)인 경우 로그인 페이지로 리다이렉트
      if (response.status === 401) {
        sessionStorage.removeItem('isAuthenticated')
        alert('인증이 만료되었습니다. 다시 로그인해주세요.')
        router.push('/login')
        return
      }

      if (response.ok) {
        setEditingPriceId(null)
        
        // 저장된 가격 정보로 상태 업데이트 (필터링된 데이터 사용)
        const updatedGamePrices = {
          weekday: filteredWeekday,
          weekend: filteredWeekend,
        }
        setGamePrices(updatedGamePrices)
        setInitialGamePrices(updatedGamePrices)
        setFoodPrices(filteredFoodPrices)
        setInitialFoodPrices(filteredFoodPrices)
        setGolfPrices(filteredGolfPrices)
        setInitialGolfPrices(filteredGolfPrices)
        
        // localStorage에 저장
        savePricesToLocal({
          gamePrices: updatedGamePrices,
          foodPrices: filteredFoodPrices,
          golfPrices: filteredGolfPrices,
        })
      } else {
        let errorMessage = '가격 정보 저장에 실패했습니다.'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error('저장 실패 응답 파싱 오류:', parseError)
        }
        alert(errorMessage)
      }
    } catch (error: any) {
      console.error('가격 저장 오류:', error)
      alert(`가격 정보 저장 중 오류가 발생했습니다.\n\n${error.message || '알 수 없는 오류'}`)
    }
  }

  // 편집 모드로 전환할 때 이전 편집 중이던 행이 빈 행이면 삭제
  const handleStartEditing = (type: 'weekday' | 'weekend', priceId: string) => {
    // 이전에 편집 중이던 행이 있으면 체크
    if (editingPriceId) {
      const prevType = gamePrices.weekday.find(p => p.id === editingPriceId) ? 'weekday' : 'weekend'
      const prevPrices = prevType === 'weekday' ? gamePrices.weekday : gamePrices.weekend
      const prevPrice = prevPrices.find(p => p.id === editingPriceId)
      
      if (prevPrice && isEmptyPrice(prevPrice)) {
        handleDeleteGamePrice(prevType, editingPriceId)
      }
    }
    
    setEditingPriceId(priceId)
  }

  const handleAddFoodPrice = () => {
    const newPrice: { id: string; name: string; price: number | string } = {
      id: Date.now().toString(),
      name: '',
      price: '',
    }
    setFoodPrices((prev) => [...prev, newPrice])
    setEditingPriceId(newPrice.id)
  }

  const handleUpdateFoodPrice = (id: string, field: string, value: string | number) => {
    setFoodPrices((prev) =>
      prev.map((price) => (price.id === id ? { ...price, [field]: value } : price))
    )
  }

  const handleDeleteFoodPrice = (id: string) => {
    setFoodPrices((prev) => prev.filter((price) => price.id !== id))
  }

  const handleAddGolfPrice = () => {
    const newPrice: { id: string; name: string; price: number | string } = {
      id: Date.now().toString(),
      name: '',
      price: '',
    }
    setGolfPrices((prev) => [...prev, newPrice])
    setEditingPriceId(newPrice.id)
  }

  const handleUpdateGolfPrice = (id: string, field: string, value: string | number) => {
    setGolfPrices((prev) =>
      prev.map((price) => (price.id === id ? { ...price, [field]: value } : price))
    )
  }

  const handleDeleteGolfPrice = (id: string) => {
    setGolfPrices((prev) => prev.filter((price) => price.id !== id))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const remainingSlots = 5 - storeInfo.photos.length
    if (remainingSlots <= 0) {
      alert('최대 5개까지 업로드할 수 있습니다.')
      return
    }

    // 세션 스토리지에서 사용자 이름 가져오기
    const userName = sessionStorage.getItem('userName') || '사용자'
    
    const filesArray = Array.from(files).slice(0, remainingSlots)
    
    // 현재 사진 개수를 기준으로 시작 인덱스 설정
    let currentPhotoIndex = storeInfo.photos.length
    
    for (let index = 0; index < filesArray.length; index++) {
      const file = filesArray[index]
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.')
        continue
      }

      try {
        // FormData 생성
        const formData = new FormData()
        formData.append('file', file)
        formData.append('userName', userName)
        formData.append('photoIndex', String(currentPhotoIndex + index + 1))

        // R2에 업로드
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          alert(error.error || '파일 업로드에 실패했습니다.')
          continue
        }

        const data = await response.json()
        console.log('이미지 업로드 성공 - URL:', data.url)
        
        // 업로드된 이미지 URL을 상태에 추가
        setStoreInfo((prev) => {
          const newPhotos = [...prev.photos, data.url]
          console.log('이미지 상태 업데이트 - 새로운 photos:', newPhotos)
          return {
            ...prev,
            photos: newPhotos,
          }
        })
      } catch (error) {
        console.error('업로드 오류:', error)
        alert('파일 업로드에 실패했습니다.')
      }
    }

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (index: number) => {
    setStoreInfo((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }

  const handleImageClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleAddressSearch = () => {
    if (typeof window === 'undefined' || !(window as any).daum) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    new (window as any).daum.Postcode({
      oncomplete: function(data: any) {
        // 도로명 주소와 지번 주소 중 선택된 주소 사용
        let addr = ''
        if (data.userSelectedType === 'R') {
          // 도로명 주소 선택
          addr = data.roadAddress
        } else {
          // 지번 주소 선택
          addr = data.jibunAddress
        }

        // 주소 필드에 선택한 주소 설정
        handleChange('address', addr)
      },
      width: '100%',
      height: '100%',
    }).open()
  }

  const handleCherryBlossomClick = () => {
    setCherryBatches((prev) => [...prev, Date.now()])
    if (cherryBlossomTimeoutRef.current) clearTimeout(cherryBlossomTimeoutRef.current)
    cherryBlossomTimeoutRef.current = setTimeout(() => {
      setCherryBatches([])
      cherryBlossomTimeoutRef.current = null
    }, 6500)
  }

  return (
    <div className="min-h-screen bg-white relative">
      <style>{`
        @keyframes cherry-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0.85; }
          75% { transform: translateY(85vh) rotate(540deg); opacity: 0.5; }
          100% { transform: translateY(100vh) rotate(720deg) scale(0.4); opacity: 0; }
        }
      `}</style>
      {cherryBatches.length > 0 && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50" aria-hidden>
          {cherryBatches.map((batchId) => (
            <CherryBatch key={batchId} />
          ))}
        </div>
      )}
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="lazyOnload"
      />
      <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 페이지 헤더 */}
          <div className="mb-6 flex items-center justify-between">
            <h2
              role="button"
              tabIndex={0}
              onClick={handleCherryBlossomClick}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCherryBlossomClick() }}
              className="text-2xl font-bold text-gray-800 cursor-pointer select-none hover:text-rose-600 transition-colors inline-flex items-center gap-2"
            >
              매장 정보
            </h2>
            <div className="flex items-center space-x-4">
              {/* 기본정보 완성도 토글 */}
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${
                  storeCompletionStatus.isAllComplete ? 'text-gray-600' : 'text-red-600'
                }`}>
                  노출 {storeCompletionStatus.isAllComplete ? 'ON' : 'OFF'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowInfoModal(true)}
                  className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${
                    storeCompletionStatus.isAllComplete ? 'bg-blue-500' : 'bg-red-500'
                  }`}
                  title="정보 보기"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${
                      storeCompletionStatus.isAllComplete ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <FiSave className="w-5 h-5" />
                  <span>저장</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                >
                  <FiEdit className="w-5 h-5" />
                  <span>수정</span>
                </button>
              )}
            </div>
          </div>

          {/* 2컬럼 레이아웃 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* 왼쪽: 매장정보 */}
            <div className="space-y-6 h-full flex flex-col">
              {/* 매장 정보 카드 */}
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 flex-1">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">매장 정보</h3>
                </div>
              
              {/* 기본 정보 */}
              <div className="mb-8">
                <h4 className="text-base font-semibold text-gray-800 mb-5 text-blue-600">기본 정보</h4>
                <div className="grid grid-cols-2 gap-5">
                  {/* 대표자명 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2.5">
                      대표자명
                    </label>
                    <p className="text-gray-900 py-3 px-4 bg-gray-50 rounded-lg border border-gray-200 font-medium text-base">{storeInfo.ownerName || '-'}</p>
                  </div>

                  {/* 사업자등록번호 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2.5">
                      사업자등록번호
                    </label>
                    <p className="text-gray-900 py-3 px-4 bg-gray-50 rounded-lg border border-gray-200 font-medium text-base">{storeInfo.businessNumber || '-'}</p>
                  </div>

                  {/* 매장명 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2.5">
                      매장명
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={storeInfo.storeName}
                        onChange={(e) => handleChange('storeName', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:shadow-md transition-all placeholder:text-gray-400 text-gray-900"
                        placeholder="매장명을 입력하세요"
                      />
                    ) : (
                      <p className="text-gray-900 py-3 px-4 bg-gray-50 rounded-lg border border-gray-200 font-medium text-base">{storeInfo.storeName || '-'}</p>
                    )}
                  </div>

                  {/* 매장번호 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2.5">
                      매장 전화번호
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={storeInfo.storeNumber || ''}
                        onChange={(e) => {
                          const formatted = formatStorePhoneNumber(e.target.value)
                          handleChange('storeNumber', formatted)
                        }}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:shadow-md transition-all placeholder:text-gray-400 text-gray-900"
                        placeholder="매장번호를 입력하세요"
                      />
                    ) : (
                      <p className="text-gray-900 py-3 px-4 bg-gray-50 rounded-lg border border-gray-200 font-medium text-base">{storeInfo.storeNumber || '-'}</p>
                    )}
                  </div>

                  {/* 업장구분 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2.5">
                      업장구분
                    </label>
                    <p className="text-gray-900 py-3 px-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 font-medium text-base">{storeInfo.storeType}</p>
                  </div>

                  {/* 플랫폼 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2.5">
                      플랫폼
                    </label>
                    <p className="text-gray-900 py-3 px-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 font-medium text-base">{storeInfo.platform || '미입력'}</p>
                  </div>

                  {/* 주소 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2.5">
                      주소
                    </label>
                    <p className="text-gray-900 py-3 px-4 bg-gray-50 rounded-lg border border-gray-200 font-medium text-base">{storeInfo.address || '-'}</p>
                  </div>

                  {/* 상세주소 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2.5">
                      상세주소
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={storeInfo.detailAddress}
                        onChange={(e) => handleChange('detailAddress', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:shadow-md transition-all placeholder:text-gray-400 text-gray-900"
                        placeholder="상세주소를 입력하세요"
                      />
                    ) : (
                      <p className="text-gray-900 py-3 px-4 bg-gray-50 rounded-lg border border-gray-200 font-medium text-base">{storeInfo.detailAddress || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

        {/* 매장 사진 */}
              <div className="border-t border-gray-200 pt-8 mt-8">
          <div className="flex items-center justify-between mb-5">
              <h4 className="text-base font-semibold text-gray-800 text-blue-600">매장 사진</h4>
            <span className="text-sm text-gray-500">
              {storeInfo.photos.length}/5
            </span>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            disabled={!isEditing || storeInfo.photos.length >= 5}
          />

          <div className="grid grid-cols-5 gap-4">
            {/* 등록된 사진 표시 */}
            {storeInfo.photos.map((photo, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={photo}
                    alt={`매장 사진 ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('이미지 로드 실패:', photo)
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
                {isEditing && (
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    type="button"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            
            {/* 빈 슬롯 표시 (최대 5개까지) */}
            {Array.from({ length: 5 - storeInfo.photos.length }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square">
                {isEditing ? (
                  <button
                    onClick={handleImageClick}
                    className="w-full h-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 hover:shadow-sm transition-all flex flex-col items-center justify-center text-gray-400 hover:text-gray-600"
                    type="button"
                  >
                    <FiCamera className="w-8 h-8 mb-2" />
                    <span className="text-sm">사진 추가</span>
                  </button>
                ) : (
                  <div className="w-full h-full rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300">
                    <FiCamera className="w-8 h-8 mb-2" />
                    <span className="text-xs">빈 슬롯</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          </div>
        </div>
          </div>

            {/* 오른쪽: 운영 정보 */}
            <div className="space-y-6 h-full flex flex-col">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 flex-1">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">운영 정보</h3>
              </div>
              
              {/* 업장정보 */}
              <div className="mb-8">
                <h4 className="text-base font-semibold text-gray-800 mb-5 text-blue-600">업장정보</h4>
                <div className="grid grid-cols-3 gap-5">
                {/* 총 룸 수 */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2.5">
                    총 룸 수
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={storeInfo.totalRooms === 0 ? '' : storeInfo.totalRooms}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '') {
                          handleChange('totalRooms', 0)
                        } else {
                          const numValue = parseInt(value.replace(/[^0-9]/g, ''))
                          if (!isNaN(numValue)) {
                            handleChange('totalRooms', numValue)
                          }
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:shadow-md transition-all placeholder:text-gray-400 text-gray-900"
                      placeholder="0"
                    />
                  ) : (
                    <p className="text-gray-900 py-3 px-4 bg-gray-50 rounded-lg border border-gray-200 font-medium text-base">{storeInfo.totalRooms}개</p>
                  )}
                </div>

                {/* 주차여부 */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2.5">
                    주차여부
                  </label>
                  {isEditing ? (
                    <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-300 w-full">
                      <button
                        type="button"
                        onClick={() => handleChange('parkingAvailable', true)}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                          storeInfo.parkingAvailable
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        가능
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleChange('parkingAvailable', false)
                          handleChange('parkingSpaces', 0)
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                          !storeInfo.parkingAvailable
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        불가
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-900 py-3 px-4 bg-gray-50 rounded-lg border border-gray-200 font-medium text-base">
                      {storeInfo.parkingAvailable ? '가능' : '불가'}
                    </p>
                  )}
                </div>

                {/* 가능대수 */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2.5">
                    가능대수
                  </label>
                  {isEditing && storeInfo.parkingAvailable ? (
                    <input
                      type="text"
                      value={storeInfo.parkingSpaces === 0 ? '' : storeInfo.parkingSpaces}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '') {
                          handleChange('parkingSpaces', 0)
                        } else {
                          const numValue = parseInt(value.replace(/[^0-9]/g, ''))
                          if (!isNaN(numValue)) {
                            handleChange('parkingSpaces', numValue)
                          }
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:shadow-md transition-all placeholder:text-gray-400 text-gray-900"
                      placeholder="0"
                    />
                  ) : isEditing ? (
                    <p className="text-gray-400 py-3 px-4 bg-gray-50 rounded-lg border border-gray-200 font-medium text-base">-</p>
                  ) : (
                    <p className="text-gray-900 py-3 px-4 bg-gray-50 rounded-lg border border-gray-200 font-medium text-base">
                      {storeInfo.parkingAvailable ? (storeInfo.parkingSpaces || 0) : '-'}
                    </p>
                  )}
                </div>

                {/* 한줄소개 - 2열 전체 너비 */}
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-800 mb-2.5">
                    한줄소개
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={storeInfo.oneLineIntro}
                      onChange={(e) => handleChange('oneLineIntro', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:shadow-md transition-all placeholder:text-gray-400 text-gray-900"
                      placeholder="매장을 한 줄로 소개해주세요"
                      maxLength={100}
                    />
                  ) : (
                    <p className="text-gray-900 py-3 px-4 bg-gray-50 rounded-lg border border-gray-200 font-medium text-base">{storeInfo.oneLineIntro || '-'}</p>
                  )}
                </div>
                </div>
              </div>

              {/* 공지사항 - 전체 너비 */}
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-800 mb-2.5">
                  공지사항
                </label>
                {isEditing ? (
                  <textarea
                    value={storeInfo.notice}
                    onChange={(e) => handleChange('notice', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:shadow-md resize-none transition-all placeholder:text-gray-400 text-gray-900"
                    placeholder="공지사항을 입력해주세요"
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-line py-3 px-4 bg-gray-50 rounded-lg border border-gray-200 font-medium text-base min-h-[80px]">{storeInfo.notice || '-'}</p>
                )}
              </div>

              {/* 편의시설 - 전체 너비 */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2.5">
                  편의시설
                </label>
                {isEditing ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {facilityOptions.map((facility) => (
                      <div key={facility} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`facility-${facility}`}
                          checked={storeInfo.facilities?.includes(facility) || false}
                          onChange={() => handleFacilityToggle(facility)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`facility-${facility}`}
                          className="text-sm cursor-pointer text-gray-700"
                        >
                          {facility}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full">
                    {storeInfo.facilities && storeInfo.facilities.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {storeInfo.facilities.map((facility) => (
                          <span
                            key={facility}
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-br from-blue-50 to-blue-100 text-gray-900 rounded-lg border border-blue-200 text-base font-medium"
                          >
                            {facility}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="w-full py-12 px-6 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p className="text-gray-400 text-sm font-normal">등록된 시설 정보가 없습니다</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

          {/* 가격관리 - 전체 너비 */}
          <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-8 w-full">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">가격관리</h3>
              <p className="text-sm text-gray-500">게임, 식음료, 골프용품의 가격을 관리하세요</p>
            </div>
            
            {/* 탭 */}
            <div className="flex space-x-1 border-b border-gray-200 mb-8 bg-gray-50 rounded-t-lg p-1">
              <button
                type="button"
                onClick={() => setPriceTab('game')}
                className={`flex-1 px-6 py-3 text-sm font-semibold transition-all duration-200 rounded-lg ${
                  priceTab === 'game'
                    ? 'text-white bg-gradient-to-r from-teal-500 to-teal-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                게임
              </button>
              <button
                type="button"
                onClick={() => setPriceTab('food')}
                className={`flex-1 px-6 py-3 text-sm font-semibold transition-all duration-200 rounded-lg ${
                  priceTab === 'food'
                    ? 'text-white bg-gradient-to-r from-teal-500 to-teal-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                식음료
              </button>
              <button
                type="button"
                onClick={() => setPriceTab('golf')}
                className={`flex-1 px-6 py-3 text-sm font-semibold transition-all duration-200 rounded-lg ${
                  priceTab === 'golf'
                    ? 'text-white bg-gradient-to-r from-teal-500 to-teal-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                골프용품
              </button>
            </div>

            {/* 게임 가격 탭 */}
            {priceTab === 'game' && (
              <div className="space-y-8">
                {/* 평일 가격 */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">평일 가격</h4>
                      <p className="text-xs text-gray-500">월요일 ~ 금요일 가격을 설정하세요 <span className="text-base font-bold text-red-600">24시간제로 입력해주세요!!</span></p>
                      <p className="text-xs font-semibold text-blue-800 mt-1">⚠️ 10시 → 아침 10시 / 22시 → 밤 10시 입니다.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {editingPriceId && gamePrices.weekday.some(p => p.id === editingPriceId) && (
                        <button
                          type="button"
                          onClick={handleCancelEditing}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md transition-all duration-200 text-sm font-medium"
                        >
                          <FiX className="w-4 h-4" />
                          <span>취소</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleAddGamePrice('weekday')}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md transition-all duration-200 text-sm font-medium"
                      >
                        <FiPlus className="w-4 h-4" />
                        <span>추가</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePrices}
                        disabled={!hasChanges}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-md transition-all duration-200 text-sm font-medium ${
                          hasChanges
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 cursor-pointer'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <FiSave className="w-4 h-4" />
                        <span>저장</span>
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                          <th className="px-5 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">시간</th>
                          {priceColumns.map((column) => (
                            <th key={column.key} className="px-5 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                              {column.label}
                            </th>
                          ))}
                          <th className="px-5 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">액션</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {gamePrices.weekday.length === 0 ? (
                          <tr>
                            <td colSpan={priceColumns.length + 2} className="px-5 py-12 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                  <FiPlus className="w-6 h-6 text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-500 font-medium">등록된 평일 가격이 없습니다</p>
                                <p className="text-xs text-gray-400 mt-1">위의 추가 버튼을 눌러 가격을 등록하세요</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          gamePrices.weekday.map((price, index) => (
                            <tr key={price.id} className={`hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                              <td className="px-5 py-4 whitespace-nowrap text-center">
                                {editingPriceId === price.id ? (
                                  <div>
                                    {(() => {
                                      const { start, end } = parseTime(price.time || '')
                                      return (
                                        <>
                                          {/* 커스텀 시간 선택 */}
                                          <div className="flex items-center justify-center gap-2">
                                            <input
                                              type="text"
                                              value={start}
                                              onChange={(e) => {
                                                const inputKey = `weekday-${price.id}-start`
                                                const formatted = formatTimeInput(e.target.value, inputKey)
                                                const { end: currentEnd } = parseTime(price.time || '')
                                                handleUpdateGamePrice('weekday', price.id, 'time', formatTime(formatted, currentEnd))
                                              }}
                                              onFocus={() => {
                                                // 포커스 시 편집 모드 유지
                                                if (editingPriceId !== price.id) {
                                                  setEditingPriceId(price.id)
                                                }
                                              }}
                                              placeholder="06:00"
                                              className={`w-24 px-3 py-2 border-2 rounded-lg focus:outline-none text-sm font-medium text-center ${
                                                timeInputErrors[`weekday-${price.id}-start`]
                                                  ? 'border-red-300 focus:border-red-500'
                                                  : 'border-blue-300 focus:border-blue-500'
                                              }`}
                                              autoFocus
                                            />
                                            <span className="text-gray-500 font-medium text-sm">~</span>
                                            <input
                                              type="text"
                                              value={end}
                                              onChange={(e) => {
                                                const inputKey = `weekday-${price.id}-end`
                                                const { start: currentStart } = parseTime(price.time || '')
                                                const formatted = formatTimeInput(e.target.value, inputKey)
                                                handleUpdateGamePrice('weekday', price.id, 'time', formatTime(currentStart, formatted))
                                              }}
                                              onFocus={() => {
                                                // 포커스 시 편집 모드 유지
                                                if (editingPriceId !== price.id) {
                                                  setEditingPriceId(price.id)
                                                }
                                              }}
                                              placeholder="12:00"
                                              className={`w-24 px-3 py-2 border-2 rounded-lg focus:outline-none text-sm font-medium text-center ${
                                                timeInputErrors[`weekday-${price.id}-end`]
                                                  ? 'border-red-300 focus:border-red-500'
                                                  : 'border-blue-300 focus:border-blue-500'
                                              }`}
                                            />
                                          </div>
                                          {(timeInputErrors[`weekday-${price.id}-start`] || timeInputErrors[`weekday-${price.id}-end`]) && (
                                            <p className="text-xs text-red-500 font-medium mt-1 text-center">시간은 30분단위로 설정 가능합니다.</p>
                                          )}
                                        </>
                                      )
                                    })()}
                                  </div>
                                ) : (
                                  <span className="text-sm font-medium text-gray-900 block text-center">
                                    {price.time || <span className="text-gray-400">시간 선택</span>}
                                  </span>
                                )}
                              </td>
                              {priceColumns.map((column) => (
                                <td key={column.key} className="px-5 py-4 whitespace-nowrap text-center">
                                  {editingPriceId === price.id ? (
                                    <input
                                      type="text"
                                      value={formatNumberWithComma(price[column.key] || '')}
                                      onChange={(e) => {
                                        const cleaned = removeComma(e.target.value)
                                        const numValue = cleaned === '' ? '' : (parseInt(cleaned) || '')
                                        handleUpdateGamePrice('weekday', price.id, column.key, numValue)
                                      }}
                                      className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-center"
                                      placeholder="0"
                                    />
                                  ) : (
                                    <span className="text-sm font-semibold text-gray-900 block text-center">
                                      {price[column.key] && price[column.key] !== 0 ? (
                                        <span className="text-blue-600">{Number(price[column.key]).toLocaleString()}원</span>
                                      ) : (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </span>
                                  )}
                                </td>
                              ))}
                              <td className="px-5 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditing('weekday', price.id)}
                                    className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                                    title="수정"
                                  >
                                    <FiEdit className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteGamePrice('weekday', price.id)}
                                    className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                    title="삭제"
                                  >
                                    <FiTrash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 주말, 공휴일 가격 */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">주말, 공휴일 가격</h4>
                      <p className="text-xs text-gray-500">토요일, 일요일, 공휴일 가격을 설정하세요 <span className="text-base font-bold text-red-600">24시간제로 입력해주세요!!</span></p>
                      <p className="text-xs font-semibold text-blue-800 mt-1">⚠️ 10시 → 아침 10시 / 22시 → 밤 10시 입니다.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {editingPriceId && gamePrices.weekend.some(p => p.id === editingPriceId) && (
                        <button
                          type="button"
                          onClick={handleCancelEditing}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md transition-all duration-200 text-sm font-medium"
                        >
                          <FiX className="w-4 h-4" />
                          <span>취소</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleAddGamePrice('weekend')}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md transition-all duration-200 text-sm font-medium"
                      >
                        <FiPlus className="w-4 h-4" />
                        <span>추가</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePrices}
                        disabled={!hasChanges}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-md transition-all duration-200 text-sm font-medium ${
                          hasChanges
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 cursor-pointer'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <FiSave className="w-4 h-4" />
                        <span>저장</span>
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                          <th className="px-5 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">시간</th>
                          {priceColumns.map((column) => (
                            <th key={column.key} className="px-5 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                              {column.label}
                            </th>
                          ))}
                          <th className="px-5 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">액션</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {gamePrices.weekend.length === 0 ? (
                          <tr>
                            <td colSpan={priceColumns.length + 2} className="px-5 py-12 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                  <FiPlus className="w-6 h-6 text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-500 font-medium">등록된 주말/공휴일 가격이 없습니다</p>
                                <p className="text-xs text-gray-400 mt-1">위의 추가 버튼을 눌러 가격을 등록하세요</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          gamePrices.weekend.map((price, index) => (
                            <tr key={price.id} className={`hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                              <td className="px-5 py-4 whitespace-nowrap text-center">
                                {editingPriceId === price.id ? (
                                  <div>
                                    {(() => {
                                      const { start, end } = parseTime(price.time || '')
                                      return (
                                        <>
                                          {/* 커스텀 시간 선택 */}
                                          <div className="flex items-center justify-center gap-2">
                                            <input
                                              type="text"
                                              value={start}
                                              onChange={(e) => {
                                                const inputKey = `weekend-${price.id}-start`
                                                const formatted = formatTimeInput(e.target.value, inputKey)
                                                const { end: currentEnd } = parseTime(price.time || '')
                                                handleUpdateGamePrice('weekend', price.id, 'time', formatTime(formatted, currentEnd))
                                              }}
                                              onFocus={() => {
                                                // 포커스 시 편집 모드 유지
                                                if (editingPriceId !== price.id) {
                                                  setEditingPriceId(price.id)
                                                }
                                              }}
                                              placeholder="06:00"
                                              className={`w-24 px-3 py-2 border-2 rounded-lg focus:outline-none text-sm font-medium text-center ${
                                                timeInputErrors[`weekend-${price.id}-start`]
                                                  ? 'border-red-300 focus:border-red-500'
                                                  : 'border-blue-300 focus:border-blue-500'
                                              }`}
                                              autoFocus
                                            />
                                            <span className="text-gray-500 font-medium text-sm">~</span>
                                            <input
                                              type="text"
                                              value={end}
                                              onChange={(e) => {
                                                const inputKey = `weekend-${price.id}-end`
                                                const { start: currentStart } = parseTime(price.time || '')
                                                const formatted = formatTimeInput(e.target.value, inputKey)
                                                handleUpdateGamePrice('weekend', price.id, 'time', formatTime(currentStart, formatted))
                                              }}
                                              onFocus={() => {
                                                // 포커스 시 편집 모드 유지
                                                if (editingPriceId !== price.id) {
                                                  setEditingPriceId(price.id)
                                                }
                                              }}
                                              placeholder="12:00"
                                              className={`w-24 px-3 py-2 border-2 rounded-lg focus:outline-none text-sm font-medium text-center ${
                                                timeInputErrors[`weekend-${price.id}-end`]
                                                  ? 'border-red-300 focus:border-red-500'
                                                  : 'border-blue-300 focus:border-blue-500'
                                              }`}
                                            />
                                          </div>
                                          {(timeInputErrors[`weekend-${price.id}-start`] || timeInputErrors[`weekend-${price.id}-end`]) && (
                                            <p className="text-xs text-red-500 font-medium mt-1 text-center">시간은 30분단위로 설정 가능합니다.</p>
                                          )}
                                        </>
                                      )
                                    })()}
                                  </div>
                                ) : (
                                  <span className="text-sm font-medium text-gray-900 block text-center">
                                    {price.time || <span className="text-gray-400">시간 선택</span>}
                                  </span>
                                )}
                              </td>
                              {priceColumns.map((column) => (
                                <td key={column.key} className="px-5 py-4 whitespace-nowrap text-center">
                                  {editingPriceId === price.id ? (
                                    <input
                                      type="text"
                                      value={formatNumberWithComma(price[column.key] || '')}
                                      onChange={(e) => {
                                        const cleaned = removeComma(e.target.value)
                                        const numValue = cleaned === '' ? '' : (parseInt(cleaned) || '')
                                        handleUpdateGamePrice('weekend', price.id, column.key, numValue)
                                      }}
                                      className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium text-center"
                                      placeholder="0"
                                    />
                                  ) : (
                                    <span className="text-sm font-semibold text-gray-900 block text-center">
                                      {price[column.key] && price[column.key] !== 0 ? (
                                        <span className="text-blue-600">{Number(price[column.key]).toLocaleString()}원</span>
                                      ) : (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </span>
                                  )}
                                </td>
                              ))}
                              <td className="px-5 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditing('weekend', price.id)}
                                    className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                                    title="수정"
                                  >
                                    <FiEdit className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteGamePrice('weekend', price.id)}
                                    className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                    title="삭제"
                                  >
                                    <FiTrash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 식음료 가격 탭 */}
            {priceTab === 'food' && (
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">식음료 가격</h4>
                    <p className="text-xs text-gray-500">식음료 품목과 가격을 관리하세요</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingPriceId && foodPrices.some(p => p.id === editingPriceId) && (
                      <button
                        type="button"
                        onClick={() => setEditingPriceId(null)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md transition-all duration-200 text-sm font-medium"
                      >
                        <FiX className="w-4 h-4" />
                        <span>취소</span>
                      </button>
                    )}
                  <button
                    type="button"
                    onClick={handleAddFoodPrice}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md transition-all duration-200 text-sm font-medium"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>추가</span>
                  </button>
                    <button
                      type="button"
                      onClick={handleSavePrices}
                      disabled={!hasChanges}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-md transition-all duration-200 text-sm font-medium ${
                        hasChanges
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 cursor-pointer'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <FiSave className="w-4 h-4" />
                      <span>저장</span>
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                        <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">품목명</th>
                        <th className="px-5 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">가격</th>
                        <th className="px-5 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">액션</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {foodPrices.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-5 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <FiPlus className="w-6 h-6 text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-500 font-medium">등록된 식음료 가격이 없습니다</p>
                              <p className="text-xs text-gray-400 mt-1">위의 추가 버튼을 눌러 가격을 등록하세요</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        foodPrices.map((price, index) => (
                          <tr key={price.id} className={`hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                            <td className="px-5 py-4 whitespace-nowrap">
                              {editingPriceId === price.id ? (
                                <input
                                  type="text"
                                  value={price.name}
                                  onChange={(e) => handleUpdateFoodPrice(price.id, 'name', e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium bg-white shadow-sm hover:border-gray-400 transition-colors"
                                  placeholder="품목명을 입력하세요"
                                  autoFocus
                                />
                              ) : (
                                <span className="text-sm font-medium text-gray-900">
                                  {price.name || <span className="text-gray-400">품목명 입력</span>}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-center">
                              {editingPriceId === price.id ? (
                                <input
                                  type="text"
                                  value={formatNumberWithComma(price.price || '')}
                                  onChange={(e) => {
                                    const cleaned = removeComma(e.target.value)
                                    const numValue = cleaned === '' ? '' : (parseInt(cleaned) || '')
                                    handleUpdateFoodPrice(price.id, 'price', numValue)
                                  }}
                                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium bg-white shadow-sm hover:border-gray-400 transition-colors text-center"
                                  placeholder="0"
                                />
                              ) : (
                                <span className="text-sm font-semibold text-gray-900 block text-center">
                                  {price.price && price.price !== 0 ? (
                                    <span className="text-blue-600">{Number(price.price).toLocaleString()}원</span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingPriceId(price.id)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                                  title="수정"
                                >
                                  <FiEdit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFoodPrice(price.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                  title="삭제"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 골프용품 가격 탭 */}
            {priceTab === 'golf' && (
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">골프용품 가격</h4>
                    <p className="text-xs text-gray-500">골프용품 품목과 가격을 관리하세요</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingPriceId && golfPrices.some(p => p.id === editingPriceId) && (
                      <button
                        type="button"
                        onClick={() => setEditingPriceId(null)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md transition-all duration-200 text-sm font-medium"
                      >
                        <FiX className="w-4 h-4" />
                        <span>취소</span>
                      </button>
                    )}
                  <button
                    type="button"
                    onClick={handleAddGolfPrice}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md transition-all duration-200 text-sm font-medium"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>추가</span>
                  </button>
                    <button
                      type="button"
                      onClick={handleSavePrices}
                      disabled={!hasChanges}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-md transition-all duration-200 text-sm font-medium ${
                        hasChanges
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 cursor-pointer'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <FiSave className="w-4 h-4" />
                      <span>저장</span>
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                        <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">품목명</th>
                        <th className="px-5 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">가격</th>
                        <th className="px-5 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">액션</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {golfPrices.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-5 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <FiPlus className="w-6 h-6 text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-500 font-medium">등록된 골프용품 가격이 없습니다</p>
                              <p className="text-xs text-gray-400 mt-1">위의 추가 버튼을 눌러 가격을 등록하세요</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        golfPrices.map((price, index) => (
                          <tr key={price.id} className={`hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                            <td className="px-5 py-4 whitespace-nowrap">
                              {editingPriceId === price.id ? (
                                <input
                                  type="text"
                                  value={price.name}
                                  onChange={(e) => handleUpdateGolfPrice(price.id, 'name', e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium bg-white shadow-sm hover:border-gray-400 transition-colors"
                                  placeholder="품목명을 입력하세요"
                                  autoFocus
                                />
                              ) : (
                                <span className="text-sm font-medium text-gray-900">
                                  {price.name || <span className="text-gray-400">품목명 입력</span>}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-center">
                              {editingPriceId === price.id ? (
                                <input
                                  type="text"
                                  value={formatNumberWithComma(price.price || '')}
                                  onChange={(e) => {
                                    const cleaned = removeComma(e.target.value)
                                    const numValue = cleaned === '' ? '' : (parseInt(cleaned) || '')
                                    handleUpdateGolfPrice(price.id, 'price', numValue)
                                  }}
                                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium bg-white shadow-sm hover:border-gray-400 transition-colors text-center"
                                  placeholder="0"
                                />
                              ) : (
                                <span className="text-sm font-semibold text-gray-900 block text-center">
                                  {price.price && price.price !== 0 ? (
                                    <span className="text-blue-600">{Number(price.price).toLocaleString()}원</span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingPriceId(price.id)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                                  title="수정"
                                >
                                  <FiEdit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGolfPrice(price.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                  title="삭제"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* 정보 모달 */}
        {showInfoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowInfoModal(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-gray-900">매장 정보 완성도 안내</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInfoModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">필수 항목</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>매장 전화번호</li>
                    <li>총 룸수</li>
                    <li>주차여부 (가능/불가능 선택)</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    위 항목만 입력하면 ON 상태가 됩니다. 매장 정보의 다른 항목들은 자동으로 받아오는 정보입니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 저장 성공 팝업 */}
        {showSavePopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSavePopup(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4">
                <div className="text-base text-gray-900 whitespace-pre-line">{saveMessage}</div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSavePopup(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full border border-blue-500 hover:bg-blue-700 transition-colors"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
