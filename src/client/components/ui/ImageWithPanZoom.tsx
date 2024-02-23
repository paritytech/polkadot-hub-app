import React, { useEffect, useRef, useState } from 'react'
import { cn } from '#client/utils'
//@ts-ignore
import { PanZoom, OnStateChangeData } from 'react-easy-panzoom'

type ImageWithPanZoomProps = {
  src: string
  alt: string
  className?: string
  initialStartPosition?: { x: number; y: number }
  imageOverlayMappingFn: (scale: number) => Array<React.ReactNode>
  containerClassName?: string
}

export const ImageWithPanZoom = ({
  src,
  alt,
  initialStartPosition = { x: 0, y: 0 },
  imageOverlayMappingFn,
  className,
  containerClassName,
}: ImageWithPanZoomProps) => {
  const [imgScale, setImgScale] = useState(1)
  const containerRef = useRef(null)
  const imageRef = useRef(null)
  const panZoomRef = useRef(null)

  const [point, setPoint] = useState(initialStartPosition)

  useEffect(() => {
    if (
      point.x !== initialStartPosition.x * imgScale &&
      point.y !== initialStartPosition.y * imgScale
    ) {
      setPoint({
        x: initialStartPosition.x * imgScale,
        y: initialStartPosition.y * imgScale,
      })
      panZoomRef?.current?.autoCenter()
    }
  }, [initialStartPosition])

  return (
    <div
      ref={containerRef}
      className={cn(
        'overflow-hidden relative w-full h-full sm:h-auto rounded-sm',
        containerClassName
      )}
    >
      <PanZoom
        enableBoundingBox
        maxZoom={2}
        minZoom={1}
        autoCenterZoomLevel={2}
        onStateChange={(data: OnStateChangeData) => setImgScale(data.scale)}
        ref={panZoomRef}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className={cn('max-w-none h-auto', className)}
        />
        <div className="absolute top-0 left-0 w-full h-full">
          {/*  passing scale so we can do reverse scaling on the mapped points */}
          {imageOverlayMappingFn(imgScale)}
        </div>
      </PanZoom>
    </div>
  )
}
