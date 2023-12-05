import React from 'react'
import { FButton, P } from '#client/components/ui'
import { OfficeRoom } from '#shared/types'
import { cn } from '#client/utils'

export const RoomDescription: React.FC<{ room: OfficeRoom }> = ({ room }) => (
  <div>
    <div className="flex gap-8 justify-between">
      <div>
        <P className="font-medium">{room.name}</P>
        <P className="text-text-tertiary">
          {room.description} {room.capacity} people
        </P>
        <P className="hidden sm:block text-text-secondary">{room.equipment}</P>
      </div>
      <img
        src={room.photo}
        className="rounded-sm h-16 w-16 sm:h-32 sm:w-32 object-cover"
        style={{ objectFit: 'cover' }}
      />
    </div>

    <P className="block sm:hidden text-text-secondary">{room.equipment}</P>
  </div>
)

export const RoomListing: React.FC<{
  rooms: Array<OfficeRoom>
  onRoomSelect: (room: string) => void
  buttonTitle: string
  chosenRoom?: string
  title?: string
  children?: React.ReactNode
}> = ({ chosenRoom, rooms, onRoomSelect, buttonTitle, title, children }) => {
  return (
    <div className="w-full flex flex-col gap-2 transition-all duration-500">
      {title && <P className="text-text-tertiary my-4">{title}</P>}
      {!!rooms &&
        rooms.map((room: OfficeRoom) => {
          const iAmChosen = chosenRoom === room.id
          return (
            <div key={room.id}>
              <div
                className={cn(
                  !iAmChosen && 'hover:bg-fill-6',
                  'border border-applied-stroke p-4 rounded-sm hover:cursor-pointer '
                )}
              >
                <RoomDescription room={room} />
                <div
                  className={cn(
                    iAmChosen ? 'max-h-screen' : 'max-h-0',
                    'overflow-hidden transition-all duration-500'
                  )}
                >
                  {iAmChosen && children}
                </div>
                <FButton
                  kind="primary"
                  className={cn(
                    iAmChosen
                      ? 'text-text-secondary border-0  hover:opacity-75 hover:bg-white'
                      : 'text-accents-pink border border-applied-stroke hover:bg-accents-pink hover:text-white',
                    'w-full mt-4 mb-2 h-12 py-[14px] rounded-full bg-white'
                  )}
                  onClick={() => onRoomSelect(iAmChosen ? '' : room.id)}
                >
                  {iAmChosen ? 'Cancel' : buttonTitle}
                </FButton>
              </div>
            </div>
          )
        })}
    </div>
  )
}
