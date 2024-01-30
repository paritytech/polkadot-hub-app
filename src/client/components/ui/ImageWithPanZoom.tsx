import React, { useEffect, useRef, useState } from 'react'
import { cn } from '#client/utils'
import { usePanZoom } from '#client/utils/hooks'

export const ImageWithPanZoom = ({
  src,
  alt,
  imageOverlayElement,
  initialStartPosition = { x: 0, y: 0 },
  initialScale = 1,
  className,
  containerClassName,
}: {
  src: string
  alt: string
  initialStartPosition?: { x: number; y: number }
  initialScale?: number
  className?: string
  imageOverlayElement?: React.ReactNode
  containerClassName?: string
}) => {
  const [start, setStart] = useState(initialStartPosition)
  const containerRef = useRef(null)
  const imageRef = useRef(null)
  const {
    position,
    scale,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
    resetScale,
  } = usePanZoom(containerRef, imageRef, initialStartPosition, initialScale)
  const translateStyle = {
    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
  }
  useEffect(() => {
    if (start.x !== 0 && start.y !== 0) {
      resetScale()
      setStart({ x: 0, y: 0 })
    }
  }, [start, resetScale])

  useEffect(() => {
    if (
      start.x !== initialStartPosition.x &&
      start.y !== initialStartPosition.y
    ) {
      setStart(initialStartPosition)
    }
  }, [initialStartPosition])

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'overflow-hidden relative w-full h-full sm:h-auto',
        containerClassName
      )}
    >
      <div style={translateStyle} className="transition-transform touch-none">
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className={cn('max-w-none h-auto', className)}
        />
        {imageOverlayElement}
      </div>
    </div>
  )
}
