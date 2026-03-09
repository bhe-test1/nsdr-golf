'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

// React Strict Mode에서 effect 이중 실행 시 push() 한 번만 호출하도록 디바운스
let pushScheduledFluid = false
function schedulePushFluid(fn: () => void) {
  if (pushScheduledFluid) return
  pushScheduledFluid = true
  fn()
  const t = setTimeout(() => {
    pushScheduledFluid = false
    clearTimeout(t)
  }, 50)
}

/**
 * Google AdSense 플루이드(피드형) 광고 유닛
 * 콘텐츠 피드 내·시작·끝에 배치 (높이는 가변적으로 두기)
 */
export default function AdSenseFluid() {
  const insRef = useRef<HTMLModElement>(null)

  useEffect(() => {
    const el = insRef.current
    if (!el) return
    if (el.children.length > 0) return

    schedulePushFluid(() => {
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch (e) {
        console.error(e)
      }
    })
  }, [])

  return (
    <ins
      ref={insRef}
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-format="fluid"
      data-ad-layout-key="-g7+s-1a-fv+xs"
      data-ad-client="ca-pub-2179728846678072"
      data-ad-slot="5323527448"
    />
  )
}
