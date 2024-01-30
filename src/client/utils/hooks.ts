import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
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
      }
    },
    []
  )

  const updatePositionWithinBounds = (newX: number, newY: number) => {
    const boundary = 100
    const xBoundary =
      containerDimension.width -
      boundary * (containerDimension.width / containerDimension.height)
    const yBoundary =
      containerDimension.height -
      boundary * (containerDimension.height / containerDimension.width)
    // a little crotch for now :)
    const indx = scale > 1.5 ? 200 : 50
    const yBoundaryTop = -imageDimensions.height + indx * scale
    return {
      x: newX > 0 ? Math.min(newX, xBoundary) : Math.max(newX, -xBoundary),
      y: newY > 0 ? Math.min(newY, yBoundary) : Math.max(newY, yBoundaryTop),
    }
  }

  const resetScale = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleTouchMove: React.TouchEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      if (isPanning && event.touches.length === 1) {
        const touch = event.touches[0]
        const deltaX = touch.clientX - touchStart.x
        const deltaY = touch.clientY - touchStart.y

        setPosition((prevPosition) => {
          const newX = prevPosition.x + deltaX
          const newY = prevPosition.y + deltaY
          return updatePositionWithinBounds(newX, newY)
        })

        setTouchStart({
          x: touch.clientX,
          y: touch.clientY,
        })
      }
    },
    [isPanning, touchStart]
  )

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false)
  }, [])

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
