import { Map } from '#client/components/ui/Map'
import { dropMarker, highlightCountry } from '#client/components/ui/Map/mapbox'
import {
  bigCountries,
  Coordinates,
  MapTypes,
} from '#client/components/ui/Map/mapbox/config'
import React from 'react'

export const UserMap: React.FC<{
  coords: Coordinates
  countryCode: string
  type: MapTypes
}> = ({ coords, countryCode = '', type = MapTypes.Country }) => {
  const isCountry = type === MapTypes.Country
  const zoom = isCountry ? (bigCountries.includes(countryCode) ? 2 : 4) : 9
  const onLoad = (mapboxgl: any, map: mapboxgl.Map) =>
    isCountry
      ? highlightCountry(map, countryCode)
      : dropMarker(mapboxgl, map, coords)
  const events = [
    {
      name: 'load',
      action: onLoad,
    },
  ]
  return <Map centerPoint={coords} zoom={zoom} events={events} />
}
