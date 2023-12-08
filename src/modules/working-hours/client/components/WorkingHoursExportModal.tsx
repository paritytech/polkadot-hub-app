import * as React from 'react'
import dayjs, { Dayjs } from 'dayjs'
import config from '#client/config'
import { FButton, Modal, Input, Select } from '#client/components/ui'
import { DATE_FORMAT } from '#client/constants'

export const WorkingHoursExportModal: React.FC<{
  onClose: () => void
  roles: string[]
  defaultPeriod: [Dayjs, Dayjs]
}> = ({ onClose, roles, defaultPeriod }) => {
  const [period, setPeriod] = React.useState<{ from: Dayjs; to: Dayjs }>({
    from: defaultPeriod[0],
    to: defaultPeriod[1],
  })
  const [role, setRole] = React.useState<string>('')
  const [roundUp, setRoundUp] = React.useState(false)

  const exportUrl = React.useMemo(() => {
    const url = new URL(config.appHost + '/admin-api/working-hours/export')
    url.searchParams.set('from', period.from.format(DATE_FORMAT))
    url.searchParams.set('to', period.to.format(DATE_FORMAT))
    url.searchParams.set('role', role)
    if (roundUp) {
      url.searchParams.set('roundUp', '1')
    }
    return url.toString()
  }, [period, role, roundUp])

  const onPeriodChange = React.useCallback(
    (field: 'from' | 'to') => (date: string | boolean) => {
      setPeriod((value) => ({
        ...value,
        [field]: dayjs(String(date), DATE_FORMAT),
      }))
    },
    []
  )

  React.useEffect(() => {
    if (roles.length) {
      setRole(roles[0])
    }
  }, [roles])

  return (
    <Modal onClose={onClose} title="Export working hours">
      <div className="flex flex-col gap-y-6">
        <div>
          <div className="text-text-tertiary mb-1">Period</div>
          <div className="flex gap-x-2 items-center">
            <Input
              type="date"
              value={period.from.format(DATE_FORMAT)}
              containerClassName="inline-flex"
              onChange={onPeriodChange('from')}
            />
            <Input
              type="date"
              value={period.to.format(DATE_FORMAT)}
              onChange={onPeriodChange('to')}
              containerClassName="inline-flex"
            />
          </div>
        </div>
        <div>
          <div className="text-text-tertiary mb-1">Role</div>
          <Select
            options={roles.map((x) => ({ value: x, label: x }))}
            value={role}
            onChange={setRole}
          />
        </div>
        <div>
          <Input
            name="round_up"
            type="checkbox"
            checked={roundUp}
            onChange={(v) => setRoundUp(Boolean(v))}
            inlineLabel="Include overlapping weeks outside of the provided period"
          />
        </div>
        <FButton
          className="block"
          size="normal"
          kind="primary"
          href={exportUrl}
          rel="external"
        >
          Download CSV
        </FButton>
      </div>
    </Modal>
  )
}
