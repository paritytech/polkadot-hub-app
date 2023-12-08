import React from 'react'
import { useStore } from '@nanostores/react'
import config from '#client/config'
import * as stores from '#client/stores'
import * as fp from '#shared/utils/fp'
import { Button, ButtonsWrapper, Select } from '#client/components/ui'
import { showNotification } from '#client/components/ui/Notifications'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import Permissions from '#shared/permissions'
import { useUpdateRoomDisplayDevice, useAdminRooms } from '../queries'

export const RoomDisplayDevice = () => {
  const officeId = useStore(stores.officeId)
  return (
    <PermissionsValidator
      officeId={officeId}
      required={[Permissions['room-reservation'].AdminManage]}
      onRejectRender={
        <div>
          You don't have permission to set up the display in the "{officeId}"
          office.
          <br />
          Please select an office you can work with.
        </div>
      }
    >
      <_RoomDisplayDevice />
    </PermissionsValidator>
  )
}

const _RoomDisplayDevice: React.FC = () => {
  const page = useStore(stores.router)
  const deviceId =
    page?.route === 'roomDisplayDevice' ? page.params.deviceId : null
  const { mutate: updateDevice } = useUpdateRoomDisplayDevice(deviceId, () => {
    stores.goTo('admin')
    showNotification('The device was confirmed successfully', 'success')
  })
  const { data: rooms = [] } = useAdminRooms()
  const options = React.useMemo(() => {
    const officeById = config.offices.reduce(fp.by('id'), {})
    return rooms.map((x) => {
      const office = officeById[x.officeId]
      return {
        value: x.id,
        label: `${x.name}, ${office.name}`,
      }
    })
  }, [rooms])
  const [roomId, setRoomId] = React.useState<string | undefined>(undefined)
  React.useEffect(() => {
    if (rooms.length) {
      setRoomId(rooms[0].id)
    }
  }, [rooms])

  const onSubmit = React.useCallback(
    (ev: React.MouseEvent) => {
      if (roomId) {
        updateDevice({ roomId })
      }
    },
    [roomId, deviceId]
  )

  return (
    <div>
      <p>
        You are going to confirm the device{' '}
        <code className="text-red-500">{(deviceId || '').split('-')[0]}</code>{' '}
        for displaying room info.
      </p>
      <p className="mt-4">Please, select a room:</p>
      <Select
        className="mt-4 w-full"
        value={roomId}
        onChange={setRoomId}
        options={options}
      />
      <ButtonsWrapper
        className="mt-6"
        right={[
          <Button href="/">Do nothing</Button>,
          <Button kind="primary" onClick={onSubmit}>
            Confirm
          </Button>,
        ]}
      />
    </div>
  )
}
