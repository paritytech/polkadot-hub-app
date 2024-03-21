import { FButton, H3, WidgetWrapper } from '#client/components/ui'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { useOffice } from '#client/utils/hooks'
import { useMemo } from 'react'
import dayjs from 'dayjs'

export const AboutWidget: React.FC = () => {
  const officeId = useStore(stores.officeId)
  const office = useOffice(officeId ?? '')
  const coreHours = useMemo(() => {
    if (!office || office.workingHours?.length !== 2) {
      return ''
    }
    return `${dayjs(office.workingHours[0], 'HH:mm').format('hA')} - ${dayjs(
      office.workingHours[1],
      'HH:mm'
    ).format('hA')} ${!!office.workingDays ? `, ${office.workingDays}` : ''}`
  }, [office])

  if (
    !!office &&
    !office.allowDeskReservation &&
    !office.allowRoomReservation
  ) {
    return <></>
  }

  return (
    <WidgetWrapper title={`About ${office?.name} Hub`}>
      <div className="flex flex-col gap-5">
        <img
          src={`/maps/${office?.id}.png`}
          className="hover:cursor-pointer"
          onClick={() => stores.goTo('aboutPage', { hubId: officeId })}
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        ></img>

        <div className="flex flex-col">
          {office?.address && (
            <div>
              <H3 className="mb-1">Address</H3>
              <p className="text-text-secondary">
                {office?.address}, {office?.city}
                <br />
                {office.directions}
              </p>
            </div>
          )}
        </div>
        {coreHours && (
          <div>
            <H3 className="mb-1">Opening hours</H3>
            <p className="text-text-secondary">{coreHours}</p>
            <br />
          </div>
        )}
      </div>
      <FButton
        kind="link"
        className=" -ml-2"
        onClick={() => {
          window.scrollTo(0, 0)
          stores.goTo('aboutPage', { hubId: officeId })
        }}
      >
        Show more
      </FButton>
    </WidgetWrapper>
  )
}
