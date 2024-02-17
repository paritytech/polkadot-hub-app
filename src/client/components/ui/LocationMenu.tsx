import config from '#client/config'
import * as stores from '#client/stores'
import React, { useState } from 'react'
import { DropDown } from './DropDown'
import { H1 } from './Text'

import { by } from '#shared/utils/fp'
import { useStore } from '@nanostores/react'
import { Icons } from './Icons'
const officeByOfficeId = config.offices.reduce(by('id'), {})

const Row: React.FC<{
  label: string
  chosen: boolean
  onClick: (value: string) => void
}> = ({ label, chosen, onClick }) => {
  if (chosen) {
    return (
      <div className="flex justify-between">
        <H1 className="text-accents-pink mb-0 px-1 py-2">{label}</H1>
        <Icons.Check />
      </div>
    )
  }
  return (
    <H1
      className="text-text-tertiary mb-0 px-1 py-2 hover:cursor-pointer hover:bg-applied-hover rounded-tiny"
      onClick={() => onClick(label)}
    >
      {label}
    </H1>
  )
}

export const LocationMenu: React.FC<{
  description?: string
  defaultLocation?: string | null
}> = ({ description = 'Choose office', defaultLocation }) => {
  const [open, setOpen] = useState(false)
  const officeId = useStore(stores.officeId) ?? defaultLocation
  const [chosenLocation, setLocation] = useState(officeId)
  const ref = React.useRef(null)

  const changeOffice = (officeId: string) => {
    stores.setAppStateItem('officeId', officeId)
    setOpen(false)
    setLocation(officeId)
  }

  const rows = config.offices.map((office) => (
    <Row
      key={office.id}
      label={office.name}
      onClick={() => changeOffice(office.id)}
      chosen={chosenLocation === office.id}
    />
  ))

  const officesNumber = React.useMemo(() => config.offices.length, [])

  return (
    <div className="w-fit-content" ref={ref}>
      <div className="flex hover:cursor-pointer">
        <H1 className="mb-0 mr-1 leading-none flex items-center">
          <a href="/">{config.appLogoPrefix}</a>
        </H1>
        <div className="flex relative">
          <H1
            className="text-accents-pink mb-0 leading-none flex items-center"
            onClick={() => setOpen(!open)}
          >
            {officesNumber > 1 ? (
              <>{officeByOfficeId[chosenLocation]?.name}</>
            ) : (
              <a href="/">{officeByOfficeId[chosenLocation]?.name}</a>
            )}
          </H1>

          {officesNumber > 1 && (
            <>
              <div onClick={() => setOpen(!open)} className="">
                <Icons.Arrow />
              </div>
              {open && (
                <DropDown
                  ref={ref}
                  title={description}
                  rows={rows}
                  onClose={() => setOpen(false)}
                  className={
                    'sm:w-60 px-2 py-4 sm:mt-0 sm:gap-2 sm:left-0 sm:top-10'
                  }
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
