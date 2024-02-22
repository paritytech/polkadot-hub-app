import { useStore } from '@nanostores/react'
import * as React from 'react'
import { Header } from '#client/components/Header'
import { LoginButton } from '#client/components/auth/LoginButton'
import {
  Avatar,
  Background,
  ComponentWrapper,
  FButton,
  H1,
  H2,
  H3,
  HR,
  LoaderSpinner,
  P,
} from '#client/components/ui'
import { showNotification } from '#client/components/ui/Notifications'
import config from '#client/config'
import Permissions from '#shared/permissions'
import * as stores from '#client/stores'
import {
  EntityVisibility,
  EventApplicationStatus,
  FormDuplicationRule,
} from '#shared/types'
import { cn, formatDateRange } from '#client/utils'
import { useDocumentTitle } from '#client/utils/hooks'
import { renderMarkdown } from '#client/utils/markdown'
import {
  useApplicationStatusChange,
  useApplyForEvent,
  useEventParticipants,
  useEventPublic,
  useToggleEventCheckmark,
} from '../queries'

const MAX_PARTICIPANTS = 6

export const EventPage = () => {
  const me = useStore(stores.me)
  const permissions = useStore(stores.permissions)
  const page = useStore(stores.router)

  const eventId = page?.route === 'eventPage' ? page.params.eventId : null

  const {
    data: event,
    refetch: refetchEvent,
    isFetching: isEventFetching,
  } = useEventPublic(eventId)

  const canViewParticipants = React.useMemo(
    () => me && permissions.has(Permissions.events.ListParticipants),
    [me, permissions]
  )
  const { data: participants = [], refetch: refetchParticipants } =
    useEventParticipants(canViewParticipants ? eventId : null)
  const [participantsListExpanded, setParticipantsListExpanded] =
    React.useState(false)
  const filteredParticipants = React.useMemo(() => {
    return participantsListExpanded
      ? participants
      : participants.slice(0, MAX_PARTICIPANTS)
  }, [participants, participantsListExpanded])

  // the event is only global
  const isGlobalEvent = React.useMemo(
    () => Boolean(event?.metadata.global),
    [event]
  )

  const providers = config.auth.providers

  useDocumentTitle(
    event?.title || (isEventFetching && 'Loading...') || 'Internal event'
  )

  const { mutate: applyForEvent } = useApplyForEvent(() => {
    let successMessage = 'Your application has been accepted'
    if (event?.metadata.global) {
      successMessage = 'Thank you for expressing your interest'
    }
    showNotification(successMessage, 'success')
    refetchEvent()
    refetchParticipants()
  })
  const { mutate: updateApplication } = useApplicationStatusChange(() =>
    refetchEvent()
  )

  const onApply = React.useCallback(() => {
    if (event) {
      applyForEvent(event.id)
    }
  }, [event])

  const onOptOut = React.useCallback(() => {
    if (event && event.applicationId) {
      if (
        window.confirm(`Are you sure you want to opt out from ${event.title}?`)
      ) {
        updateApplication({
          applicationId: event.applicationId,
          status: EventApplicationStatus.CancelledUser,
        })
      }
    }
  }, [event])

  const { mutate: toggleCheckbox } = useToggleEventCheckmark(
    event?.id || '',
    refetchEvent
  )
  const setCheckboxValue = (checkboxId: string, checked = false) =>
    toggleCheckbox({ checkboxId, checked })

  const formattedDate = React.useMemo(
    () => (event ? formatDateRange(event.startDate, event.endDate) : null),
    [event]
  )

  const canReSubmit = React.useMemo(() => {
    if (!event || !event.form) return false
    return (
      [
        EventApplicationStatus.Opened,
        EventApplicationStatus.Confirmed,
        EventApplicationStatus.CancelledUser,
      ].includes(event.applicationStatus!) &&
      [FormDuplicationRule.Rewrite, FormDuplicationRule.RewriteEdit].includes(
        event.form.duplicationRule
      )
    )
  }, [event])

  const canOptOut = React.useMemo(() => {
    if (!event || !event.applicationStatus) return false
    return [
      EventApplicationStatus.Opened,
      EventApplicationStatus.Confirmed,
      EventApplicationStatus.Pending,
    ].includes(event.applicationStatus!)
  }, [event])

  const canSubmit = React.useMemo(() => {
    return (
      me &&
      event &&
      !event?.applicationStatus &&
      // has attached form and it's not "hidden"
      ((event.formId && event.form?.visibility !== EntityVisibility.None) ||
        // no attached form
        !event.formId)
    )
  }, [me, event])

  React.useEffect(() => {
    if (
      permissions.size &&
      !permissions.has(Permissions.events.ListGlobalEvents)
    ) {
      setTimeout(() => stores.goTo('home'), 0)
    }
  }, [permissions, isGlobalEvent])

  if (!event && !isEventFetching) {
    stores.goTo('home')
    return null
  }

  return (
    <Background className={cn(!me && 'pt-10', 'pb-10')}>
      <Header />

      <ComponentWrapper>
        {/* Event is loading */}
        {!event && isEventFetching ? (
          <LoaderSpinner className="h-[300px] w-full" />
        ) : null}

        {/* The event is internal; handle attempts to open it without authorization */}
        {!event && !isEventFetching && !me ? (
          <>
            <H2 className="mb-5">Sign in to view event details</H2>
            <LoginButton
              size="small"
              label="Sign in"
              callbackPath={`/events/${eventId}`}
            />
          </>
        ) : null}

        {/* The event has been successfully loaded */}
        {event && (
          <>
            {event.visibility === EntityVisibility.None && (
              <div className="flex justify-center">
                <div className="bg-yellow-50 border-2 border-yellow-400 py-4 px-5 rounded">
                  <H3 className="mb-2">DRAFT MODE</H3>
                  This event is not visible to anyone. You're seeing this
                  because you're an admin.
                </div>
              </div>
            )}
            {/* Header */}
            {!!event.coverImageUrl && (
              <img
                src={event.coverImageUrl}
                alt="Event's cover"
                className="mb-6 rounded-[12px] overflow-hidden"
              />
            )}
            <H1 className="my-10">{event.title}</H1>

            {/* Details */}
            <div className="my-10 sm:px-6 font-bold">
              <div className="flex items-start mb-6">
                <div className="p-4 rounded-tiny bg-fill-6 mr-6 w-16 h-16 text-4xl flex justify-center items-center">
                  🗓
                </div>
                <H2 className="flex-auto mt-6">{formattedDate}</H2>
              </div>
              {(event.address || event.location || event.mapUrl) && (
                <div className="flex items-start mb-6">
                  <div className="p-4 rounded-md bg-fill-6 mr-6 w-16 h-16 text-4xl flex justify-center items-center">
                    🧭
                  </div>
                  <H2 className="flex-auto mt-6">
                    <div>{event.location || null}</div>
                    <div className="font-normal">{event.address || null}</div>
                    {!!event.mapUrl && (
                      <div className="mt-4">
                        <FButton
                          className="font-normal"
                          target="_blank"
                          href={event.mapUrl}
                        >
                          Open in Google Maps
                        </FButton>
                      </div>
                    )}
                  </H2>
                </div>
              )}
            </div>

            {/* Application status */}
            {!isGlobalEvent && event.applicationStatus === 'opened' && (
              <div className="flex justify-center">
                <div className="bg-yellow-50 text-yellow-600 border border-yellow-600 p-4 rounded-tiny">
                  Your application has been received and is being processed
                </div>
              </div>
            )}
            {event.applicationStatus === 'cancelled_admin' && (
              <div className="flex justify-center">
                <div className="bg-red-50 text-red-600 border border-red-600 p-4 rounded-tiny">
                  Your application has been cancelled
                </div>
              </div>
            )}

            {/* Description */}
            {!!event.description && (
              <div
                className="my-6"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(event.description),
                }}
              />
            )}

            {/* Content for participants */}
            {event.applicationStatus === 'confirmed' && !!event.content && (
              <div
                className="my-6"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(event.content),
                }}
              />
            )}

            {/* Checklist */}
            {event.applicationStatus === 'confirmed' &&
              !!event.checklist?.length && (
                <div className="p-4 sm:p-8 mb-12 rounded-xl border border-yellow-200 bg-yellow-50">
                  <H2 className="font-extra">Checklist</H2>
                  {event.checklist.map((checkbox) => (
                    <div key={checkbox.id} className="flex items-start mb-2">
                      <input
                        type="checkbox"
                        onChange={() => {
                          setCheckboxValue(checkbox.id, !checkbox.checked)
                          showNotification(
                            'Checklist item was updated.',
                            'success'
                          )
                        }}
                        checked={checkbox.checked}
                        className="w-8 h-8 mr-4 rounded-tiny cursor-pointer text-purple-400"
                      />
                      <div
                        className={cn(
                          'phq_markdown-content',
                          'flex-auto mb-2 pt-1',
                          checkbox.checked ? 'opacity-30' : null
                        )}
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(checkbox.text),
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

            {/* List of participants */}
            {canViewParticipants && (
              <div className="mt-8 mb-4">
                <H2 className="font-bold">
                  List of {isGlobalEvent ? 'interested' : 'participants'}
                </H2>
                {!filteredParticipants.length ? (
                  <P className="text-text-tertiary mb-4">
                    Be the first one to join
                  </P>
                ) : (
                  <>
                    <div className="sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 mt-8">
                      {filteredParticipants.map((x) => {
                        const content = (
                          <>
                            <Avatar
                              size="medium"
                              src={x.avatar}
                              className="mr-2"
                            />
                            <div className="text-sm leading-tight">
                              <div>{x.fullName}</div>
                              {!!x.team && (
                                <div className="text-gray-400">
                                  from {x.team}
                                </div>
                              )}
                            </div>
                          </>
                        )
                        return permissions.has(
                          Permissions.users.ListProfiles
                        ) ? (
                          <a
                            href={`/profile/${x.id}`}
                            target="_blank"
                            key={x.id}
                            className="flex mb-4"
                          >
                            {content}
                          </a>
                        ) : (
                          <span key={x.id} className="flex mb-4">
                            {content}
                          </span>
                        )
                      })}
                    </div>
                    {participants.length &&
                      participants.length > MAX_PARTICIPANTS &&
                      !participantsListExpanded && (
                        <FButton
                          kind="link"
                          onClick={() => setParticipantsListExpanded(true)}
                        >
                          Show all ({participants.length})
                        </FButton>
                      )}
                  </>
                )}
              </div>
            )}

            {/* Login button for externals */}
            {!me && (
              <div className="mt-8 grid grid-rows-2 gap-4 m-auto justify-between">
                {providers.includes('google') && (
                  <LoginButton
                    size="small"
                    label="Sign in to apply for the event"
                    className="w-full h-full"
                    callbackPath={`/events/${eventId}`}
                  />
                )}
                {providers.includes('polkadot') && (
                  // @to-do not showing polkadot button on mobile or tablet as we cannot have browser extension on those
                  <div className="hidden md:block">
                    <LoginButton
                      icon="polkadot"
                      label={`Sign in with Polkadot`}
                      className="bg-black hover:opacity-80 hover:bg-black w-full"
                      provider="polkadot"
                      currentState={'Login'}
                      callbackPath={`/events/${eventId}`}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Buttons for participants */}
            {!!me && !!event.applicationStatus && (
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                {canOptOut && (
                  <FButton kind="secondary" onClick={onOptOut}>
                    Opt Out
                  </FButton>
                )}
                {canReSubmit && (
                  <FButton
                    kind="secondary"
                    href={`${config.appHost}/event/${event.id}/application`}
                  >
                    Re-submit application form
                  </FButton>
                )}
                <FButton kind="primary" onClick={() => stores.goTo('home')}>
                  Go to the home page
                </FButton>
              </div>
            )}

            {/* Buttons for those who have not applied yet */}
            {!!me && !event.applicationStatus && (
              <>
                {canSubmit ? (
                  <div className="flex flex-col sm:flex-row gap-2 justify-end">
                    {event.formId ? (
                      <FButton
                        kind="primary"
                        href={`${config.appHost}/event/${event.id}/application`}
                      >
                        Apply
                      </FButton>
                    ) : (
                      <FButton
                        kind={isGlobalEvent ? 'secondary' : 'primary'}
                        onClick={onApply}
                        className="w-full"
                      >
                        {isGlobalEvent ? 'I will be there' : 'Apply'}
                      </FButton>
                    )}
                  </div>
                ) : (
                  <>
                    <HR />
                    <P className="text-text-tertiary mt-6">
                      The event is closed for applications
                    </P>
                  </>
                )}
              </>
            )}
          </>
        )}
      </ComponentWrapper>
    </Background>
  )
}
