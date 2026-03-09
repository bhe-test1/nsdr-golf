import { Suspense } from 'react'
import StoresClient from './StoresClient'

function StoreFiltersFallback() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-32"></div>
      </div>
    </div>
  )
}

export default function StoresPage() {
  return (
    <div className="container mx-auto px-3 md:px-4 pt-0 pb-4 md:pt-2 md:pb-8">
      <h1 className="hidden md:block text-xl md:text-3xl font-bold mb-4 md:mb-6">매장 정보</h1>
      <Suspense fallback={<StoreFiltersFallback />}>
        <StoresClient />
      </Suspense>
    </div>
  )
}

