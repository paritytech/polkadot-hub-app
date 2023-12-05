import dayjs from 'dayjs'
import React from 'react'
import { FButton, Modal, P } from '#client/components/ui'
import { OfficeRoom } from '#shared/types'

export type BookingModalProps = {
  title: string
  options: {
    date: string
    timeSlot: string
    roomDetails: OfficeRoom
  }
  onClose: () => void
  onConfirm: () => void
}

export const DateHeader = ({ dateValue }: { dateValue: string | Date }) => (
  <P textType="additional" className="mt-0 mb-0 font-medium">
    <span className="text-accents-red">
      {dayjs(dateValue).isToday() ? `Today` : dayjs(dateValue).format('dddd')},{' '}
    </span>
    <span className="text-accents-red">
      {dayjs(dateValue).format('D MMMM')}
    </span>
  </P>
)

export const MeetingRoomBookingModal: React.FC<BookingModalProps> = ({
  title,
  options,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="rounded-sm border border-applied-stroke w-full p-4 mt-4">
        <div className="flex gap-8 justify-between">
          <div className="my-2">
            <div className="flex flex-col sm:flex-row text-accents-red gap-2 text-sm items-start sm:items-center mb-2">
              <DateHeader dateValue={options?.date} />
              <span className="hidden sm:block"> {'·'}</span>
              <P textType="additional" className="font-medium m-0">
                {options?.timeSlot}
              </P>
            </div>
            <P className="font-medium my-0 mb-1 ">
              {options?.roomDetails?.name}
            </P>
            <P
              textType="additional"
              className="text-text-tertiary my-0 break-words"
            >
              {options?.roomDetails?.description} {'·'}{' '}
              {options?.roomDetails?.capacity} people
            </P>
          </div>
          <img
            src={options?.roomDetails?.photo}
            className="rounded-sm h-[120px] w-[120px] sm:h-[88px] sm:w-[88px]"
            style={{ objectFit: 'cover' }}
          />
        </div>
      </div>
      <div className="flex gap-2 justify-between mt-8">
        <FButton kind="secondary" onClick={onClose} className="w-full text-md">
          Cancel
        </FButton>
        <FButton kind="primary" className="w-full text-md" onClick={onConfirm}>
          Book
        </FButton>
      </div>
    </Modal>
  )
}
