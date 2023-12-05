import React from 'react'
import config from '#client/config'
import { Background, ComponentWrapper } from '#client/components/ui'
import { RoomDisplayData } from '#shared/types'
import { DeviceRoomReservation } from './DeviceRoomReservation'
import { useRoomDisplayPolling } from '../queries'

export const RoomDisplay: React.FC = () => {
  const { data: display } = useRoomDisplayPolling()
  return !!display ? (
    <div className="bg-bg-system">
      {display.confirmed ? (
        <DeviceRoomReservation display={display} />
      ) : (
        <RoomDisplayPlaceholder display={display} />
      )}
    </div>
  ) : null
}

const RoomDisplayPlaceholder: React.FC<{ display: RoomDisplayData }> = ({
  display,
}) => {
  const deviceConfirmationLink = React.useMemo(() => {
    return `${config.appHost}/admin/room-reservation/device/${display.deviceId}`
  }, [display.deviceId])
  const qrCodeSrc = React.useMemo(() => {
    const url = new URL(`http://api.qrserver.com/v1/create-qr-code/`)
    url.searchParams.append('data', deviceConfirmationLink)
    url.searchParams.append('size', '160x160')
    return url.toString()
  }, [deviceConfirmationLink])
  return (
    <Background color="rgb(249, 249, 249)" className="pt-32">
      <ComponentWrapper>
        <div className="flex justify-center">
          <a href={deviceConfirmationLink}>
            <img className="block" src={qrCodeSrc} alt="QR Code" />
          </a>
        </div>
        <p className="mt-6 text-center">
          To unlock the page please scan this QR code via device with signed in{' '}
          {config.appName}.
        </p>
        <p className="mt-4 text-center">
          Device ID:{' '}
          <code className="text-red-500">{display.deviceId.split('-')[0]}</code>
        </p>
      </ComponentWrapper>
    </Background>
  )
}
