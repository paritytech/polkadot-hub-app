import { UserMapPin } from '../../../../../modules/users/types'
import {
  Berlin,
  blackAndWhiteStyle,
  Coordinates,
  countryHighlightConfig,
} from './config'

export const highlightCountry = (map: mapboxgl.Map, code: string) =>
  map
    .addLayer(countryHighlightConfig, 'country-label')
    .setFilter('country-boundaries', ['in', 'iso_3166_1', code])

export const dropMarker = (
  mapboxgl: any,
  map: mapboxgl.Map,
  coords: Coordinates | undefined
) => {
  if (coords && coords.length == 2) {
    return new mapboxgl.Marker({ color: '#E6087B' })
      .setLngLat(coords)
      .addTo(map)
  }
}

export const getMap = (
  mapboxgl: any,
  container: HTMLElement,
  center: mapboxgl.LngLatLike | undefined,
  zoom: number,
  style: string = blackAndWhiteStyle
) => {
  let mapCenter = !center ? new mapboxgl.LngLat(Berlin[0], Berlin[1]) : center
  const configMap: mapboxgl.MapboxOptions = {
    container: container,
    style,
    center: mapCenter,
    zoom,
  }
  return new mapboxgl.Map(configMap)
}
/**
 *
 * @param users
 * @returns
 */
export const getFeatureCollection = (
  users: Array<UserMapPin>
): GeoJSON.GeoJsonProperties => ({
  type: 'FeatureCollection',
  features: users.map((user) => geoJsonObject(user)),
})

/**
 *
 * @param user
 * @returns
 */
export const geoJsonObject = (user: UserMapPin): GeoJSON.GeoJsonProperties => ({
  type: 'Feature',
  properties: user,
  geometry: {
    type: 'Point',
    coordinates: user?.geodata?.coordinates,
  },
})

export const geoJsonSource = (geoJsonData: mapboxgl.GeoJSONSource) => ({
  type: 'geojson',
  data: geoJsonData,
  cluster: true,
  // clusterMaxZoom: 14, // Max zoom to cluster points on
  clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
})

/**
 * Return true if all coordinates in the items array are unique
 * @param items
 * @returns
 */
export const areClusterCoordinatesUnique = (items: Array<any>): boolean => {
  const allItems = items.flat()
  const set = new Set<Number>(allItems.flat())
  return set.size === allItems.length
}
