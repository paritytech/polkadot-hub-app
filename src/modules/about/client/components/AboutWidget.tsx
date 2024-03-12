import { FButton, H2, H3, Icons, WidgetWrapper } from '#client/components/ui'
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
  return (
    <WidgetWrapper title="About">
      <div className="flex flex-col gap-5">
        {<img src="/maps/berlin.png"></img>}
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
        className="mt-4 -ml-2"
        onClick={() => stores.goTo('aboutPage', { hubId: officeId })}
      >
        Show more
      </FButton>
    </WidgetWrapper>
  )
}
