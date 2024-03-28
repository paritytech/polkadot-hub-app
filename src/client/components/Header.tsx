import React from 'react'
import { useStore } from '@nanostores/react'
import { Container } from '#client/components/Container'
import { RouteValidator } from '#client/components/RouteValidator'
import { DropDownMenu, LocationMenu } from '#client/components/ui'
import config from '#client/config'
import * as stores from '#client/stores'
import { propEq } from '#shared/utils/fp'
import Permissions from '#shared/permissions'
import { PermissionsValidator } from './PermissionsValidator'
import MC from './__import-components'

export const Header: React.FC = () => {
  const me = useStore(stores.me)
  const permissions = useStore(stores.permissions)
  const isAdmin = useStore(stores.isAdmin)

  const menuItems = React.useMemo(() => {
    const canUpdateProfile = permissions.has(Permissions.users.ManageProfile)
    const canUpdateProfileLimited = permissions.has(
      Permissions.users.ManageProfileLimited
    )
    const items = []
    if (canUpdateProfile) {
      items.push({
        name: 'View Profile',
        link: '/profile/' + me?.id,
        icon: 'Person',
      })
    }
    if (canUpdateProfile) {
      items.push({
        name: 'Edit Profile',
        link: '/me',
        icon: 'Pencil',
      })
    }
    if (canUpdateProfile || canUpdateProfileLimited) {
      items.push({
        name: 'Settings',
        link: '/settings',
        icon: 'Gear',
      })
    }
    if (isAdmin) {
      items.push({
        name: 'Admin',
        link: '/admin',
        icon: 'Person',
      })
    }
    items.push({
      name: 'Logout',
      icon: 'Logout',
      link: '/auth/logout',
    })
    return items
  }, [me])

  const SearchBar: React.FC<{ mode: 'quick' | 'full' }> | null =
    config.modules.some(propEq('id', 'search'))
      ? MC?.search?.SearchBar || null
      : null

  if (!me) {
    return null
  }

  return (
    <div className="bg-white mb-2">
      <Container>
        <div className="relative flex md:grid md:grid-cols-[25fr_44fr_31fr] py-4 md:gap-x-4">
          <div className="absolute top-0 left-0 bottom-0 md:static flex items-center pl-6">
            <LocationMenu defaultLocation={me.defaultLocation} />
          </div>
          <div className="flex-auto flex md:block justify-end items-center">
            {!!SearchBar && (
              <PermissionsValidator required={[Permissions.search.Use]}>
                <RouteValidator disallowedRoutes={['searchPage']}>
                  <SearchBar mode="quick" />
                </RouteValidator>
                <RouteValidator allowedRoutes={['searchPage']}>
                  <SearchBar mode="full" />
                </RouteValidator>
              </PermissionsValidator>
            )}
          </div>
          <div className="flex justify-end items-center ml-2">
            <div className="pr-6">
              <DropDownMenu
                items={menuItems}
                closeButton={false}
                containerClassName="z-[2]"
              />
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
