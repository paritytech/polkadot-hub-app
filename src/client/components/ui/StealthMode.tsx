import React from 'react'
import { SwitchButton } from './Button'
import { P } from './Text'

type Props = {
  title?: string
  subtitle?: string
  originalValue: boolean
  onToggle: (value: boolean) => void
}

export const StealthMode: React.FC<Props> = ({
  title = "I'm in stealth mode",
  subtitle = "Don't show me on this list",
  originalValue,
  onToggle,
}) => {
  const [stealthMode, setStealthMode] = React.useState(originalValue)
  const onToggleStealthMode = React.useCallback((value: boolean) => {
    setStealthMode(value)
    onToggle(value)
  }, [])

  return (
    <div className="pt-6 flex mt-6 text-sm items-center border border-applied-separator border-t-1 border-l-0 border-r-0 border-b-0">
      <div className="flex-1">
        <P>
          {title} <br />
          <span className="text-text-tertiary">{subtitle}</span>
        </P>
      </div>
      <div>
        <SwitchButton
          switchId="stealth_mode"
          checked={stealthMode}
          onChange={onToggleStealthMode}
        />
      </div>
    </div>
  )
}
