import * as React from 'react'
import {
  FButton,
  Icons,
  RoundButton,
  TimeRangePicker,
} from '#client/components/ui'
import {
  DefaultWorkingHoursEntry,
  DefaultWorkingHoursEntryUpdateRequest,
  WorkingHoursEntry,
  WorkingHoursEntryUpdateRequest,
} from '#shared/types'
import { MaxConsecutiveHoursWarning } from './MaxConsecutiveHoursWarning'

type EntryRowProps = {
  entry: WorkingHoursEntry | DefaultWorkingHoursEntry
  deleteEntry: (id: string) => void
  updateEntry: (
    value:
      | WorkingHoursEntryUpdateRequest
      | DefaultWorkingHoursEntryUpdateRequest
  ) => void
  editable: boolean
  maxConsecutiveWorkingHours?: number
}

export const EntryRow: React.FC<EntryRowProps> = ({
  entry,
  deleteEntry,
  updateEntry,
  editable = false,
  maxConsecutiveWorkingHours,
}) => {
  const [time, setTime] = React.useState<[string, string]>([
    entry.startTime,
    entry.endTime,
  ])
  const [changed, setChanged] = React.useState(false)
  const onDelete = React.useCallback(() => {
    deleteEntry(entry.id)
  }, [entry])
  const onChange = React.useCallback(
    (from: string, to: string) => {
      if (!editable) return
      setTime([from, to])
      setChanged(true)
    },
    [editable]
  )
  const onSave = React.useCallback(() => {
    updateEntry({ id: entry.id, startTime: time[0], endTime: time[1] })
    setChanged(false)
  }, [entry, time])
  const onCancel = React.useCallback(() => {
    setTime([entry.startTime, entry.endTime])
    setChanged(false)
  }, [time])
  return (
    <div>
      <div className="flex gap-x-1 items-center">
        <Icons.EntryArrow
          fillClassName="fill-fill-18"
          className="-mt-1 mr-1 hidden sm:block"
        />
        <TimeRangePicker
          from={time[0]}
          to={time[1]}
          inputClassName="px-0 py-[8px] w-28 text-center no-input-buttons"
          onChange={onChange}
        />
        {editable && (
          <>
            {changed ? (
              <>
                <FButton kind="primary" size="small" onClick={onSave}>
                  Save
                </FButton>
                <FButton kind="secondary" size="small" onClick={onCancel}>
                  Cancel
                </FButton>
              </>
            ) : (
              <RoundButton onClick={onDelete} icon="Cross" />
            )}
          </>
        )}
      </div>
      {editable && changed && (
        <MaxConsecutiveHoursWarning
          maxHours={maxConsecutiveWorkingHours}
          time={time}
        />
      )}
    </div>
  )
}
