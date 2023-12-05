import React from 'react'
import { Button, FButton, Icons, RoundButton } from '#client/components/ui'
import { cn } from '#client/utils'

export const TimeSlotsListing: React.FC<{
  slots: Array<string>
  chosenTimeSlot: string
  handleChoosingTimeSlot: (slot: string) => void
}> = ({ slots, chosenTimeSlot, handleChoosingTimeSlot }) => {
  const timeSlotStyle = 'border text-center w-full sm:w-40 rounded-md px-4'
  if (chosenTimeSlot) {
    return (
      <div className="flex gap-3">
        <div className="h-[52px] w-[52px]">
          <RoundButton
            icon="SimpleArrowButton"
            onClick={() => handleChoosingTimeSlot('')}
            className="fill h-full w-full bg-transparent border-0 p-0 hover:bg-transparent focus:outline-none focus:ring-0"
          ></RoundButton>
        </div>

        <div
          className={cn(
            timeSlotStyle,
            'sm:w-full bg-fill-6 text-l font-extra py-2 border-0'
          )}
        >
          {chosenTimeSlot}
        </div>
      </div>
    )
  }
  return (
    <div className="flex gap-2 mt-3 flex-wrap">
      {!!slots &&
        slots.map((slot) => (
          <Button
            key={slot}
            className={cn(
              timeSlotStyle,
              'py-3 hover:cursor-pointer hover:bg-fill-6 border-applied-stroke'
            )}
            onClick={() => handleChoosingTimeSlot(slot)}
          >
            {slot}
          </Button>
        ))}
    </div>
  )
}
