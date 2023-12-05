import React, { useEffect, useState } from 'react'
import config from '#client/config'
import { cn } from '#client/utils'
import { LoaderSpinner, P } from './..'
import { getMap } from './mapbox'
import { Berlin, Coordinates } from './mapbox/config'

export type EventType = {
  name: keyof mapboxgl.MapLayerEventType | keyof mapboxgl.MapEventType
  target?: string
  action: (mapboxgl: any, map: mapboxgl.Map | null, e?: any) => void
}

type Props = {
  centerPoint: Coordinates | undefined
  zoom: number | undefined
  events?: Array<EventType>
  className?: string
}

const onError = (error: any) =>
  console.error('Error in GeneralMap component', error)

export const Map: React.FC<Props> = ({
  centerPoint = Berlin,
  zoom = 3,
  events = [],
  className,
}) => {
  const mapContainer = React.useRef(null)
  const map = React.useRef<mapboxgl.Map | null>(null)
  const [isMapboxInitialized, setIsMapboxInitialized] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    try {
      if (!config.mapBoxApiKey) {
        console.warn(
          'Warning: MAPBOX API token is not set! The map will not be displayed.'
        )
        return
      }

      if (!window.mapboxgl && !isMapboxInitialized) {
        const script = document.createElement('script')
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.13.0/mapbox-gl.js'
        document.head.appendChild(script)
        const styleLink = document.createElement('link')
        styleLink.setAttribute('rel', 'stylesheet')
        styleLink.setAttribute(
          'href',
          'https://api.mapbox.com/mapbox-gl-js/v2.12.0/mapbox-gl.css'
        )
        document.head.appendChild(styleLink)
        return
      }

      if (centerPoint.length != 2) {
        return
      }
      const mapPoint = new window.mapboxgl.LngLat(
        centerPoint[0],
        centerPoint[1]
      )

      // do not recreate the map
      if (map.current) {
        map.current.jumpTo({ center: mapPoint })
        return
      }

      if (!mapContainer.current) {
        return
      }
      map.current = getMap(window.mapboxgl, mapContainer, mapPoint, zoom)

      events.push({
        name: 'error',
        action: onError,
      })

      events.map((event) => {
        event.target && map.current
          ? map.current?.on(
              event.name,
              event.target,
              (e: typeof window.mapboxgl.MapboxEvent) =>
                event.action(window.mapboxgl, map.current, e)
            )
          : map.current?.on(event.name, () =>
              event.action(window.mapboxgl, map.current)
            )
      })

      return () => {
        events.map((ev: EventType) => map.current?.off(ev.name, ev.action))
      }
    } catch (e) {
      console.error(e)
      setError(e.message)
      return
    }
  }, [centerPoint, isMapboxInitialized, mapContainer])

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (window.mapboxgl) {
        setIsMapboxInitialized(true)
        clearInterval(intervalId)
        window.mapboxgl.accessToken = config.mapBoxApiKey
      }
    }, 10)

    return () => clearInterval(intervalId)
  }, [])

  if (!config.mapBoxApiKey) {
    return <></>
  }

  if (!isMapboxInitialized) {
    return (
      <div className="h-[400px] flex justify-center items-center">
        <LoaderSpinner />
      </div>
    )
  }
  if (error) {
    return (
      <div>
        <P className="text-red-400">Map Error</P>
      </div>
    )
  }
  return <div ref={mapContainer} className={cn('h-[400px]', className)} />
}
