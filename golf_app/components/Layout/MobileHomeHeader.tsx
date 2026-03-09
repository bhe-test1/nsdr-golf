'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function MobileHomeHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[#3952B6] shadow-lg border-b border-white/10">
      <div className="w-full pl-4 pr-5 flex items-center h-14">
        {/* 로고 - 부킹맨 */}
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/logo_bookingman.png"
            alt="부킹맨"
            width={104}
            height={32}
            className="h-8 w-auto object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
            style={{ width: 'auto', height: 'auto' }}
            priority
          />
        </Link>
        {/* powered by NSDR - 오른쪽 끝으로 배치 */}
        <div className="flex items-center shrink-0 ml-auto mr-0">
          <Image src="/icon_top.png" alt="powered by NSDR" width={56} height={14} className="h-3.5 w-auto object-contain" style={{ width: 'auto', height: 'auto' }} />
        </div>
      </div>
    </header>
  )
}
