import PromotionBanners from '@/components/Home/PromotionBanners'
import DateSelector from '@/components/Home/DateSelector'
import TimeFilters from '@/components/Home/TimeFilters'
import SearchBar from '@/components/Shopping/SearchBar'
import RegionList from '@/components/Home/RegionList'

export default function ShoppingPage() {
  return (
    <div className="bg-white min-h-screen">
      <PromotionBanners />
      <DateSelector />
      <TimeFilters />
      <SearchBar />
      <RegionList />
    </div>
  )
}

