export type Coordinates = [number, number]

export const Berlin = [13.41053, 52.52437]
export const bigCountries = ['RU', 'CN', 'US']
export const SOURCE_NAME = 'people'
export const blackAndWhiteStyle = 'mapbox://styles/mapbox/light-v11'

export const MapLayers = {
  Clusters: 'clusters',
  UnclusteredPoint: 'unclustered-point',
  ClusteredPoint: 'clustered-point',
}

export enum MapTypes {
  Country = 'country',
  City = 'city',
}

export const countryHighlightConfig: mapboxgl.AnyLayer = {
  id: 'country-boundaries',
  source: {
    type: 'vector',
    url: 'mapbox://mapbox.country-boundaries-v1',
  },
  'source-layer': 'country_boundaries',
  type: 'fill',
  paint: {
    'fill-color': '#EA3D94',
    'fill-opacity': 0.2,
  },
}

const ClusterSize = {
  Small: 20,
  Medium: 30,
  Big: 40,
}

const ClusterMaxCount = {
  [ClusterSize.Small]: 5,
  [ClusterSize.Medium]: 9,
}

const ClusterColor = {
  [ClusterSize.Small]: '#F272B6',
  [ClusterSize.Medium]: '#6D3AEE',
  [ClusterSize.Big]: '#0094D4',
}

export const clusterCount = {
  id: 'cluster-count',
  type: 'symbol',
  source: SOURCE_NAME,
  filter: ['has', 'point_count'],
  layout: {
    'text-field': ['get', 'point_count_abbreviated'],
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12,
  },
  paint: {
    'text-color': 'white',
  },
}

export const unclusteredPoint = {
  id: MapLayers.UnclusteredPoint,
  type: 'circle',
  source: SOURCE_NAME,
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': ClusterColor[ClusterSize.Small],
    'circle-radius': 8,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#fff',
  },
}

export const clusters = {
  id: MapLayers.Clusters,
  type: 'circle',
  source: SOURCE_NAME,
  filter: ['has', 'point_count'],
  paint: {
    // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
    'circle-color': [
      'step',
      ['get', 'point_count'],
      ClusterColor[ClusterSize.Small],
      ClusterMaxCount[ClusterSize.Small],
      ClusterColor[ClusterSize.Medium],
      ClusterMaxCount[ClusterSize.Medium],
      ClusterColor[ClusterSize.Big],
    ],
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      ClusterSize.Small,
      ClusterMaxCount[ClusterSize.Small],
      ClusterSize.Medium,
      ClusterMaxCount[ClusterSize.Medium],
      ClusterSize.Big,
    ],
  },
}

const cursorNone = (map: Map) => (map.getCanvas().style.cursor = '')
const cursorPointer = (map: Map) => (map.getCanvas().style.cursor = 'pointer')

export const clusterEvents = [
  {
    name: 'mouseleave',
    target: MapLayers.UnclusteredPoint,
    action: cursorNone,
  },
  {
    name: 'mouseenter',
    target: MapLayers.UnclusteredPoint,
    action: cursorPointer,
  },
  {
    name: 'mouseleave',
    target: MapLayers.Clusters,
    action: cursorNone,
  },
  {
    name: 'mouseenter',
    target: MapLayers.Clusters,
    action: cursorPointer,
  },
]
