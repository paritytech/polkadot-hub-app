import * as React from 'react'
import dayjs from 'dayjs'
import {
  ComponentWrapper,
  FButton,
  HR,
  HeaderWrapper,
  Icons,
  LoaderSpinner,
} from '#client/components/ui'
import { renderMarkdown } from '#client/utils/markdown'
import { WorkingHoursEditorWeek } from './WorkingHoursEditorWeek'
import { WorkingHoursEditorMonth } from './WorkingHoursEditorMonth'
import { DefaultEntriesModal } from './DefaultEntriesModal'
import * as stores from '#client/stores'
import * as fp from '#shared/utils/fp'
import { cn } from '#client/utils'
import { useConfig } from '../queries'
import { formatTimeString } from '../helpers'

export const WorkingHoursEditor: React.FC = () => {
  const [viewMode, setViewMode] = React.useState<'week' | 'month'>(
    (() => {
      const url = new URL(window.location.href)
      const view = url.searchParams.get('view')
      if (view === 'month') {
        return 'month'
      }
      return 'week'
    })()
  )
  const [showDefaultEntriesModal, setShowDefaultEntriesModal] =
    React.useState(false)

  const {
    data: moduleConfig = null,
    isFetched: isModuleConfigFetched,
    refetch: refetchModuleConfig,
  } = useConfig()

  React.useEffect(() => {
    if (isModuleConfigFetched && !moduleConfig) {
      setTimeout(() => stores.goTo('home'), 0)
    }
  }, [isModuleConfigFetched, moduleConfig])

  React.useEffect(() => {
    const url = new URL(window.location.href)
    const view = url.searchParams.get('view')
    if (view !== viewMode) {
      url.searchParams.set('view', viewMode)
      window.history.replaceState({}, '', url.toString())
    }
  }, [viewMode])

  return !!moduleConfig ? (
    <div className="flex flex-col gap-y-2">
      {/* header */}
      <ComponentWrapper>
        <HeaderWrapper title="Working Hours">
          {moduleConfig.policyText && (
            <>
              <div
                className="phq_markdown-content "
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(moduleConfig.policyText),
                }}
              />
              <HR className="my-6" />
            </>
          )}

          <div className="my-4 text-text-tertiary">
            Your agreed working week: {moduleConfig.weeklyWorkingHours}h (
            {moduleConfig.workingDays
              .map((x) => dayjs().day(x).format('dddd'))
              .join(', ')}
            )
          </div>

          {/* {moduleConfig.policyText && <></>} */}
          <div>
            {moduleConfig.personalDefaultEntries.length ? (
              <div className="-my-2">
                Your schedule:{' '}
                {moduleConfig.personalDefaultEntries
                  .sort(
                    fp.sortWith((x) => {
                      const [h, m] = x[0].split(':').map(Number)
                      return h * 60 + m
                    })
                  )
                  .map(
                    (x) =>
                      `${formatTimeString(x[0])} - ${formatTimeString(x[1])}`
                  )
                  .join(', ')}{' '}
                <FButton
                  kind="link"
                  size="small"
                  onClick={() => setShowDefaultEntriesModal(true)}
                >
                  Edit
                </FButton>
              </div>
            ) : (
              <div className="-mx-2 -mb-2 mt-4">
                <FButton
                  kind="link"
                  size="small"
                  onClick={() => setShowDefaultEntriesModal(true)}
                  className="w-full"
                >
                  Configure your default working schedule
                </FButton>
              </div>
            )}
          </div>
        </HeaderWrapper>
      </ComponentWrapper>

      <ComponentWrapper>
        <div className="flex gap-x-2 mb-2 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6">
          <FButton
            kind="link"
            className={cn(
              'font-medium',
              'flex-1 py-4',
              viewMode === 'week'
                ? 'bg-accents-pink/5 hover:bg-accents-pink/5'
                : 'text-text-tertiary'
            )}
            onClick={() => setViewMode('week')}
          >
            <div className="flex items-cetner justify-center gap-x-3">
              <Icons.Pencil
                className="translate-y-[2px]"
                fillClassName={
                  viewMode === 'week'
                    ? 'fill-accents-pink'
                    : 'fill-text-tertiary'
                }
              />
              <span className="block sm:hidden">Edit</span>
              <span className="hidden sm:block">Edit working time</span>
            </div>
          </FButton>
          <FButton
            kind="link"
            className={cn(
              'font-medium',
              'flex-1 py-4',
              viewMode === 'month'
                ? 'bg-accents-pink/5 hover:bg-accents-pink/5'
                : 'text-text-tertiary'
            )}
            onClick={() => setViewMode('month')}
          >
            <div className="flex items-cetner justify-center gap-x-3">
              <Icons.Calendar
                className="translate-y-[2px]"
                fillClassName={
                  viewMode === 'month'
                    ? 'fill-accents-pink'
                    : 'fill-text-tertiary'
                }
              />
              <span className="block sm:hidden">Review</span>
              <span className="hidden sm:block">Review data</span>
            </div>
          </FButton>
        </div>

        {/* week */}
        {viewMode === 'week' && (
          <WorkingHoursEditorWeek moduleConfig={moduleConfig} />
        )}

        {/* month */}
        {viewMode === 'month' && (
          <WorkingHoursEditorMonth moduleConfig={moduleConfig} />
        )}
      </ComponentWrapper>

      {/* extra */}
      {showDefaultEntriesModal && (
        <DefaultEntriesModal
          moduleConfig={moduleConfig}
          onClose={() => setShowDefaultEntriesModal(false)}
          refetchModuleConfig={refetchModuleConfig}
        />
      )}
    </div>
  ) : (
    <div className="min-h-[300px]">
      <LoaderSpinner />
    </div>
  )
}
