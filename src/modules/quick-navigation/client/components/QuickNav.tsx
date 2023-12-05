import * as React from 'react'
import {
  FButton,
  Icons,
  Icon,
  P,
  WidgetWrapper,
  HR,
} from '#client/components/ui'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import { cn } from '#client/utils'
import Permissions from '#shared/permissions'
import { NavigationSection, QuickNavigationItem } from '#shared/types'
import { useQuickNavigationMetadata } from '../queries'

const NavItem = ({ item }: { item: QuickNavigationItem }) => {
  const NavIcon = Icons[item.icon as Icon]
  return (
    <div className="flex">
      <FButton
        href={item.url}
        kind="link"
        className="flex gap-4 ml-[-8px] text-left"
        target={item.sameTab ? '_self' : '_blank'}
      >
        {/* @todo FIXME :) */}
        {/* @ts-ignore */}
        {item.icon && <NavIcon />}
        {item.name}
      </FButton>
    </div>
  )
}

export const QuickNav = () => (
  <PermissionsValidator required={[Permissions['quick-navigation'].Use]}>
    <_QuickNav />
  </PermissionsValidator>
)

const _QuickNav: React.FC = () => {
  const { data: navigationData } = useQuickNavigationMetadata()

  if (!navigationData?.length) {
    return <></>
  }

  return (
    <WidgetWrapper title="Quick Nav">
      {navigationData?.map((section: NavigationSection) => {
        return (
          <div key={section.section}>
            {!section.main && <HR />}
            <div className={'mb-2'}>
              {!section.main && (
                <P
                  textType="additional"
                  className="text-text-tertiary mb-2 text-left"
                >
                  {section.section}
                </P>
              )}
              <div className="flex flex-col gap-2">
                {section.links.map((item) => (
                  <NavItem key={item.name} item={item} />
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </WidgetWrapper>
  )
}
