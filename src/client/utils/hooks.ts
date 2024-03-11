import React, { MutableRefObject, useEffect, useMemo, useState } from 'react'
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

const LOADED_SCRIPTS: Record<
  string,
  { loaded: boolean; subscribers: Function[] }
> = {}

function loadScript(src: string, callback: () => void) {
  const entry = LOADED_SCRIPTS[src]
  if (entry) {
    if (entry.loaded) {
      callback()
    } else {
      entry.subscribers.push(callback)
    }
  } else {
    LOADED_SCRIPTS[src] = {
      loaded: false,
      subscribers: [callback],
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => {
      LOADED_SCRIPTS[src].loaded = true
      LOADED_SCRIPTS[src].subscribers.forEach((cb) => cb())
    }
    document.body.appendChild(script)
  }
}

export function useExternalScript(src: string, cb: () => void) {
  const [loaded, setLoaded] = useState(LOADED_SCRIPTS[src]?.loaded || false)
  useEffect(() => {
    const callback = () => {
      setLoaded(true)
      cb()
    }
    loadScript(src, callback)
    return () => {
      const entry = LOADED_SCRIPTS[src]
      if (entry) {
        entry.subscribers = entry.subscribers.filter((cb) => cb !== callback)
      }
    }
  }, [src, cb])
  return loaded
}

export function useResizeObserver(
  ref: React.RefObject<HTMLElement>,
  cb: (entry: ResizeObserverEntry) => void
) {
  return React.useEffect(() => {
    const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      cb(entries[0])
    })
    if (ref.current) {
      observer.observe(ref.current)
    }
    return () => {
      observer.disconnect()
    }
  }, [ref, cb])
}
