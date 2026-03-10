// Store 타입 정의
export interface Store {
  id: string
  name: string
  location: string
  latitude?: number | null
  longitude?: number | null
  imageUrl?: string | null
  price?: number | null
  rating?: number | null
  reviewCount?: number | null
  description?: string | null
  news?: string | null
  notice?: string | null
  parking?: string | null
  type?: string | null
  facilities?: string[]
  totalRooms?: number
  platform?: string
  businessNumber?: string
  openDate?: string
  phone?: string
}

