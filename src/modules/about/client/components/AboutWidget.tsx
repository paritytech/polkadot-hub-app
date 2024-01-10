import { FButton, H2, H3, Icons, WidgetWrapper } from '#client/components/ui'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'
import { useOffice } from '#client/utils/hooks'

export const AboutWidget: React.FC = () => {
  const officeId = useStore(stores.officeId)
  const office = useOffice(officeId ?? '')
  return (
    <WidgetWrapper title="About">
      <div className="flex flex-col gap-5">
        {console.log(office)}
        {<img src="/maps/berlin.png"></img>}
        <div className="flex flex-col">
          {office?.address && (
            <div>
              <H3 className="mb-1">Address</H3>
              <p className="text-text-secondary">
                {office?.address}
                <br />
                Entrance through the courtyard
              </p>
            </div>
          )}
        </div>
        <div>
          <H3 className="mb-1">Available facilities</H3>
          <div className="flex gap-2">
            <Icons.Clock fillClassName="stroke-black" />{' '}
            <Icons.Cake fillClassName="stroke-black" />{' '}
            <Icons.Socks fillClassName="stroke-black" />
            <Icons.Plane />
          </div>
        </div>
        <div>
          <H3 className="mb-1">Opening hours</H3>
          <p className="text-text-secondary">9am - 6pm, Mon - Fri</p>
          <br />
        </div>
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
