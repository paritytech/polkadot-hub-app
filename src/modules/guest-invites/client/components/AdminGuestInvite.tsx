import React from 'react'
import dayjs from 'dayjs'
import { useStore } from '@nanostores/react'
import config from '#client/config'
import * as stores from '#client/stores'
import { useUserCompact } from '#modules/users/client/queries'
import {
  useVisitsAreas,
  useAvailableDesks,
} from '#modules/visits/client/queries'
import {
  H2,
  Link,
  Tag,
  Avatar,
  InputsWrapper,
  Select,
  ButtonsWrapper,
  Button,
  LabelWrapper,
  WidgetWrapper,
} from '#client/components/ui'
import { showNotification } from '#client/components/ui/Notifications'
import { OfficeFloorMap } from '#client/components/OfficeFloorMap'
import { propEq } from '#shared/utils/fp'
import { DATE_FORMAT } from '#client/constants'
import { useGuestInviteAdmin, useUpdateGuestInvite } from '../queries'
import { VisitType } from '#shared/types'

export const AdminGuestInvite: React.FC = () => {
  const page = useStore(stores.router)
  const inviteId =
    page?.route === 'adminGuestInvite' ? page.params.inviteId : null
  const { data: invite } = useGuestInviteAdmin(inviteId)
  const { data: user } = useUserCompact(invite?.creatorUserId || '', {
    enabled: !!invite?.creatorUserId,
  })
  const office = React.useMemo(() => {
    if (!invite) return null
    return config.offices.find(propEq('id', invite.office))
  }, [invite])

  // Floor map
  const { data: areas = [] } = useVisitsAreas(office?.id || '')
  const [areaId, setAreaId] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (areas.length) {
      setAreaId(areas[0].id)
    }
  }, [areas])
  const area = React.useMemo(() => areas.find((x) => areaId === x.id), [areaId])
  const onAreaChange = React.useCallback((areaId: string) => {
    setSelectedDeskId(null)
    setAreaId(areaId)
  }, [])

  const { data: availableDesks = [] } = useAvailableDesks(
    office?.id || '',
    invite?.dates || [],
    true
  )
  const availableAreaDeskIds = React.useMemo(() => {
    return availableDesks
      .filter((x) => x.areaId === area?.id)
      .map((x) => x.deskId)
  }, [availableDesks, area])

  const [selectedDeskId, setSelectedDeskId] = React.useState<string | null>(
    null
  )
  const onToggleDesk = React.useCallback((deskId: string) => {
    setSelectedDeskId((value) => (value === deskId ? null : deskId))
  }, [])

  const { mutate: updateGuestInvite, isLoading } = useUpdateGuestInvite(() => {
    showNotification("The guest's invitation has been confirmed", 'success')
    stores.goTo('adminGuestInvites')
  })

  const onSubmit = React.useCallback(
    (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault()
      if (inviteId && areaId && selectedDeskId) {
        updateGuestInvite({
          id: inviteId,
          data: {
            status: 'confirmed',
            areaId: areaId,
            deskId: selectedDeskId,
          },
        })
      }
    },
    [areaId, selectedDeskId, updateGuestInvite, inviteId]
  )

  return (
    <WidgetWrapper>
      {invite ? (
        <div>
          <div className="block lg:flex">
            <div className="mb-4 lg:w-[400px] lg:mr-4 lg:mb-0">
              <H2>Guest invitation details</H2>
              <div className="flex flex-col gap-2">
                <LabelWrapper label="Full name">{invite.fullName}</LabelWrapper>
                <LabelWrapper label="Email">
                  <Link href={`mailto:${invite.email}`}>{invite.email}</Link>
                </LabelWrapper>
                <LabelWrapper label="Office">
                  {office?.icon || ''}
                  {office?.name}
                </LabelWrapper>
                <LabelWrapper label="Dates">
                  <div className="flex flex-col gap-4">
                    {invite.dates.map((x, i) => (
                      <span key={x}>
                        <Tag color="gray" className="nowrap" size="small">
                          {dayjs(x, DATE_FORMAT).format('D MMMM, YYYY')}
                        </Tag>
                        {i !== invite.dates.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                </LabelWrapper>

                <LabelWrapper label="Invited by">
                  <span>
                    <Avatar
                      src={user?.avatar}
                      size="small"
                      className="mr-2 hidden md:inline-flex"
                    />
                    {user?.fullName}
                  </span>
                </LabelWrapper>
              </div>
            </div>

            <div className="flex-1 flex-shrink lg:border-l border-gray-200 lg:pl-8">
              <H2>Select a desk</H2>
              <div>
                <InputsWrapper
                  className="mb-4"
                  inputs={[
                    areas.length > 1 && (
                      <Select
                        className="w-full"
                        label="Area"
                        options={areas.map((x) => ({
                          label: x.name,
                          value: x.id,
                        }))}
                        value={area?.id}
                        onChange={onAreaChange}
                        placeholder={'Select area'}
                      />
                    ),
                    <Select
                      label="Desk"
                      options={(area?.desks || []).map((x) => ({
                        label: x.name,
                        value: x.id,
                        disabled:
                          x.type === 'personal' ||
                          !availableAreaDeskIds.includes(x.id),
                      }))}
                      value={selectedDeskId || undefined}
                      onChange={onToggleDesk}
                      placeholder={'Select desk'}
                    />,
                  ]}
                />
                {!!area && (
                  <OfficeFloorMap
                    area={area}
                    mappablePoints={[
                      ...area?.desks.map((desk) => ({
                        ...desk,
                        areaId: area.id,
                        kind: VisitType.Visit,
                      })),
                    ]}
                    clickablePoints={availableAreaDeskIds}
                    selectedPointId={selectedDeskId}
                    onToggle={onToggleDesk}
                  />
                )}
              </div>
            </div>
          </div>
          <ButtonsWrapper
            right={[
              <Button href="/admin/guest-invites">Back</Button>,
              <Button
                kind="primary"
                disabled={!selectedDeskId || isLoading}
                onClick={onSubmit}
              >
                {isLoading ? 'Loading...' : 'Confirm invitation'}
              </Button>,
            ]}
          />
        </div>
      ) : (
        <>Loading...</>
      )}
    </WidgetWrapper>
  )
}
