import { Header } from '#client/components/Header'
import {
  BackButton,
  Background,
  ComponentWrapper,
  H1,
  P,
  H2,
  Icons,
  H3,
} from '#client/components/ui'
import { EventType, Map } from '#client/components/ui/Map'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { useDocumentTitle, useOffice } from '#client/utils/hooks'
import { useVisitsAreas } from '#modules/visits/client/queries'

export const AboutPage: React.FC = () => {
  const page = useStore(stores.router)
  const hubId = page?.route === 'aboutPage' ? page?.params?.hubId : null

  const office = useOffice(hubId ?? '')
  const { data: areas = [] } = useVisitsAreas(office?.id || '')

  useDocumentTitle(`About ${office?.name}`)
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
              centerPoint={[13.437433843390053, 52.49346465299907]}
              zoom={15}
              events={[]}
              className={'h-[300px]'}
            />
            <div className="flex flex-col">
              <H2>Address</H2>
              <p>
                Glogauer Straße 6, Berlin, <br /> Germany Entrance through the
                courtyard
              </p>
            </div>
            <div>
              <H2>Available facilities</H2>
              <div className="flex gap-2">
                <Icons.Clock fillClassName="stroke-black" />{' '}
                <Icons.Cake fillClassName="stroke-black" />{' '}
                <Icons.Socks fillClassName="stroke-black" />
                <Icons.Plane />
              </div>
            </div>
            <div>
              <H2>Opening hours</H2>
              <p>9am - 6pm, Monday - Friday</p>
              <br />
              <p>
                We recommend use of the office only during 'core' working hours
                (9am - 6pm, Monday - Friday). Any earlier or later than this, or
                on a weekend, and we are unable to guarantee entrance or exit to
                and from the office spaces.{' '}
              </p>
            </div>
          </div>
        </ComponentWrapper>
        <ComponentWrapper>
          <H1 className="my-10 text-center">Floor plan</H1>
          <div className="flex flex-col gap-20">
            {areas.map((area) => {
              if (area.id === 'none') {
                return
              }
              return (
                <div key={area.id}>
                  <H3>{area.name}</H3>
                  <img src={area.map} className="" alt={area.map} />
                </div>
              )
            })}
          </div>
        </ComponentWrapper>
      </div>
    </Background>
  )
}
