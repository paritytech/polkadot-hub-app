import { EventType, Map } from '#client/components/ui/Map'
import {
  areClusterCoordinatesUnique,
  geoJsonSource,
  getFeatureCollection,
} from '#client/components/ui/Map/mapbox/index'
import { createPopup } from '#client/components/ui/Map/mapbox/popup'
import config from '#client/config'
import * as stores from '#client/stores'
import React, { useCallback, useEffect, useState } from 'react'
import { useCountries, useUpdateGeodata, useUsersMap } from '../queries'

import { Button, FButton, H1, H2, P } from '#client/components/ui'
import {
  clusterCount,
  clusterEvents,
  clusters,
  Coordinates,
  MapLayers,
  SOURCE_NAME,
  unclusteredPoint,
} from '#client/components/ui/Map/mapbox/config'
import { showNotification } from '#client/components/ui/Notifications'
import { StealthMode } from '#client/components/ui/StealthMode'
import { Warning } from '#client/components/ui/Warning'
import { setAppStateItem } from '#client/stores'
import { UserMapPin } from '#shared/types'
import { useStore } from '@nanostores/react'

type LocationDetails = {
  country: string
  countryCode: string
  city: string
}

const PersonRow: React.FC<{ person: UserMapPin }> = ({ person }) => (
  <div className="flex gap-4" key={person.id}>
    <div className="w-12 h-12">
      {person.avatar && <img width="48" height="48" src={person.avatar} />}
    </div>
    <div className="flex flex-col w-96 sm:w-full">
      <a
        className="underline font-bold"
        href={`${config.appHost.concat('/profile/', person.id)}`}
        target="_blank"
      >
        {person.fullName}
      </a>
      <p>
        {person.jobTitle ?? ''} {person.team ? `@ ${person.team}` : ''}{' '}
        {person.department ? `- ${person.department}` : ' '}
      </p>
    </div>
  </div>
)

const LocationRow = ({ label, value }: { label: string; value: string }) => (
  <P>
    <span className="text-text-tertiary text-sm">{label}</span>
    <br />
    {value}
  </P>
)

