'use client'

import { useState, useEffect } from 'react'
import { FiX, FiChevronLeft, FiChevronRight, FiZoomIn, FiZoomOut } from 'react-icons/fi'
import Image from 'next/image'

interface ImageViewerProps {
  images: string[]
  initialIndex?: number
  isOpen: boolean
  onClose: () => void
  storeName?: string
}

export default function ImageViewer({ 
  images, 
  initialIndex = 0, 
  isOpen, 
  onClose,
  storeName = ''
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isZoomDragging, setIsZoomDragging] = useState(false)
  const [zoomDragStart, setZoomDragStart] = useState({ x: 0, y: 0, zoom: 1 })

  useEffect(() => {
    setCurrentIndex(initialIndex)
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }, [initialIndex, isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
        setZoom(1)
        setPosition({ x: 0, y: 0 })
      } else if (e.key === 'ArrowRight' && images.length > 1) {
        setCurrentIndex((prev) => (prev + 1) % images.length)
        setZoom(1)
        setPosition({ x: 0, y: 0 })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, images.length, onClose])

  if (!isOpen || images.length === 0) return null

  const currentImage = images[currentIndex]

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.5, 1)
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 })
      }
      return newZoom
    })
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom((prev) => {
      const newZoom = Math.max(1, Math.min(3, prev + delta))
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 })
      }
      return newZoom
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // Shift 키를 누른 상태에서 드래그하면 확대/축소
    if (e.shiftKey) {
      setIsZoomDragging(true)
      setZoomDragStart({ 
        x: e.clientX, 
        y: e.clientY, 
        zoom: zoom 
      })
    } else if (zoom > 1) {
      // 일반 드래그는 이미지 이동
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isZoomDragging) {
      // 드래그 거리에 따라 확대/축소
      const deltaY = zoomDragStart.y - e.clientY
      const zoomDelta = deltaY * 0.01 // 드래그 거리에 비례하여 확대/축소
      const newZoom = Math.max(1, Math.min(3, zoomDragStart.zoom + zoomDelta))
      setZoom(newZoom)
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 })
      }
    } else if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsZoomDragging(false)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 검정 오버레이: 이 영역 클릭 시 닫힘 */}
      <div
        className="absolute inset-0 bg-black/95"
        onClick={onClose}
        aria-hidden
      />
      {/* 닫기 버튼 - 배경 위에 표시 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[100] p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all pointer-events-auto"
        aria-label="닫기"
      >
        <FiX className="w-6 h-6" />
      </button>

      {/* 이미지 컨테이너: 클릭이 배경으로 전달되지 않도록 처리 */}
      <div
        className="relative w-full h-full flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="relative max-w-full max-h-full pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
        {/* 이전 버튼 */}
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all"
            aria-label="이전 이미지"
          >
            <FiChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* 이미지 */}
        <div
          className="relative max-w-full max-h-full"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
        >
          <Image
            src={currentImage}
            alt={storeName ? `${storeName} 매장 사진 ${currentIndex + 1}` : `이미지 ${currentIndex + 1}`}
            width={1200}
            height={800}
            className="max-w-full max-h-[90vh] object-contain"
            unoptimized
            priority
          />
        </div>

        {/* 다음 버튼 */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all"
            aria-label="다음 이미지"
          >
            <FiChevronRight className="w-6 h-6" />
          </button>
        )}
        </div>
      </div>

      {/* 하단 컨트롤 - 클릭 시 닫히지 않도록 */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-black/50 rounded-full px-4 py-2 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 줌 컨트롤 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 text-white hover:bg-white/20 rounded-full transition"
            aria-label="줌 아웃"
          >
            <FiZoomOut className="w-5 h-5" />
          </button>
          <span className="text-white text-sm min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 text-white hover:bg-white/20 rounded-full transition"
            aria-label="줌 인"
          >
            <FiZoomIn className="w-5 h-5" />
          </button>
        </div>

        {/* 닫기 버튼 */}
        <div className="w-px h-6 bg-white/30"></div>
        <button
          onClick={onClose}
          className="p-2 bg-[#00ACEE] hover:bg-[#0088c2] rounded-full transition"
          aria-label="닫기"
        >
          <FiX className="w-5 h-5 text-white" />
        </button>

        {/* 이미지 인디케이터 */}
        {images.length > 1 && (
          <>
            <div className="w-px h-6 bg-white/30"></div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">
                {currentIndex + 1} / {images.length}
              </span>
              <div className="flex gap-1.5">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index)
                      setZoom(1)
                      setPosition({ x: 0, y: 0 })
                    }}
                    className={`w-2 h-2 rounded-full transition ${
                      index === currentIndex
                        ? 'bg-white w-6'
                        : 'bg-white/50 hover:bg-white/70'
                    }`}
                    aria-label={`이미지 ${index + 1}로 이동`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

