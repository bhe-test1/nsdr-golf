'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

// React Strict Mode에서 effect 이중 실행 시 push() 한 번만 호출하도록 디바운스
let pushScheduled = false
function schedulePush(fn: () => void) {
  if (pushScheduled) return
  pushScheduled = true
  fn()
  const t = setTimeout(() => {
    pushScheduled = false
    clearTimeout(t)
  }, 50)
}

/**
 * Google AdSense 수평형 디스플레이 광고 유닛
 * 페이지의 body 내 원하는 위치에 배치하여 사용
 */
export default function AdSenseHorizontal() {
  const insRef = useRef<HTMLModElement>(null)

  useEffect(() => {
    const el = insRef.current
    if (!el) return
    if (el.children.length > 0) return

    schedulePush(() => {
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
      data-ad-client="ca-pub-2179728846678072"
      data-ad-slot="8468565534"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}
