'use client'

import { useEffect } from 'react'

const BASE_FONT_SIZE = 16
const SCALE = 1.05

export default function CommunityScaleWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const prev = document.documentElement.style.fontSize
    document.documentElement.style.fontSize = `${BASE_FONT_SIZE * SCALE}px`
    return () => {
      document.documentElement.style.fontSize = prev
    }
  }, [])

  return <>{children}</>
}