export const UsersMap: React.FC<{ mapContainerClassName: string }> = ({
  mapContainerClassName,
}) => {
  const me = useStore(stores.me)
  const { data: users = [], refetch: refetchUsers } = useUsersMap()
  const [people, setPeople] = useState<Array<UserMapPin>>([])
  const { data: countries } = useCountries()
  const [centerPoint, setCenterPoint] = useState<Coordinates>()
  const [currentZoom, setCurrentZoom] = useState<number>(3)
  const [geoJsonData, setGeoJsonData] =
    useState<GeoJSON.GeoJsonProperties | null>(null)
  const [locationDetails, setLocationDetails] =
    useState<LocationDetails | null>(null)
  const [showWarning, setShowWarning] = useState<boolean>(false)

  const { mutate: updateGeo } = useUpdateGeodata(() => {
    showNotification('Your location data has been updated', 'success')
    setShowWarning(false)
    refetchUsers()
  })

  useEffect(() => {
    if (users.length && !geoJsonData) {
      setGeoJsonData(getFeatureCollection(users))
    }
  }, [users])

  useEffect(() => {
    if (!locationDetails || !me) {
      return
    }
    const countryIsTheSame =
      me?.country && me?.country === locationDetails?.countryCode
    if (
      !countryIsTheSame &&
      locationDetails.city &&
      locationDetails.country &&
      (me?.city !== locationDetails?.city ||
        me?.country !== locationDetails?.countryCode)
    ) {
      setShowWarning(true)
    }
  }, [locationDetails, me])

  // @todo figure out what to do with this pop up in the future, hiding for now
  // useEffect(() => {
  //   if (me?.geodata?.doNotShareLocation) {
  //     console.error('User is not sharing location')
  //     return
  //   }
  //   if (navigator.geolocation) {
  //     navigator.geolocation.getCurrentPosition(
  //       async function (position) {
  //         const latitude = position.coords.latitude
  //         const longitude = position.coords.longitude
  //         const { city, country, countryCode } = await reverseGeocoding(
  //           longitude,
  //           latitude
  //         )
  //         setLocationDetails({
  //           city,
  //           country,
  //           countryCode,
  //         })
  //       },
  //       function (error) {
  //         console.error(error)
  //       }
  //     )
  //   } else {
  //     console.error('Geolocation is not supported by this browser.')
  //   }
  // }, [])

  const onLoad = useCallback(
    (mapboxgl: any, map: any) => {
      if (!geoJsonData) {
        return
      }
      map.addSource(
        SOURCE_NAME,
        geoJsonSource(geoJsonData as mapboxgl.GeoJSONSource)
      )
      map.addLayer(clusters)
      map.addLayer(clusterCount)
      map.addLayer(unclusteredPoint)
      clusterEvents.map((ev) =>
        map.on(ev.name, ev.target, () => ev.action(map))
      )
      // inspect a cluster on click
      map.on('click', MapLayers.Clusters, (e: mapboxgl.MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: [MapLayers.Clusters],
        })
        const clusterId = features[0].properties.cluster_id
        const source = map.getSource(SOURCE_NAME)

        source.getClusterChildren(
          clusterId,
          (err: any, clusterChildren: GeoJSON.Feature<GeoJSON.Geometry>[]) => {
            if (err) {
              console.log(err)
              return
            }
            const allPoints = clusterChildren.map(
              (point: GeoJSON.Feature) => point.geometry.coordinates
            )

            // if there are more than 2 unique coordinates we keep on zooming
            if (areClusterCoordinatesUnique(allPoints)) {
              source.getClusterExpansionZoom(
                clusterId,
                (err: any, zoom: number) => {
                  if (err) return
                  setCurrentZoom(zoom)
                  map.easeTo({
                    center: features[0].geometry.coordinates,
                    zoom: zoom,
                  })
                }
              )
            } else {
              const people = clusterChildren.map(
                (one) => one.properties as UserMapPin
              )
              setPeople(people)
              setCenterPoint(features[0].geometry.coordinates as Coordinates)
            }
          }
        )
      })
    },
    [geoJsonData]
  )

  if (people.length > 0) {
    return (
      <div>
        <H1 className="mt-4 font-extra text-center">People</H1>
        <Button onClick={() => setPeople([])}> Back to Map </Button>
        <H2 className="mt-4">Location: {people[0].city} </H2>
        <div className="flex flex-col gap-4 mt-10">
          {people.map((person) => (
            <PersonRow person={person} />
          ))}
        </div>
      </div>
    )
  }
  const events: Array<EventType> = [
    {
      name: 'load' as keyof mapboxgl.MapLayerEventType,
      action: onLoad,
    },
    {
      name: 'click' as keyof mapboxgl.MapLayerEventType,
      target: MapLayers.UnclusteredPoint,
      action: createPopup,
    },
  ]

  const onToggleStealth = (value: boolean) => {
    if (me) {
      updateGeo({
        country: me?.country,
        city: me?.city,
        geodata: {
          ...me?.geodata,
          doNotShareLocation: value,
        },
      })
    }
  }

  const LocationWarning = () => (
    <Warning text="Are you travellling at the moment?">
      <div className="flex flex-col justify-between gap-2">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <LocationRow
            label="Your profile"
            value={`${me?.city ? me?.city.concat(', ') : ''} 
          ${countries?.list.find((x) => x.code === me?.country)?.name}`}
          />
          <LocationRow
            label="Your current location"
            value={`${locationDetails?.city}, ${locationDetails?.country}`}
          />
        </div>
        <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row  gap-4 justify-between">
          <FButton kind="secondary" onClick={() => setShowWarning(false)}>
            Skip
          </FButton>
          <FButton
            kind="primary"
            onClick={() => {
              if (me?.geodata && locationDetails) {
                setAppStateItem('me', {
                  ...me,
                  city: locationDetails?.city,
                  country: locationDetails?.countryCode,
                  countryName: locationDetails.country,
                })
                updateGeo({
                  geodata: me?.geodata,
                  city: locationDetails?.city,
                  country: locationDetails?.countryCode,
                })
              }
            }}
          >
            Update profile
          </FButton>
        </div>
      </div>
    </Warning>
  )
  return (
    <div>
      {showWarning && me?.country && <LocationWarning />}
      {!me?.country && (
        <P className="text-center my-6">
          <a className="underline hover:opacity-60" href="/me#profileLocation">
            Fill in your location in your profie
          </a>{' '}
          if you want to be displayed on this map.
        </P>
      )}
      {geoJsonData && (
        <Map
          centerPoint={centerPoint}
          zoom={currentZoom}
          events={events}
          className={mapContainerClassName}
        />
      )}
      {me?.country && (
        <div className="mt-10">
          <StealthMode
            originalValue={!!me?.geodata?.doNotShareLocation}
            onToggle={onToggleStealth}
            title="Don't show me on this map"
            subtitle="My location is secret"
          />
        </div>
      )}
    </div>
  )
}
