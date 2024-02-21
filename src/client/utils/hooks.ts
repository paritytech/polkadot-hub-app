import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import config from '#client/config'

export function useDebounce(value: any, delay: number = 1e3) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  return debouncedValue
}

export function useOnClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: (ev: any) => void
) {
  useEffect(() => {
    const listener = (event: any) => {
      if (!ref?.current || ref.current.contains(event.target)) {
        return
      }
      handler(event)
    }
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}

type WebSocketMessage = { event: string; data?: unknown }
export function useWebsoket(
  path: string,
  onMessage?: (message: WebSocketMessage) => void
) {
  let conn: WebSocket | null = null
  useEffect(() => {
    if (conn) {
      conn.close()
    }
    // FIXME:
    const host = config.appHost
      .replace(/https:\/\//, 'wss://')
      .replace(/http:\/\//, 'ws://')
    const uri = host + path
    conn = new WebSocket(uri)
    console.log(`Creating WebSocket connection: ${uri}`)
    if (onMessage) {
      conn.onmessage = (event) => {
        try {
          onMessage(JSON.parse(event.data))
        } catch (err) {
          console.error(`Can't parse WebSocket message event`, err)
        }
      }
    }
    return () => {
      conn?.close()
    }
  }, [path])
}

export function useOffice(officeId: string) {
  return useMemo(() => {
    return (config.offices || []).find((x) => x.id === officeId) || null
  }, [officeId])
}

export function useFocusInputHotkey(cb: () => void) {
  const onHotKey = React.useCallback(
    (ev: KeyboardEvent) => {
      if (ev.key === '/' || ev.key === '.') {
        const activeEl = document.activeElement
        if (activeEl && ['INPUT', 'TEXTAREA'].includes(activeEl.tagName)) {
          return
        }
        cb()
      }
    },
    [cb]
  )
  React.useEffect(() => {
    window.addEventListener('keyup', onHotKey)
    return () => window.removeEventListener('keyup', onHotKey)
  }, [])
}

export function useDocumentTitle(title: string, omitPrefix: boolean = false) {
  useEffect(() => {
    document.title = omitPrefix ? title : `${title} • ${config.appName}`
    return () => {
      document.title = config.appName
    }
  }, [omitPrefix, title])
}

export function useLockScroll() {
  React.useLayoutEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    // prevent scrolling on mount
    document.body.style.overflow = 'hidden'
    // re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])
}

export function useIntersectionObserver(
  options: any = {}
): [MutableRefObject<any>, IntersectionObserverEntry] {
  const { threshold = 1, root = null, rootMargin = '0%' } = options
  const ref = React.useRef(null)
  const [entry, setEntry] = React.useState<IntersectionObserverEntry>()
  React.useEffect(() => {
    const node = ref?.current
    if (!node || typeof IntersectionObserver !== 'function') {
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry)
      },
      { threshold, root, rootMargin }
    )
    observer.observe(node)
    return () => {
      setEntry(undefined)
      observer.disconnect()
    }
  }, [threshold, root, rootMargin])
  return [ref, entry!]
}

const MAX_ZOOM = 2.5

export function usePanZoom(
  containerRef: React.RefObject<HTMLInputElement>,
  imageRef: React.RefObject<HTMLInputElement>,
  initialPosition: { x: number; y: number } = { x: 0, y: 0 },
  initialScale: number = 1
): {
  position: { x: number; y: number }
  scale: number
  handleTouchStart: React.TouchEventHandler<HTMLDivElement>
  handleTouchMove: React.TouchEventHandler<HTMLDivElement>
  handleTouchEnd: React.TouchEventHandler<HTMLDivElement>
  handleWheel: React.WheelEventHandler<HTMLDivElement>
  resetScale: () => void
} {
  const [isPanning, setIsPanning] = useState(false)
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState(initialPosition)
  const [scale, setScale] = useState(initialScale)
  const [containerDimension, setContainerDimensions] = useState({
    height: 0,
    width: 0,
  })
  const [imageDimensions, setImageDimensions] = useState({
    height: 0,
    width: 0,
  })
  const [initialPinchDistance, setInitialPinchDistance] = useState(0)

  const getDistanceBetweenTouches = (touches) => {
    const touch1 = touches[0]
    const touch2 = touches[1]
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }

  useEffect(() => {
    if (containerRef.current && imageRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      setContainerDimensions({
        height: containerRect.height,
        width: containerRect.width,
      })
      setImageDimensions({
        height: imageRef.current.height * scale,
        width: imageRef.current.width * scale,
      })
    }
  }, [containerRef, imageRef.current, scale])

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      if (event.touches.length === 1) {
        const touch = event.touches[0]
        setTouchStart({
          x: touch.clientX,
          y: touch.clientY,
        })
        setIsPanning(true)
      } else if (event.touches.length === 2) {
        const distance = getDistanceBetweenTouches(event.touches)
        setInitialPinchDistance(distance)
      }
    },
    []
  )

  const updatePositionWithinBounds = (newX: number, newY: number) => {
    const xBoundaryRight = containerDimension.width
    const xBoundaryLeft = -imageDimensions.width
    const yBoundaryBottom = containerDimension.height
    const yBoundaryTop = -imageDimensions.height

    const outOfViewX = newX > xBoundaryRight || newX < xBoundaryLeft
    const outOfViewY = newY > yBoundaryBottom || newY < yBoundaryTop
    const outOfView = outOfViewX || outOfViewY

    const newPosition = outOfView
      ? initialPosition
      : {
          x: Math.min(Math.max(newX, xBoundaryLeft), xBoundaryRight),
          y: Math.min(Math.max(newY, yBoundaryTop), yBoundaryBottom),
        }

    return {
      newPosition: newPosition,
      outOfView: outOfView,
    }
  }

  const resetScale = () => {
    setScale(1)
    setPosition(initialPosition)
    positionRef.current = initialPosition
  }
  const positionRef = useRef(position)

  const handleTouchMove: React.TouchEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      if (isPanning && event.touches.length === 1) {
        event.preventDefault()
        const touch = event.touches[0]
        const deltaX = touch.clientX - touchStart.x
        const deltaY = touch.clientY - touchStart.y

        const newTouchStart = {
          x: touch.clientX,
          y: touch.clientY,
        }
        setTouchStart(newTouchStart)

        const newPosition = {
          x: positionRef.current.x + deltaX,
          y: positionRef.current.y + deltaY,
        }
        positionRef.current = newPosition

        requestAnimationFrame(() => {
          setPosition(newPosition)
        })
      }

      if (event.touches.length === 2) {
        event.preventDefault()
        const distance = getDistanceBetweenTouches(event.touches)
        if (initialPinchDistance != null) {
          const scaleChange = distance / initialPinchDistance
          setScale((prevScale) => {
            const newScale = prevScale * scaleChange
            return Math.max(1, newScale < MAX_ZOOM ? newScale : MAX_ZOOM)
          })
          setInitialPinchDistance(distance)
        }
      }
    },
    [isPanning, touchStart, initialPinchDistance]
  )

  const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> =
    useCallback(() => {
      setIsPanning(false)

      const newPosition = {
        x: positionRef.current.x,
        y: positionRef.current.y,
      }
      setPosition(newPosition)
    }, [positionRef])

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      event.preventDefault()
      const scaleAdjustment = event.deltaY > 0 ? 0.9 : 1.1
      setScale((prevScale) => {
        const newScale = prevScale * scaleAdjustment
        return Math.max(1, newScale < MAX_ZOOM ? newScale : MAX_ZOOM)
      })
    },
    []
  )

  return {
    position,
    scale,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
    resetScale,
  }
}
