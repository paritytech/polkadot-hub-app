import React, { useRef, useState } from 'react'
import { cn } from '#client/utils'
//@ts-ignore
import { PanZoom, OnStateChangeData } from 'react-easy-panzoom'

type ImageWithPanZoomProps = {
  src: string
  alt: string
  className?: string
  imageOverlayMappingFn: (scale: number) => Array<React.ReactNode>
  containerClassName?: string
}

export const ImageWithPanZoom = ({
  src,
  alt,
  imageOverlayMappingFn,
  className,
  containerClassName,
}: ImageWithPanZoomProps) => {
  const [imgScale, setImgScale] = useState(1)
  const containerRef = useRef(null)
  const imageRef = useRef(null)

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
      >
        <div className="transition-transform touch-none relative">
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
        </div>
      </PanZoom>
    </div>
  )
}
