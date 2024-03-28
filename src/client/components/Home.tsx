import * as React from 'react'
import { useStore } from '@nanostores/react'
import { Icons, Icon } from '#client/components/ui/Icons'
import config from '#client/config'
import * as stores from '#client/stores'
import { cn } from '#client/utils'
import { renderComponent } from '#client/utils/portal'
import { LayoutTabId } from '#shared/types'

const TABS: Array<{
  id: LayoutTabId
  label: string
  icon: string
}> = [
  {
    id: 'office',
    label: 'Office',
    icon: 'Clock',
  },
  {
    id: 'events',
    label: 'Events',
    icon: 'Calendar',
  },
  {
    id: 'news',
    label: 'News',
    icon: 'Speaker',
  },
]

export const Home: React.FC = () => {
  const layoutView = useStore(stores.layoutView)
  const [tab, setTab] = React.useState<LayoutTabId>('office')
  const officeId = useStore(stores.officeId)
  const renderWidget = React.useMemo(
    () => renderComponent({}, officeId),
    [officeId]
  )
  return (
    <>
      {/* fixed content */}
      {layoutView === 'mobile' && (
        <>
          {config.layout.mobile.fixed.map(renderWidget)}
          <Tabs currentTab={tab} onChangeTab={(tabId) => setTab(tabId)} />
        </>
      )}

      {/* grid */}
      <div
        className={cn(
          'grid',
          layoutView === 'mobile' && 'grid-cols-[minmax(0,_1fr)]',
          layoutView === 'tablet' && 'grid-cols-[minmax(0,_1fr)]',
          layoutView === 'desktop' &&
            'grid-cols-[minmax(0,_25fr)_minmax(0,_75fr)]',
          'gap-x-4'
        )}
      >
        {/* mobile columns */}
        {layoutView === 'mobile' && (
          <div>{config.layout.mobile[tab].map(renderWidget)}</div>
        )}
        {/* desktop first column */}
        {layoutView === 'desktop' && (
          <div>{config.layout.desktop.sidebar.map(renderWidget)}</div>
        )}
        {/* desktop second column === tablet first column */}
        {(layoutView === 'desktop' || layoutView === 'tablet') && (
          <div>
            {config.layout.desktop.main.map((row) => (
              <div
                className={cn(
                  'grid items-stretch',
                  row.length == 2 ? 'grid grid-cols-2 gap-2' : 'grid-cols-1'
                )}
              >
                {row.map(renderWidget)}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

const Tabs: React.FC<{
  currentTab: string
  onChangeTab: (tabId: LayoutTabId) => void
}> = ({ currentTab, onChangeTab }) => {
  const onTabClick = React.useCallback(
    (tabId: LayoutTabId) => (ev: React.MouseEvent) => {
      ev.preventDefault()
      onChangeTab(tabId)
    },
    []
  )
  return (
    <div className="bg-bg-primary flex rounded-sm px-4 mb-1 md:mb-2">
      {TABS.map((tab) => {
        const IconComponent = Icons[tab.icon as Icon]
        return (
          <button
            key={tab.id}
            className={cn(
              'flex-1 flex border-b-[3px] items-center justify-center py-3 font-semibold',
              currentTab === tab.id
                ? 'text-accents-pink border-accents-pink'
                : 'text-text-tertiary border-transparent'
            )}
            onClick={onTabClick(tab.id)}
          >
            <IconComponent
              className="mr-2"
              fillClassName={cn(
                currentTab === tab.id
                  ? 'fill-accents-pink'
                  : 'fill-text-tertiary'
              )}
            />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
