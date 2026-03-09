'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { FiSearch, FiMapPin, FiChevronDown, FiCamera, FiStar } from 'react-icons/fi'
import Image from 'next/image'
import DynamicNaverMap from './DynamicNaverMap'
import StoreDetailModal from './StoreDetailModal'
import ImageViewer from '@/components/Common/ImageViewer'
import type { Store } from '@/lib/types'

interface MapViewProps {
  mobileRegion?: string | null
  /** URL 쿼리 tab과 연동 (모바일 하단바용) */
  initialTab?: string
}

const VALID_TABS = ['screen', 'range', 'field'] as const

export default function MapView({ mobileRegion, initialTab }: MapViewProps = {}) {
  const [selectedTab, setSelectedTab] = useState(() =>
    initialTab && VALID_TABS.includes(initialTab as any) ? initialTab : 'screen'
  )
  const [location, setLocation] = useState<string | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [filter, setFilter] = useState('전체')
  const [searchQuery, setSearchQuery] = useState('')
  const [isFavoritesActive, setIsFavoritesActive] = useState(false)
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const locationRef = useRef<HTMLDivElement>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [viewerImages, setViewerImages] = useState<string[]>([])
  const [viewerStoreName, setViewerStoreName] = useState('')
  const storeCacheRef = useRef<Map<string, Store>>(new Map())
  const detailDataCacheRef = useRef<Map<string, { storeInfo: any; availabilityData: any; priceData: any }>>(new Map())
  const [initialDetailData, setInitialDetailData] = useState<{
    storeInfo: any
    availabilityData: { images: string[]; timeSlots: string[]; rooms: string[]; availability: Record<string, boolean> }
    priceData: { gamePrices: any; foodPrices: any; golfPrices: any[] }
  } | null>(null)
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set())

  // URL 쿼리 tab과 동기화 (모바일 하단바 탭 전환)
  useEffect(() => {
    if (initialTab && VALID_TABS.includes(initialTab as any)) {
      setSelectedTab(initialTab)
    }
  }, [initialTab])

  const regions = [
    '서울', '경기', '인천', '부산',
    '대구', '광주', '대전', '울산',
    '강원', '경남', '경북', '전남',
    '전북', '충남', '충북', '세종',
    '제주'
  ]

  const districtsByRegion: Record<string, string[]> = {
    '서울': [
      '강남구', '강동구', '강북구', '강서구',
      '관악구', '광진구', '구로구', '금천구',
      '노원구', '도봉구', '동대문구', '동작구',
      '마포구', '서대문구', '서초구', '성동구',
      '성북구', '송파구', '양천구', '영등포구',
      '용산구', '은평구', '종로구', '중구',
      '중랑구'
    ],
    '경기': ['수원시', '성남시', '고양시', '용인시', '부천시', '안산시', '안양시', '남양주시', '화성시', '평택시', '의정부시', '시흥시', '김포시', '광명시', '광주시', '군포시', '하남시', '오산시', '이천시', '안성시', '구리시', '의왕시', '포천시', '양주시', '동두천시', '과천시', '가평군', '양평군', '연천군'],
    '인천': ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'],
    '부산': ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'],
    '대구': ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군'],
    '광주': ['동구', '서구', '남구', '북구', '광산구'],
    '대전': ['동구', '중구', '서구', '유성구', '대덕구'],
    '울산': ['중구', '남구', '동구', '북구', '울주군'],
    '강원': ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'],
    '경남': ['창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'],
    '경북': ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '군위군', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'],
    '전남': ['목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'],
    '전북': ['전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'],
    '충남': ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'],
    '충북': ['청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'],
    '세종': ['세종시'],
    '제주': ['제주시', '서귀포시']
  }

  const currentDistricts = location ? (districtsByRegion[location] || []).sort((a, b) => 
    a.localeCompare(b, 'ko')
  ) : []

  // 지역별 좌표 데이터
  const regionCoordinates: Record<string, { lat: number; lng: number }> = {
    '서울': { lat: 37.5665, lng: 126.9780 },
    '경기': { lat: 37.4138, lng: 127.5183 },
    '인천': { lat: 37.4563, lng: 126.7052 },
    '부산': { lat: 35.1796, lng: 129.0756 },
    '대구': { lat: 35.8714, lng: 128.6014 },
    '광주': { lat: 35.1595, lng: 126.8526 },
    '대전': { lat: 36.3504, lng: 127.3845 },
    '울산': { lat: 35.5384, lng: 129.3114 },
    '강원': { lat: 37.8228, lng: 128.1555 },
    '경남': { lat: 35.4606, lng: 128.2132 },
    '경북': { lat: 36.4919, lng: 128.8889 },
    '전남': { lat: 34.8679, lng: 126.9910 },
    '전북': { lat: 35.7175, lng: 127.1530 },
    '충남': { lat: 36.5184, lng: 126.8000 },
    '충북': { lat: 36.8000, lng: 127.7000 },
    '세종': { lat: 36.4800, lng: 127.2890 },
    '제주': { lat: 33.4996, lng: 126.5312 },
  }

  // 서울 구별 좌표
  const seoulDistrictCoordinates: Record<string, { lat: number; lng: number }> = {
    '강남구': { lat: 37.5172, lng: 127.0473 },
    '강동구': { lat: 37.5301, lng: 127.1238 },
    '강북구': { lat: 37.6398, lng: 127.0256 },
    '강서구': { lat: 37.5509, lng: 126.8495 },
    '관악구': { lat: 37.4784, lng: 126.9516 },
    '광진구': { lat: 37.5385, lng: 127.0826 },
    '구로구': { lat: 37.4954, lng: 126.8874 },
    '금천구': { lat: 37.4519, lng: 126.8959 },
    '노원구': { lat: 37.6542, lng: 127.0568 },
    '도봉구': { lat: 37.6688, lng: 127.0471 },
    '동대문구': { lat: 37.5744, lng: 127.0397 },
    '동작구': { lat: 37.5124, lng: 126.9393 },
    '마포구': { lat: 37.5663, lng: 126.9019 },
    '서대문구': { lat: 37.5791, lng: 126.9368 },
    '서초구': { lat: 37.4837, lng: 127.0324 },
    '성동구': { lat: 37.5633, lng: 127.0366 },
    '성북구': { lat: 37.5894, lng: 127.0167 },
    '송파구': { lat: 37.5145, lng: 127.1058 },
    '양천구': { lat: 37.5171, lng: 126.8663 },
    '영등포구': { lat: 37.5264, lng: 126.8962 },
    '용산구': { lat: 37.5326, lng: 126.9905 },
    '은평구': { lat: 37.6027, lng: 126.9291 },
    '종로구': { lat: 37.5735, lng: 126.9788 },
    '중구': { lat: 37.5640, lng: 126.9970 },
    '중랑구': { lat: 37.6064, lng: 127.0926 },
  }

  // 경기도 시/군별 좌표
  const gyeonggiDistrictCoordinates: Record<string, { lat: number; lng: number }> = {
    '수원시': { lat: 37.2636, lng: 127.0286 },
    '성남시': { lat: 37.4201, lng: 127.1262 },
    '고양시': { lat: 37.6584, lng: 126.8320 },
    '용인시': { lat: 37.2411, lng: 127.1776 },
    '부천시': { lat: 37.5034, lng: 126.7660 },
    '안산시': { lat: 37.3219, lng: 126.8309 },
    '안양시': { lat: 37.3943, lng: 126.9568 },
    '남양주시': { lat: 37.6369, lng: 127.2143 },
    '화성시': { lat: 37.1995, lng: 126.8311 },
    '평택시': { lat: 36.9920, lng: 127.1129 },
    '의정부시': { lat: 37.7381, lng: 127.0477 },
    '시흥시': { lat: 37.3800, lng: 126.8029 },
    '김포시': { lat: 37.6153, lng: 126.7155 },
    '광명시': { lat: 37.4772, lng: 126.8664 },
    '광주시': { lat: 37.4295, lng: 127.2553 },
    '군포시': { lat: 37.3616, lng: 126.9352 },
    '하남시': { lat: 37.5394, lng: 127.2146 },
    '오산시': { lat: 37.1498, lng: 127.0772 },
    '이천시': { lat: 37.2724, lng: 127.4432 },
    '안성시': { lat: 37.0080, lng: 127.2797 },
    '구리시': { lat: 37.5944, lng: 127.1296 },
    '의왕시': { lat: 37.3446, lng: 126.9683 },
    '포천시': { lat: 37.8947, lng: 127.2007 },
    '양주시': { lat: 37.7840, lng: 127.0457 },
    '동두천시': { lat: 37.9034, lng: 127.0606 },
    '과천시': { lat: 37.4292, lng: 126.9878 },
    '가평군': { lat: 37.8314, lng: 127.5105 },
    '양평군': { lat: 37.4914, lng: 127.4874 },
    '연천군': { lat: 38.0968, lng: 127.0756 },
  }

  // 인천시 구별 좌표
  const incheonDistrictCoordinates: Record<string, { lat: number; lng: number }> = {
    '중구': { lat: 37.4739, lng: 126.6210 },
    '동구': { lat: 37.4739, lng: 126.6429 },
    '미추홀구': { lat: 37.4636, lng: 126.6500 },
    '연수구': { lat: 37.4101, lng: 126.6784 },
    '남동구': { lat: 37.4486, lng: 126.7310 },
    '부평구': { lat: 37.4894, lng: 126.7245 },
    '계양구': { lat: 37.5714, lng: 126.7364 },
    '서구': { lat: 37.5457, lng: 126.6764 },
    '강화군': { lat: 37.7464, lng: 126.4858 },
    '옹진군': { lat: 37.4462, lng: 126.6392 },
  }

  // 부산시 구별 좌표
  const busanDistrictCoordinates: Record<string, { lat: number; lng: number }> = {
    '중구': { lat: 35.1028, lng: 129.0332 },
    '서구': { lat: 35.0960, lng: 129.0244 },
    '동구': { lat: 35.1294, lng: 129.0454 },
    '영도구': { lat: 35.0912, lng: 129.0676 },
    '부산진구': { lat: 35.1630, lng: 129.0526 },
    '동래구': { lat: 35.2045, lng: 129.0780 },
    '남구': { lat: 35.1366, lng: 129.0843 },
    '북구': { lat: 35.1972, lng: 129.0124 },
    '해운대구': { lat: 35.1631, lng: 129.1636 },
    '사하구': { lat: 35.1047, lng: 128.9750 },
    '금정구': { lat: 35.2430, lng: 129.0925 },
    '강서구': { lat: 35.2098, lng: 128.9800 },
    '연제구': { lat: 35.1762, lng: 129.0799 },
    '수영구': { lat: 35.1454, lng: 129.1130 },
    '사상구': { lat: 35.1527, lng: 128.9913 },
    '기장군': { lat: 35.2444, lng: 129.2223 },
  }

  // 대구시 구별 좌표
  const daeguDistrictCoordinates: Record<string, { lat: number; lng: number }> = {
    '중구': { lat: 35.8704, lng: 128.5954 },
    '동구': { lat: 35.8866, lng: 128.6353 },
    '서구': { lat: 35.8719, lng: 128.5641 },
    '남구': { lat: 35.8461, lng: 128.5972 },
    '북구': { lat: 35.8857, lng: 128.5828 },
    '수성구': { lat: 35.8581, lng: 128.6306 },
    '달서구': { lat: 35.8294, lng: 128.5281 },
    '달성군': { lat: 35.7746, lng: 128.4306 },
  }

  // 광주시 구별 좌표
  const gwangjuDistrictCoordinates: Record<string, { lat: number; lng: number }> = {
    '동구': { lat: 35.1460, lng: 126.9234 },
    '서구': { lat: 35.1520, lng: 126.8886 },
    '남구': { lat: 35.1366, lng: 126.9066 },
    '북구': { lat: 35.1740, lng: 126.9120 },
    '광산구': { lat: 35.1395, lng: 126.7936 },
  }

  // 대전시 구별 좌표
  const daejeonDistrictCoordinates: Record<string, { lat: number; lng: number }> = {
    '동구': { lat: 36.3446, lng: 127.4586 },
    '중구': { lat: 36.3256, lng: 127.4216 },
    '서구': { lat: 36.3550, lng: 127.3846 },
    '유성구': { lat: 36.3626, lng: 127.3566 },
    '대덕구': { lat: 36.3466, lng: 127.4156 },
  }

  // 울산시 구별 좌표
  const ulsanDistrictCoordinates: Record<string, { lat: number; lng: number }> = {
    '중구': { lat: 35.5704, lng: 129.3324 },
    '남구': { lat: 35.5436, lng: 129.3296 },
    '동구': { lat: 35.5046, lng: 129.4166 },
    '북구': { lat: 35.5826, lng: 129.3616 },
    '울주군': { lat: 35.5346, lng: 129.2416 },
  }

  // 강원도 시/군별 좌표
  const gangwonDistrictCoordinates: Record<string, { lat: number; lng: number }> = {
    '춘천시': { lat: 37.8813, lng: 127.7298 },
    '원주시': { lat: 37.3422, lng: 127.9202 },
    '강릉시': { lat: 37.7519, lng: 128.8761 },
    '동해시': { lat: 37.5247, lng: 129.1142 },
    '태백시': { lat: 37.1641, lng: 128.9856 },
    '속초시': { lat: 38.2070, lng: 128.5918 },
    '삼척시': { lat: 37.4499, lng: 129.1652 },
    '홍천군': { lat: 37.6970, lng: 127.8885 },
    '횡성군': { lat: 37.4917, lng: 127.9850 },
    '영월군': { lat: 37.1838, lng: 128.4617 },
    '평창군': { lat: 37.3703, lng: 128.3900 },
    '정선군': { lat: 37.3807, lng: 128.6608 },
    '철원군': { lat: 38.1466, lng: 127.3132 },
    '화천군': { lat: 38.1044, lng: 127.7082 },
    '양구군': { lat: 38.1098, lng: 127.9892 },
    '인제군': { lat: 38.0697, lng: 128.1706 },
    '고성군': { lat: 38.3779, lng: 128.4676 },
    '양양군': { lat: 38.0754, lng: 128.6191 },
  }

  // 경상남도 시/군별 좌표
  const gyeongnamDistrictCoordinates: Record<string, { lat: number; lng: number }> = {
    '창원시': { lat: 35.2279, lng: 128.6819 },
    '진주시': { lat: 35.1806, lng: 128.1077 },
    '통영시': { lat: 34.8544, lng: 128.4333 },
    '사천시': { lat: 35.0037, lng: 128.0640 },
    '김해시': { lat: 35.2284, lng: 128.8814 },
    '밀양시': { lat: 35.4933, lng: 128.7488 },
    '거제시': { lat: 34.8806, lng: 128.6211 },
    '양산시': { lat: 35.3390, lng: 129.0333 },
    '의령군': { lat: 35.3222, lng: 128.2616 },
    '함안군': { lat: 35.2722, lng: 128.4066 },
    '창녕군': { lat: 35.5444, lng: 128.4922 },
    '고성군': { lat: 34.9730, lng: 128.3236 },
    '남해군': { lat: 34.8375, lng: 127.8925 },
    '하동군': { lat: 35.0675, lng: 127.7511 },
    '산청군': { lat: 35.4153, lng: 127.8733 },
    '함양군': { lat: 35.5203, lng: 127.7253 },
    '거창군': { lat: 35.6867, lng: 127.9097 },
    '합천군': { lat: 35.5664, lng: 128.1658 },
  }

  // 경상북도 시/군별 좌표
  const gyeongbukDistrictCoordinates: Record<string, { lat: number; lng: number }> = {
    '포항시': { lat: 36.0322, lng: 129.3650 },
    '경주시': { lat: 35.8562, lng: 129.2247 },
    '김천시': { lat: 36.1398, lng: 128.1136 },
    '안동시': { lat: 36.5684, lng: 128.7296 },
    '구미시': { lat: 36.1194, lng: 128.3446 },
    '영주시': { lat: 36.8056, lng: 128.6236 },
    '영천시': { lat: 35.9733, lng: 128.9386 },
    '상주시': { lat: 36.4106, lng: 128.1592 },
    '문경시': { lat: 36.5866, lng: 128.1866 },
    '경산시': { lat: 35.8256, lng: 128.7416 },
    '군위군': { lat: 36.2425, lng: 128.5725 },
    '의성군': { lat: 36.3528, lng: 128.6972 },
    '청송군': { lat: 36.4358, lng: 129.0572 },
    '영양군': { lat: 36.6664, lng: 129.1125 },
    '영덕군': { lat: 36.4153, lng: 129.3653 },
    '청도군': { lat: 35.6472, lng: 128.7336 },
    '고령군': { lat: 35.7258, lng: 128.2625 },
    '성주군': { lat: 35.9208, lng: 128.2886 },
    '칠곡군': { lat: 35.9958, lng: 128.4014 },
    '예천군': { lat: 36.6558, lng: 128.4542 },
    '봉화군': { lat: 36.8936, lng: 128.7325 },
    '울진군': { lat: 36.9936, lng: 129.4003 },
    '울릉군': { lat: 37.4844, lng: 130.9056 },
  }

  // 전라남도 시/군별 좌표
  const jeonnamDistrictCoordinates: Record<string, { lat: number; lng: number }> = {
    '목포시': { lat: 34.8118, lng: 126.3922 },
    '여수시': { lat: 34.7604, lng: 127.6622 },
    '순천시': { lat: 34.9506, lng: 127.4872 },
    '나주시': { lat: 35.0163, lng: 126.7108 },
    '광양시': { lat: 34.9404, lng: 127.6956 },
    '담양군': { lat: 35.3214, lng: 126.9886 },
    '곡성군': { lat: 35.2822, lng: 127.2972 },
    '구례군': { lat: 35.2025, lng: 127.4625 },
    '고흥군': { lat: 34.6114, lng: 127.2750 },
    '보성군': { lat: 34.7714, lng: 127.0814 },
    '화순군': { lat: 35.0644, lng: 126.9869 },
    '장흥군': { lat: 34.6814, lng: 126.9069 },
    '강진군': { lat: 34.6414, lng: 126.7672 },
    '해남군': { lat: 34.5736, lng: 126.5986 },
    '영암군': { lat: 34.7958, lng: 126.6969 },
    '무안군': { lat: 34.9903, lng: 126.4814 },
    '함평군': { lat: 35.0664, lng: 126.5169 },
    '영광군': { lat: 35.2753, lng: 126.5114 },
    '장성군': { lat: 35.3019, lng: 126.7847 },
    '완도군': { lat: 34.3114, lng: 126.7550 },
    '진도군': { lat: 34.4869, lng: 126.2625 },
    '신안군': { lat: 34.7897, lng: 126.0986 },
  }

  // 전라북도 시/군별 좌표
  const jeonbukDistrictCoordinates: Record<string, { lat: number; lng: number }> = {
    '전주시': { lat: 35.8242, lng: 127.1480 },
    '군산시': { lat: 35.9676, lng: 126.7364 },
    '익산시': { lat: 35.9483, lng: 126.9575 },
    '정읍시': { lat: 35.5697, lng: 126.8558 },
    '남원시': { lat: 35.4164, lng: 127.3903 },
    '김제시': { lat: 35.8014, lng: 126.8886 },
    '완주군': { lat: 35.9014, lng: 127.1603 },
    '진안군': { lat: 35.7914, lng: 127.4247 },
    '무주군': { lat: 36.0069, lng: 127.6608 },
    '장수군': { lat: 35.6472, lng: 127.5208 },
    '임실군': { lat: 35.6147, lng: 127.2803 },
    '순창군': { lat: 35.3744, lng: 127.1375 },
    '고창군': { lat: 35.4358, lng: 126.7022 },
    '부안군': { lat: 35.7314, lng: 126.7325 },
  }

  // 충청남도 시/군별 좌표
  const chungnamDistrictCoordinates: Record<string, { lat: number; lng: number }> = {
    '천안시': { lat: 36.8151, lng: 127.1139 },
    '공주시': { lat: 36.4467, lng: 127.1197 },
    '보령시': { lat: 36.3336, lng: 126.6125 },
    '아산시': { lat: 36.7847, lng: 127.0042 },
    '서산시': { lat: 36.7847, lng: 126.4503 },
    '논산시': { lat: 36.2064, lng: 127.1003 },
    '계룡시': { lat: 36.2747, lng: 127.2486 },
    '당진시': { lat: 36.8947, lng: 126.6297 },
    '금산군': { lat: 36.1086, lng: 127.4886 },
    '부여군': { lat: 36.2753, lng: 126.9108 },
    '서천군': { lat: 36.0792, lng: 126.6914 },
    '청양군': { lat: 36.4597, lng: 126.8022 },
    '홍성군': { lat: 36.6014, lng: 126.6608 },
    '예산군': { lat: 36.6797, lng: 126.8447 },
    '태안군': { lat: 36.7458, lng: 126.2975 },
  }

  // 충청북도 시/군별 좌표
  const chungbukDistrictCoordinates: Record<string, { lat: number; lng: number }> = {
    '청주시': { lat: 36.6424, lng: 127.4890 },
    '충주시': { lat: 36.9912, lng: 127.9260 },
    '제천시': { lat: 37.1326, lng: 128.1910 },
    '보은군': { lat: 36.4897, lng: 127.7297 },
    '옥천군': { lat: 36.3064, lng: 127.5714 },
    '영동군': { lat: 36.1753, lng: 127.7764 },
    '증평군': { lat: 36.7850, lng: 127.5814 },
    '진천군': { lat: 36.8550, lng: 127.4353 },
    '괴산군': { lat: 36.8086, lng: 127.7864 },
    '음성군': { lat: 36.9364, lng: 127.6903 },
    '단양군': { lat: 36.9847, lng: 128.3653 },
  }

  // 세종시 좌표
  const sejongDistrictCoordinates: Record<string, { lat: number; lng: number }> = {
    '세종시': { lat: 36.4800, lng: 127.2890 },
  }

  // 제주도 시별 좌표
  const jejuDistrictCoordinates: Record<string, { lat: number; lng: number }> = {
    '제주시': { lat: 33.4996, lng: 126.5312 },
    '서귀포시': { lat: 33.2541, lng: 126.5600 },
  }

  // 모든 지역의 시/군별 좌표를 통합한 맵
  const allDistrictCoordinates: Record<string, Record<string, { lat: number; lng: number }>> = {
    '서울': seoulDistrictCoordinates,
    '경기': gyeonggiDistrictCoordinates,
    '인천': incheonDistrictCoordinates,
    '부산': busanDistrictCoordinates,
    '대구': daeguDistrictCoordinates,
    '광주': gwangjuDistrictCoordinates,
    '대전': daejeonDistrictCoordinates,
    '울산': ulsanDistrictCoordinates,
    '강원': gangwonDistrictCoordinates,
    '경남': gyeongnamDistrictCoordinates,
    '경북': gyeongbukDistrictCoordinates,
    '전남': jeonnamDistrictCoordinates,
    '전북': jeonbukDistrictCoordinates,
    '충남': chungnamDistrictCoordinates,
    '충북': chungbukDistrictCoordinates,
    '세종': sejongDistrictCoordinates,
    '제주': jejuDistrictCoordinates,
  }

  // 사용자 현재 위치 가져오기
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation이 지원되지 않습니다.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })
      },
      (error) => {
        console.warn('위치 정보를 가져올 수 없습니다:', error.message)
        // 위치 정보를 가져오지 못해도 기본값 사용
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }, [])

  // 현재 선택된 위치의 좌표 계산 (모바일 상단 지역 선택 우선)
  const getMapCenter = (): { lat: number; lng: number } => {
    if (mobileRegion) {
      return regionCoordinates[mobileRegion] || { lat: 37.4979, lng: 127.0276 }
    }
    // 사용자가 지역을 선택한 경우
    if (location && selectedDistrict) {
      // 지역별 시/군 좌표가 있는 경우 사용
      const regionDistricts = allDistrictCoordinates[location]
      if (regionDistricts && regionDistricts[selectedDistrict]) {
        return regionDistricts[selectedDistrict]
      }
      // 좌표가 없는 경우 지역 중심 좌표 사용
      return regionCoordinates[location] || { lat: 37.4979, lng: 127.0276 }
    }
    if (location) {
      return regionCoordinates[location] || { lat: 37.4979, lng: 127.0276 }
    }
    // 사용자 위치가 있으면 사용자 위치 사용, 없으면 기본값 (강남역)
    return userLocation || { lat: 37.4979, lng: 127.0276 }
  }

  const mapCenter = getMapCenter()

  // geocoder 완료 콜백 메모이제이션
  const handleGeocodeComplete = useCallback((geocodedMarkers: Array<{
    id: string
    name: string
    address: string
    lat: number
    lng: number
  }>) => {
    // geocoder로 변환된 마커들을 기존 마커에 추가
    setStoreMarkers(prev => {
      const existingIds = new Set(prev.map(m => m.id))
      const newMarkers = geocodedMarkers.filter(m => !existingIds.has(m.id))
      return [...prev, ...newMarkers]
    })
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const tabs = [
    { id: 'screen', label: '스크린 골프' },
    { id: 'range', label: '골프연습장' },
    { id: 'field', label: '파크골프' },
  ]

  type FacilityItem = {
    id: string
    name: string
    location: string
    type?: string
    platform?: string
    info?: string
    price: string | null
    image: string
    badges: string[]
    discountRate?: number | string | null
  }

  const [facilities, setFacilities] = useState<FacilityItem[]>([])
  const facilitiesCacheRef = useRef<Record<string, FacilityItem[]>>({})

  const getFacilitiesCacheKey = useCallback((tabId: string) => {
    return `${tabId}-${location ?? ''}-${selectedDistrict ?? ''}`
  }, [location, selectedDistrict])

  // 매장 마커 정보 (좌표 포함)
  const [storeMarkers, setStoreMarkers] = useState<Array<{
    id: string
    name: string
    address: string
    lat: number
    lng: number
  }>>([])
  
  // 좌표가 없는 매장 주소 목록 (geocoder로 변환 필요)
  const [addressesToGeocode, setAddressesToGeocode] = useState<Array<{
    id: string
    name: string
    address: string
  }>>([])

  useEffect(() => {
    const cacheKey = getFacilitiesCacheKey(selectedTab)
    if (cacheKey in facilitiesCacheRef.current) {
      setFacilities(facilitiesCacheRef.current[cacheKey])
    }

    const fetchFacilities = async () => {
      try {
        const params = new URLSearchParams()
        if (selectedTab) params.append('type', selectedTab)
        if (location) params.append('location', location)
        if (selectedDistrict) params.append('district', selectedDistrict)
        
        const response = await fetch(`/api/stores?${params.toString()}`)
        if (response.ok) {
          const stores: Store[] = await response.json()
          console.log('API 응답:', { 
            type: selectedTab, 
            params: params.toString(), 
            storesCount: stores.length,
            stores: stores.map(s => ({ id: s.id, name: s.name, type: s.type, location: s.location }))
          })
          const formattedFacilities: FacilityItem[] = stores.map((store) => {
            // news 필드가 JSON 문자열인 경우 파싱
            let newsData: any = null
            if (store.news) {
              try {
                newsData = typeof store.news === 'string' ? JSON.parse(store.news) : store.news
              } catch (e) {
                // JSON 파싱 실패 시 문자열로 처리
                newsData = store.news
              }
            }
            
            // badges 생성 (news 필드에서 정보 추출)
            const badges: string[] = []
            const newsString = typeof newsData === 'string' ? newsData : JSON.stringify(newsData || '')
            if (newsString.includes('즉시확정')) {
              badges.push('즉시확정')
            }
            if (newsString.includes('할인')) {
              badges.push('할인이용권')
            }
            
            // imageUrl 처리 (콤마로 구분된 여러 이미지일 수 있음)
            let imageUrl = store.imageUrl || ''
            if (imageUrl && imageUrl.includes(',')) {
              // 첫 번째 이미지만 사용
              imageUrl = imageUrl.split(',')[0].trim()
            }
            
            // news 필드에서 platform 추출
            let platform = ''
            if (newsData && typeof newsData === 'object' && newsData !== null) {
              platform = newsData.platform || ''
            }
            
            // news 필드에서 discountRate 추출
            let discountRate: number | string | null = null
            if (newsData && typeof newsData === 'object' && newsData !== null) {
              discountRate = newsData.discountRate || newsData.discount || null
            }
            
            return {
              id: store.id, // 문자열 ID 그대로 사용
              name: store.name,
              location: store.location,
              type: store.type || undefined,
              platform: platform || undefined,
              price: store.price ? `${store.price.toLocaleString()}원` : null,
              image: imageUrl || '/api/placeholder/200/150',
              badges,
              discountRate: discountRate || undefined,
            }
          })
          
          setFacilities(formattedFacilities)
          facilitiesCacheRef.current[cacheKey] = formattedFacilities
          console.log('표시할 매장 수:', formattedFacilities.length)
          
          // 매장 주소를 정제하고 좌표로 변환
          const cleanAddresses = stores.map((store) => {
            // location 필드에서 상세주소 제거 (| 또는 , 이후 부분 제거)
            let cleanAddress = store.location || ''
            if (cleanAddress) {
              // | 또는 , 로 분리하고 첫 번째 부분만 사용
              const parts = cleanAddress.split(/[|,]/).map(part => part.trim()).filter(part => part)
              cleanAddress = parts[0] || cleanAddress
            }
            return {
              id: store.id,
              name: store.name,
              address: cleanAddress,
              // 이미 좌표가 있으면 사용
              latitude: store.latitude,
              longitude: store.longitude,
            }
          })
          
          // 좌표가 이미 있는 마커는 바로 추가
          const markersWithCoords = cleanAddresses
            .filter(item => item.latitude && item.longitude)
            .map(item => ({
              id: item.id,
              name: item.name,
              address: item.address,
              lat: item.latitude!,
              lng: item.longitude!,
            }))
          
          // 좌표가 없는 주소들은 DynamicNaverMap에서 geocoder로 변환
          const addressesWithoutCoords = cleanAddresses
            .filter(item => !item.latitude || !item.longitude)
            .map(item => ({
              id: item.id,
              name: item.name,
              address: item.address,
            }))
          
          // 좌표가 있는 마커는 바로 설정
          setStoreMarkers(markersWithCoords)
          // addressesToGeocode는 내용이 실제로 바뀌었을 때만 업데이트 (무한 루프 방지)
          setAddressesToGeocode(prev => {
            // 이전 배열과 비교하여 실제로 변경된 경우에만 업데이트
            const prevIds = new Set(prev.map(a => a.id))
            const newIds = new Set(addressesWithoutCoords.map(a => a.id))
            
            // ID가 같으면 같은 배열로 간주 (참조 비교 방지)
            if (prevIds.size === newIds.size && 
                [...prevIds].every(id => newIds.has(id))) {
              return prev // 이전 배열 반환 (참조 유지)
            }
            
            return addressesWithoutCoords
          })
        } else {
          const errorText = await response.text()
          console.error('API 오류:', response.status, errorText)
          setStoreMarkers([])
        }
      } catch (error) {
        console.error('매장 목록을 불러오는데 실패했습니다:', error)
        setFacilities([])
        setStoreMarkers([])
      }
    }

    fetchFacilities()
  }, [selectedTab, location, selectedDistrict, getFacilitiesCacheKey])

  const fetchFavorites = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      setFavoriteIds(new Set())
      return
    }
    fetch('/api/favorites', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : [])
      .then((list: { store: { id: string } }[]) => {
        setFavoriteIds(new Set(list.map((f) => f.store.id)))
      })
      .catch(() => setFavoriteIds(new Set()))
  }, [])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  // 필터 적용 (클라이언트 사이드 필터링)
  const filteredFacilities = facilities.filter((facility) => {
    if (filter === '전체') return true
    if (filter === '즉시확정') return facility.badges.includes('즉시확정')
    if (filter === '할인이용권') return facility.badges.includes('할인이용권')
    return true
  })

  // 모바일 목록용: 검색어·즐겨찾기 필터
  const mobileListFacilities = useMemo(() => {
    let list = filteredFacilities
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.location && f.location.toLowerCase().includes(q)) ||
          (f.platform && f.platform.toLowerCase().includes(q))
      )
    }
    if (isFavoritesActive) {
      list = list.filter((f) => favoriteIds.has(f.id))
    }
    return list
  }, [filteredFacilities, searchQuery, isFavoritesActive, favoriteIds])

  const openStoreDetail = useCallback((storeId: string) => {
    const cachedStore = storeCacheRef.current.get(storeId)
    const cachedDetail = detailDataCacheRef.current.get(storeId)
    if (cachedStore && cachedDetail) {
      setSelectedStore(cachedStore)
      setInitialDetailData(cachedDetail)
      setIsModalOpen(true)
      return
    }
    setDetailLoadingId(storeId)
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    Promise.all([
      fetch(`/api/stores/${storeId}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/stores/${storeId}/store-info`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/stores/${storeId}/availability?date=${dateStr}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/stores/${storeId}/price`).then((r) => r.ok ? r.json() : null),
    ])
      .then(([store, storeInfo, availabilityRes, priceRes]) => {
        if (!store) {
          setDetailLoadingId(null)
          return
        }
        storeCacheRef.current.set(storeId, store)
        const availabilityData = {
          images: availabilityRes?.images || [],
          timeSlots: availabilityRes?.timeSlots?.length ? availabilityRes.timeSlots : [],
          rooms: availabilityRes?.rooms?.length ? availabilityRes.rooms : ['1번 방', '2번 방', '3번 방'],
          availability: availabilityRes?.availability || {},
        }
        const priceData = {
          gamePrices: priceRes?.gamePrices || { weekday: [], weekend: [] },
          foodPrices: priceRes?.foodPrices || { weekday: [], weekend: [] },
          golfPrices: priceRes?.golfPrices || [],
        }
        const detailPayload = { storeInfo: storeInfo || null, availabilityData, priceData }
        detailDataCacheRef.current.set(storeId, detailPayload)
        setSelectedStore(store)
        setInitialDetailData(detailPayload)
        setIsModalOpen(true)
      })
      .catch(() => {})
      .finally(() => setDetailLoadingId(null))
  }, [])

  const handleMarkerClick = useCallback((marker: { id: string; name: string; address: string; lat: number; lng: number }) => {
    openStoreDetail(marker.id)
  }, [openStoreDetail])

  return (
    <div className="flex h-full bg-white overflow-hidden relative">
      {/* 왼쪽 사이드바 - 모바일에서는 숨김(홈은 지도만), 데스크톱에서만 표시 */}
      <div className="hidden md:flex w-full md:w-96 lg:w-[420px] border-r border-gray-200 flex-col overflow-hidden relative z-10 bg-white">
        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedTab(tab.id)
                const key = getFacilitiesCacheKey(tab.id)
                if (key in facilitiesCacheRef.current) {
                  setFacilities(facilitiesCacheRef.current[key])
                }
              }}
              className={`flex-1 px-4 py-3.5 text-sm font-semibold transition-[color,background-color,box-shadow] duration-75 relative ${
                selectedTab === tab.id
                  ? 'text-blue-600 bg-sky-50 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              <span className="relative z-10">{tab.label}</span>
              {selectedTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00ACEE] rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* 검색바 */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="relative">
            <input
              type="text"
              placeholder="매장명, 지역명으로 검색하세요"
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-300"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* 지역 선택 및 구 목록 */}
        <div className="px-3 py-2 border-b border-gray-200 bg-white">
          {/* 드롭다운들을 한 줄에 배치 */}
          <div className="flex gap-1.5 mb-2">
            {/* 커스텀 지역 드롭다운 */}
            <div className="flex-[6] relative" ref={locationRef}>
              <button
                type="button"
                onClick={() => setIsLocationOpen(!isLocationOpen)}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#00ACEE] bg-white"
              >
                <span className={!location ? 'text-gray-400' : ''}>
                  {selectedDistrict && location 
                    ? `${location} ${selectedDistrict}` 
                    : location 
                    ? location 
                    : '지역을 선택해주세요'}
                </span>
                <FiChevronDown className={`text-gray-400 transition-transform ${isLocationOpen ? 'rotate-180' : ''}`} />
              </button>
              {isLocationOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-[168px] overflow-y-auto">
                  {/* 지역을 선택해주세요 옵션 */}
                  <button
                    type="button"
                    onClick={() => {
                      setLocation(null)
                      setSelectedDistrict(null)
                      setIsLocationOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-sm text-left transition ${
                      !location ? 'bg-sky-100 text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    지역을 선택해주세요
                  </button>
                  {regions.map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => {
                        setLocation(region)
                        setSelectedDistrict(null)
                        setIsLocationOpen(false)
                      }}
                      className={`w-full px-3 py-2 text-sm text-left transition ${
                        location === region ? 'bg-sky-100 text-blue-600' : 'text-gray-800'
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* 즐겨찾는 매장 버튼 */}
            <button
              type="button"
              onClick={() => setIsFavoritesActive((prev) => !prev)}
              className={`flex-[4] px-2.5 py-1.5 border rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition focus:outline-none ${
                isFavoritesActive
                  ? 'bg-[#00ACEE] border-[#00ACEE] text-white'
                  : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50'
              }`}
            >
              <FiStar className={`w-4 h-4 ${isFavoritesActive ? 'text-white' : 'text-amber-500'}`} />
              즐겨찾는 매장
            </button>
          </div>
          
          {/* 구 목록 그리드 - 하위 지역이 선택되지 않았을 때만 표시 */}
          {currentDistricts.length > 0 && !selectedDistrict && (
            <div className="grid grid-cols-4 gap-2">
              {currentDistricts.map((district) => (
                <button
                  key={district}
                  type="button"
                  onClick={() => setSelectedDistrict(district)}
                  className={`px-3 py-2 text-sm font-medium rounded transition ${
                    selectedDistrict === district
                      ? 'bg-sky-100 text-blue-600'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  {district}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 골프장 목록 */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredFacilities.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">등록된 매장이 없습니다.</p>
              <p className="text-xs mt-1">관리자 앱에서 매장을 등록해주세요.</p>
            </div>
          ) : (
            filteredFacilities.map((facility, index) => (
            <div
              key={facility.id}
              onClick={() => openStoreDetail(facility.id)}
              className="block relative bg-white rounded-2xl border border-gray-200 shadow-md p-3 cursor-pointer transition-all duration-200 mb-3"
            >
              {/* 우측 상단 별표: 클릭 시 색만 채움 (기능 없음) */}
              <div
                className="absolute top-3 right-3 flex-shrink-0 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  setStarredIds((prev) => {
                    const next = new Set(prev)
                    if (next.has(facility.id)) next.delete(facility.id)
                    else next.add(facility.id)
                    return next
                  })
                }}
              >
                <FiStar
                  className={`w-5 h-5 transition-colors ${starredIds.has(facility.id) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
                />
              </div>
              <div className="flex gap-3">
                {/* 이미지 - 클릭/확대 비활성화 */}
                <div className="w-28 h-28 rounded-xl flex-shrink-0 overflow-hidden relative shadow-sm select-none pointer-events-none">
                  {facility.image && facility.image !== '/api/placeholder/200/150' ? (
                    <Image
                      src={facility.image}
                      alt={facility.name}
                      fill
                      priority={index < 4}
                      className="object-cover transition-transform duration-200"
                      unoptimized
                      onError={(e) => {
                        // 이미지 로드 실패 시 기본 이미지로 대체
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          const fallback = document.createElement('div')
                          fallback.className = 'w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center'
                          const icon = document.createElement('div')
                          icon.innerHTML = '<svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>'
                          fallback.appendChild(icon)
                          parent.appendChild(fallback)
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                      <FiCamera className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div className="space-y-2">
                    {/* 카테고리 - 이름표처럼 맨 위에 크게 (플랫폼 표시) */}
                    {facility.platform && (
                      <span className="text-xs text-gray-500">{facility.platform}</span>
                    )}
                    
                    {/* 매장명 */}
                    <h3 className="font-bold text-gray-900 text-lg leading-snug line-clamp-2 tracking-tight">
                      {facility.name}
                    </h3>
                    
                    {/* 위치 */}
                    <div className="flex items-start text-gray-600">
                      <FiMapPin className="mr-1 mt-0.5 flex-shrink-0" />
                      <div className="text-sm leading-relaxed">
                        {facility.location ? (() => {
                          // 파이프(|) 또는 쉼표(,)로 주소와 상세주소 분리
                          // 미리보기에서는 기본 주소만 표시 (상세주소 제외)
                          const parts = facility.location.split(/[|,]/).map(part => part.trim()).filter(part => part)
                          return <div>{parts[0] || facility.location}</div>
                        })() : ''}
                      </div>
                    </div>
                  </div>
                  
                  {/* 가격 */}
                  {facility.price && (
                    <div className="flex items-center justify-end mt-2 pt-2 border-t border-gray-100">
                      {facility.discountRate ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-bold text-red-500">{facility.discountRate}%</span>
                          <span className="text-base font-bold text-gray-900">{facility.price}</span>
                        </div>
                      ) : (
                        <span className="text-base font-bold text-gray-900">{facility.price}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* 모바일: 매장 상세 전체화면 오버레이 (BottomNav 위에 표시되도록 z-[60]) */}
      {isModalOpen && selectedStore && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white md:hidden">
          <StoreDetailModal
            store={selectedStore}
            initialDetailData={initialDetailData}
            onClose={() => {
              setIsModalOpen(false)
              setSelectedStore(null)
              setInitialDetailData(null)
              fetchFavorites()
            }}
          />
        </div>
      )}

      {/* 데스크톱: 상세보기 패널 - 사이드바 바로 오른쪽 (min-h-0으로 스크롤·하단 플로팅바 정상 동작) */}
      {isModalOpen && selectedStore && (
        <div className="w-full md:w-96 lg:w-[420px] min-h-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden relative z-10 hidden md:flex">
          <StoreDetailModal
            store={selectedStore}
            initialDetailData={initialDetailData}
            onClose={() => {
              setIsModalOpen(false)
              setSelectedStore(null)
              setInitialDetailData(null)
              fetchFavorites()
            }}
          />
        </div>
      )}

      {/* 오른쪽 영역 - 모바일은 항상 목록, 데스크톱은 지도 */}
      <div className="flex-1 min-w-0 relative overflow-hidden flex flex-col">
        {/* 모바일 전용: 스크린 골프/골프연습장/파크골프 탭 모두 목록 뷰 (PC처럼) */}
        <div className="md:hidden flex-1 flex flex-col overflow-hidden min-h-0 bg-white">
            <div className="flex-shrink-0 p-3 pb-2 border-b border-gray-100 flex gap-2 items-stretch">
              <div className="relative flex-[7] min-w-0">
                <input
                  type="text"
                  placeholder="매장명, 지역명으로 검색하세요."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-gray-200 focus:ring-0"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              <button
                type="button"
                onClick={() => setIsFavoritesActive((prev) => !prev)}
                className={`flex-[3] min-w-0 px-2 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition ${
                  isFavoritesActive
                    ? 'bg-[#00ACEE] text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <FiStar className={`w-4 h-4 flex-shrink-0 ${isFavoritesActive ? 'text-white' : 'text-amber-500'}`} />
                <span className="truncate">즐겨찾는 매장</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 p-3">
              {mobileListFacilities.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  {isFavoritesActive ? '즐겨찾는 매장이 없습니다.' : '등록된 매장이 없습니다.'}
                </div>
              ) : (
                <ul className="space-y-3">
                  {mobileListFacilities.map((facility, index) => (
                    <li key={facility.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => openStoreDetail(facility.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            openStoreDetail(facility.id)
                          }
                        }}
                        className="w-full text-left bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex gap-3 p-0 active:bg-gray-50 transition cursor-pointer"
                      >
                        <div className="w-24 h-24 flex-shrink-0 relative bg-gray-100">
                          {facility.image && facility.image !== '/api/placeholder/200/150' ? (
                            <Image
                              src={facility.image}
                              alt={facility.name}
                              fill
                              priority={index < 3}
                              className="object-cover"
                              sizes="96px"
                              unoptimized
                              onError={(e) => {
                                const t = e.target as HTMLImageElement
                                t.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FiCamera className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 py-3 pr-3 flex flex-col justify-center">
                          {facility.platform && (
                            <span className="text-xs text-gray-500 block mb-0.5">{facility.platform}</span>
                          )}
                          <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2 mb-1">
                            {facility.name}
                          </h3>
                          <div className="flex items-start gap-1 text-gray-600">
                            <FiMapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span className="text-sm leading-snug line-clamp-2">
                              {facility.location
                                ? facility.location.split(/[|,]/).map((p) => p.trim()).filter(Boolean)[0] || facility.location
                                : '-'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col justify-center pr-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              setStarredIds((prev) => {
                                const next = new Set(prev)
                                if (next.has(facility.id)) next.delete(facility.id)
                                else next.add(facility.id)
                                return next
                              })
                            }}
                            className="p-2 -m-2"
                          >
                            <FiStar
                              className={`w-5 h-5 transition-colors ${
                                starredIds.has(facility.id) || favoriteIds.has(facility.id)
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
        </div>

        {/* 지도: 데스크톱에서만 표시 (모바일은 항상 목록) */}
        <div className="flex-1 min-w-0 relative overflow-hidden hidden md:block">
          <div className="absolute inset-0">
            <DynamicNaverMap
              center={mapCenter}
              zoom={mobileRegion ? 12 : location && selectedDistrict ? 14 : location ? 12 : 15}
              markers={storeMarkers}
              addressesToGeocode={addressesToGeocode}
              onGeocodeComplete={handleGeocodeComplete}
              onMarkerClick={handleMarkerClick}
            />
          </div>
        </div>
      </div>

      {/* 이미지 뷰어 */}
      {isImageViewerOpen && viewerImages.length > 0 && (
        <ImageViewer
          images={viewerImages}
          initialIndex={0}
          isOpen={isImageViewerOpen}
          onClose={() => setIsImageViewerOpen(false)}
          storeName={viewerStoreName}
        />
      )}
    </div>
  )
}

