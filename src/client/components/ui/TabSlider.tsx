import React from 'react'
import { cn } from '#client/utils'

export const TabSlider: React.FC<{
  tabs: Record<string, string>
  headers: Record<string, Array<string>>
  content: Record<string, React.ReactNode>
  chosenTab: string
  onClick: (mode: string) => void
  className?: string
}> = ({ tabs, headers, content, chosenTab, onClick, className }) => {
  const [position, setPosition] = React.useState(0)

  const handleModeClick = (mode: string) => {
    const keys = Object.values(tabs)
    const keyPosition = keys.findIndex((val) => val === mode)
    setPosition((100 / keys.length) * keyPosition)
    onClick(mode)
  }
  return (
    <div
      className={cn('bg-fill-6 rounded-sm border-applied-stroke', className)}
    >
      <div className=" flex gap-4 flex-col">
        <div className=" flex gap-4 flex-col">
          <div className="px-[20px]">
            <div className="justify-around flex py-5">
              {Object.keys(tabs).map((key) => (
                <TabItem
                  key={key}
                  header={headers[tabs[key]]}
                  isChosen={chosenTab === tabs[key]}
                  onClick={() => handleModeClick(tabs[key])}
                />
              ))}
            </div>
            <div
              className={cn(
                `h-1 bg-accents-pink rounded-md`,
                !!tabs && `w-1/${Object.keys(tabs).length}`,
                `transition-all duration-500`
              )}
              style={{ marginLeft: `${position}%` }}
            ></div>
            <div className="border-b border-applied-separator"></div>
          </div>

          <div className="bg-white rounded-[14px] p-4 mx-1 mb-1">
            {content[chosenTab]}
          </div>
        </div>
      </div>
    </div>
  )
}

const TabItem: React.FC<{
  header: Array<string>
  isChosen: boolean
  onClick: () => void
}> = ({ header, isChosen, onClick }) => (
  <div
    className={cn(
      'text-center cursor-pointer text-base font-medium hover:text-accents-pink',
      isChosen ? 'text-accents-pink' : 'text-text-tertiary'
    )}
    onClick={onClick}
  >
    <span className="hidden sm:inline">{header[0]}</span>
    <span className="inline sm:hidden">{header[1]}</span>
  </div>
)
