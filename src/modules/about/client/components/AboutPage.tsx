import { Header } from '#client/components/Header'
import {
  BackButton,
  Background,
  ComponentWrapper,
  H1,
  H2,
  H3,
} from '#client/components/ui'
import { Map } from '#client/components/ui/Map'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { useDocumentTitle, useOffice } from '#client/utils/hooks'
import { useVisitsAreas } from '#modules/visits/client/queries'
import { dropMarker } from '#client/components/ui/Map/mapbox'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { openPage } from '#client/stores'

export const AboutPage: React.FC = () => {
  const page = useStore(stores.router)
  const hubId = page?.route === 'aboutPage' ? page?.params?.hubId : null
  const officeId = useStore(stores.officeId)
  const [currentOfficeId, setCurrentOfficeId] = useState(officeId)

  const office = useOffice(hubId ?? '')
  const { data: areas = [] } = useVisitsAreas(office?.id || '')

  useDocumentTitle(`About ${office?.name}`)

  const onLoad = (mapboxgl: any, map: mapboxgl.Map) =>
    dropMarker(mapboxgl, map, office?.coordinates)
  const events = [
    {
      name: 'load',
      action: onLoad,
    },
  ]
  useEffect(() => {
    if (currentOfficeId !== officeId) {
      openPage(stores.router, 'aboutPage', { hubId: officeId })
      setCurrentOfficeId(officeId)
    }
  }, [officeId])

  const coreHours = useMemo(() => {
    if (!office || office.workingHours?.length !== 2) {
      return ''
    }
    return `${dayjs(office.workingHours[0], 'HH:mm').format('hA')} - ${dayjs(
      office.workingHours[1],
      'HH:mm'
    ).format('hA')} ${!!office.workingDays ? `, ${office.workingDays}` : ''}`
  }, [office])

  if (!office) {
    return (
      <Background>
        <Header />
        <ComponentWrapper>
          <BackButton />
          <H2 className="my-10 text-center text-accents-red">
            There is no such hub
          </H2>
        </ComponentWrapper>
      </Background>
    )
  }

  return (
    <Background>
      <Header />
      <div className="flex flex-col gap-4">
        <ComponentWrapper>
          <BackButton />
          <H1 className="my-10 text-center">About {office.name} </H1>

          <div className="flex flex-col gap-10">
            <Map
              centerPoint={office.coordinates}
              zoom={15}
              events={events}
              className={'h-[300px]'}
            />
            <div className="flex flex-col">
              <H2>Address</H2>
              <p>
                {office.address}, {office?.city}
              </p>
              {office.directions && office.directions}
            </div>

            {office &&
              (office.allowDeskReservation || office?.allowRoomReservation) && (
                <div>
                  <H2>Available facilities</H2>
                  <div className="flex gap-2">
                    <ul className="list-disc list-inside">
                      {office.allowDeskReservation && <li>desk bookings</li>}
                      {office.allowRoomReservation && (
                        <li>meeting room bookings</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            <div>
              {office.workingHours && (
                <div>
                  <H2>Opening hours</H2>
                  <p>{coreHours}</p>
                </div>
              )}
              <br />
              <p>
                We recommend use of the hub only during 'core' working hours{' '}
                {!!coreHours && `(${coreHours})`}. Any earlier or later than
                this, or on a weekend, and we are unable to guarantee entrance
                or exit to and from the office spaces.{' '}
              </p>
            </div>
          </div>
        </ComponentWrapper>
        <ComponentWrapper>
          <H1 className="my-10 text-center">Floor plan</H1>
          <div className="flex flex-col gap-20">
            {areas.map((area) => {
              if (area.id === 'none' || !area.available || !area.bookable) {
                return
              }
              return (
                <div key={area.id}>
                  <H3>{area.name}</H3>
                  <img className="opacity-80" src={area.map} alt={area.map} />
                </div>
              )
            })}
          </div>
        </ComponentWrapper>
      </div>
    </Background>
  )
}
