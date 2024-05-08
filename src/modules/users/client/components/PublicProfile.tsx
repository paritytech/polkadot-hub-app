import {
  ComponentWrapper,
  WidgetWrapper,
  H2,
  Icons,
  Link,
  Tag,
  Placeholder,
} from '#client/components/ui'
import { LabelWrapper } from '#client/components/ui/Input'
import { MapTypes } from '#client/components/ui/Map/mapbox/config'
import * as stores from '#client/stores'
import { useDocumentTitle } from '#client/utils/hooks'
import { renderComponent } from '#client/utils/portal'
import { useStore } from '@nanostores/react'
import * as React from 'react'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import { Card } from './ProfileCard'
import { useMetadata, usePublicProfile } from '../queries'
import { UserMap } from './UserMap'
import Permissions from '#shared/permissions'
import { RootComponentProps } from '#shared/types'

const NoData = () => (
  <ComponentWrapper className="flex justify-center items-center">
    <Placeholder children="No data" />
  </ComponentWrapper>
)

export const PublicProfile: React.FC<RootComponentProps> = (props) => {
  const route = useStore(stores.router)
  const me = useStore(stores.me)
  const userId = route?.route === 'publicProfile' ? route.params.userId : null
  const isMine = me?.id === userId

  return isMine ? (
    <_PublicProfile {...props} />
  ) : (
    <PermissionsValidator
      required={[Permissions.users.ListProfiles]}
      onRejectGoHome
    >
      <_PublicProfile {...props} />
    </PermissionsValidator>
  )
}

const _PublicProfile: React.FC<RootComponentProps> = ({ portals }) => {
  const route = useStore(stores.router)
  const me = useStore(stores.me)
  const userId = route?.route === 'publicProfile' ? route.params.userId : null
  const { data: user } = usePublicProfile(userId)
  const { data: metadata } = useMetadata()
  const contactsMetadata = metadata?.contacts ?? {}
  useDocumentTitle(user?.fullName || 'Loading...')
  return (
    <div>
      {!user ? (
        <NoData />
      ) : (
        <div className="lg:grid grid-rows lg:grid-cols-[1fr_2fr] xl:grid-cols-[25fr_50fr_25fr] gap-x-4">
          <div>
            <WidgetWrapper className="hidden lg:block min-w-[340px]">
              <Card user={user} isMine={me?.id === user.id} />
            </WidgetWrapper>
          </div>
          <div>
            <ComponentWrapper>
              <div className="flex flex-col gap-12">
                <div className="lg:hidden">
                  <Card user={user} isMine={me?.id === user.id} />
                </div>
                {(!!user.bio || !!user.tags.length) && (
                  <Section title={'About'}>
                    <>
                      {!!metadata?.bio && !!user.bio && (
                        <div className="whitespace-pre-line text-text-tertiary leading-6 max-w-[595px] mb-8">
                          {user.bio}
                        </div>
                      )}
                      <div className="flex flex-wrap">
                        {user.tags.map((tag) => (
                          <Tag
                            key={tag.id}
                            color="purple"
                            className="mr-1 mb-1 whitespace-nowrap hover:opacity-80"
                            href={`/search?q=${encodeURIComponent(
                              `[#${tag.name}]`
                            )}`}
                          >
                            {tag.name}
                          </Tag>
                        ))}
                      </div>
                    </>
                  </Section>
                )}
                {!!Object.keys(user.contacts).length &&
                  !!Object.keys(contactsMetadata).length && (
                    <Section title="Contact information">
                      <div className="flex flex-col gap-4 text-base pb-8">
                        {Object.keys(user.contacts).map((contactId: string) => {
                          const metadata = contactsMetadata[contactId as string]
                          const userContact = user.contacts[contactId]
                          if (!userContact || !metadata) {
                            return
                          }
                          return (
                            <ContactRecord
                              key={contactId}
                              label={metadata.label}
                              prefix={metadata.prefix}
                              contact={userContact}
                            />
                          )
                        })}
                      </div>
                    </Section>
                  )}
                {!user.geodata?.doNotShareLocation &&
                  (user.city || user.country) &&
                  !!user.geodata?.coordinates && (
                    <PermissionsValidator required={[Permissions.users.UseMap]}>
                      <Section title="Location on map">
                        <div className="flex gap-2 text-accents-pink">
                          <Icons.House />
                          <span>
                            {user.countryName && !user.city
                              ? user.countryName
                              : ''}
                          </span>
                          <span>
                            {user.city && user.countryName
                              ? `${user.countryName}, ${user.city}`
                              : ''}
                          </span>
                        </div>
                        <UserMap
                          coords={user.geodata?.coordinates}
                          countryCode={user.countryCode ?? ''}
                          type={
                            !!user.country && !!user.city
                              ? MapTypes.City
                              : MapTypes.Country
                          }
                        />

                        <Link href="/map">See Other People on the map</Link>
                      </Section>
                    </PermissionsValidator>
                  )}
              </div>
            </ComponentWrapper>

            {portals['profile_extra_fields']?.map(
              renderComponent({ userId: user.id })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const ContactRecord = ({
  label,
  prefix,
  contact,
}: {
  label: string
  prefix?: string | null
  contact: string | null
}) => {
  if (!contact || !prefix) {
    return <LabelWrapper label={label}>{contact}</LabelWrapper>
  }

  let contactLink = contact

  if (contact.startsWith('@')) {
    contactLink = contact.substring(1)
  }

  if (prefix && !contactLink.startsWith(prefix)) {
    contactLink = prefix + contactLink
  }

  return (
    <LabelWrapper label={label}>
      <div className="inline sm:block flex-1">
        <Link href={contactLink} target="_blank">
          {contact}
        </Link>
      </div>
    </LabelWrapper>
  )
}

const Section: React.FC<{
  title: string
  hr?: boolean
  children: JSX.Element | JSX.Element[]
}> = ({ title, hr, children }) => (
  <div className="text-left">
    {hr && <hr className="my-8" />}
    <H2 className="mb-8">{title}</H2>
    <div className="flex flex-col gap-4 sm:gap-3">{children}</div>
  </div>
)
