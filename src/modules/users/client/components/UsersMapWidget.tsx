import React from 'react'
import config from '#client/config'
import { FButton, WidgetWrapper } from '#client/components/ui'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import Permissions from '#shared/permissions'
import { useMapStats } from '../queries'
import { UsersMap } from './UsersMap'

export const UsersMapWidget = () => (
  <PermissionsValidator required={[Permissions.users.UseMap]}>
    <_UsersMapWidget />
  </PermissionsValidator>
)

const _UsersMapWidget: React.FC = () => {
  const { data: stats } = useMapStats()
  if (!config.mapBoxApiKey || !stats) {
    return null
  }
  return (
    <WidgetWrapper title="People map">
      {
        <div>
          {stats && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center ">
              <div className="text-text-secondary">
                {stats.userCount} people in {stats.countryCount} countries
              </div>
              <div className="my-4 ml-[-8px]">
                <FButton kind="link" href="/map">
                  Open map page
                </FButton>
              </div>
            </div>
          )}
          <UsersMap mapContainerClassName="h-[300px]" />
        </div>
      }
    </WidgetWrapper>
  )
}
