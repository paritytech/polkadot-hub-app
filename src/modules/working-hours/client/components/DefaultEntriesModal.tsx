import * as React from 'react'
import {
  FButton,
  Icons,
  Modal,
  P,
  RoundButton,
  TimeRangePicker,
  showNotification,
} from '#client/components/ui'
import { EntryRow } from './EntryRow'
import * as fp from '#shared/utils/fp'
import { cn } from '#client/utils'
import { WorkingHoursConfig } from '#shared/types'
import {
  useDefaultEntries,
  useCreateDefaultEntry,
  useDeleteDefaultEntry,
  useUpdateDefaultEntry,
} from '../queries'
import { formatTimeString } from '../helpers'
import { MaxConsecutiveHoursWarning } from './MaxConsecutiveHoursWarning'

type DefaultEntriesModalProps = {
  onClose: () => void
  moduleConfig: WorkingHoursConfig
  refetchModuleConfig: () => void
}

export const DefaultEntriesModal: React.FC<DefaultEntriesModalProps> = ({
  onClose,
  moduleConfig,
  refetchModuleConfig,
}) => {
  const newEntryRef = React.useRef<HTMLDivElement>(null)
  const [showNewEntryInput, setShowNewEntryInput] = React.useState(false)
  const [newEntryTime, setNewEntryTime] = React.useState<[string, string]>([
    '',
    '',
  ])

  const { data: entries = [], refetch: refetchDefaultEntries } =
    useDefaultEntries()
  const refetch = () => {
    refetchDefaultEntries()
    refetchModuleConfig()
    showNotification('Your default working hours have changed', 'success')
  }
  const { mutate: createDefaultEntry } = useCreateDefaultEntry(refetch)
  const { mutate: updateDefaultEntry } = useUpdateDefaultEntry(refetch)
  const { mutate: deleteDefaultEntry } = useDeleteDefaultEntry(refetch)

  const sortedEntries = React.useMemo(() => {
    return entries.sort(
      fp.sortWith((x) => {
        const [h, m] = x.startTime.split(':').map(Number)
        return h * 60 + m
      })
    )
  }, [entries])

  const onAddEntry = React.useCallback(() => {
    setShowNewEntryInput(!showNewEntryInput)
    if (!showNewEntryInput) {
      setTimeout(() => {
        const firstTimeInput: HTMLInputElement =
          newEntryRef.current?.querySelector('input[type="time"]')!
        if (firstTimeInput) firstTimeInput.focus()
      }, 100)
    }
  }, [showNewEntryInput])
  const onChangeNewEntryTime = React.useCallback((from: string, to: string) => {
    setNewEntryTime([from, to])
  }, [])
  const onSaveNewEntry = React.useCallback(() => {
    createDefaultEntry({
      startTime: newEntryTime[0],
      endTime: newEntryTime[1],
    })
    setShowNewEntryInput(false)
    setNewEntryTime(['', ''])
  }, [newEntryTime])

  return (
    <Modal title="Your default working schedule" onClose={onClose}>
      <div className="flex flex-col gap-y-6">
        <div>
          <P>Specify your usual working schedule and use it for prefilling.</P>
          {!entries.length && (
            <P className="text-text-tertiary">
              If your default working hours are not set, the following will be
              used:{' '}
              {moduleConfig.defaultEntries
                .map(
                  (x) => `${formatTimeString(x[0])} - ${formatTimeString(x[1])}`
                )
                .join(', ')}
              .
            </P>
          )}
        </div>
        {(!!sortedEntries.length || showNewEntryInput) && (
          <div className="flex flex-col gap-y-1">
            {sortedEntries.map((x) => (
              <EntryRow
                key={x.id}
                entry={x}
                updateEntry={updateDefaultEntry}
                deleteEntry={deleteDefaultEntry}
                editable={true}
                maxConsecutiveWorkingHours={
                  moduleConfig.maxConsecutiveWorkingHours
                }
              />
            ))}
            {showNewEntryInput && (
              <div>
                <div
                  ref={newEntryRef}
                  className={cn('flex gap-x-1 items-center')}
                >
                  <Icons.EntryArrow
                    fillClassName="fill-fill-18"
                    className="-mt-1 mr-1 hidden sm:block"
                  />
                  <TimeRangePicker
                    from={newEntryTime[0]}
                    to={newEntryTime[1]}
                    inputClassName="px-0 py-[8px] w-28 text-center no-input-buttons"
                    onChange={onChangeNewEntryTime}
                  />
                  <FButton kind="primary" size="small" onClick={onSaveNewEntry}>
                    Save
                  </FButton>
                  <RoundButton
                    onClick={() => setShowNewEntryInput(false)}
                    icon="Cross"
                  />
                </div>
                <MaxConsecutiveHoursWarning
                  maxHours={moduleConfig.maxConsecutiveWorkingHours}
                  time={newEntryTime}
                />
              </div>
            )}
          </div>
        )}
        {!showNewEntryInput ? (
          <FButton kind="primary" onClick={onAddEntry} className="w-full mb-2">
            {sortedEntries.length ? 'Add one more entry' : 'Add entry'}
          </FButton>
        ) : (
          <div />
        )}
      </div>
    </Modal>
  )
}
