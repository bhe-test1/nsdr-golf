import { Suspense } from 'react'
import HomePageClient from './HomePageClient'

export default function HomePage() {
  return (
    <Suspense fallback={<div className="bg-white h-full min-h-[50vh] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3952B6]" /></div>}>
      <HomePageClient />
    </Suspense>
  )
}
