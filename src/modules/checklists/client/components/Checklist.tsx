import * as React from 'react'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import { Input,P,ProgressBar,WidgetWrapper } from '#client/components/ui'
import { cn } from '#client/utils'
import { renderInlineMarkdown } from '#client/utils/markdown'
import Permissions from '#shared/permissions'
import {
Checklist as ChecklistType,
ChecklistsResponse,
GeneralChecklistItem
} from '#shared/types'

import { useMyChecklists,useUpdateMyAnswers } from '../queries'

const animationTime = 2000

export const Checklist = () => (
  <PermissionsValidator required={[Permissions.checklists.Use]}>
    <_Checklist />
  </PermissionsValidator>
)

export const _Checklist: React.FC = () => {
  const { data: checklistData = null, refetch: refetchMyChecklist } =
    useMyChecklists()
  const [isFinished, setIsFinished] = React.useState(false)

  const [data, setData] = React.useState<null | ChecklistsResponse>(null)
  const { mutate: updateMyAnswers } = useUpdateMyAnswers(() => {
    refetchMyChecklist()
  })

  const onCheck = (checklist: ChecklistType, checkbox: GeneralChecklistItem) =>
    updateMyAnswers({
      checklistId: checklist.id,
      answers: checklist.items.map((item) => ({
        ...item,
        checked: item.id === checkbox.id ? !checkbox.checked : item.checked,
      })),
    })

  React.useEffect(() => {
    if (!checklistData) {
      return
    }
    const nothingToCheck =
      checklistData.totalChecked === checklistData.totalItems
    if (nothingToCheck) {
      const isLastStep =
        !!data &&
        data.totalItems - data.totalChecked === 1 &&
        !checklistData.totalProgress
      if (isLastStep) {
        setData({
          ...checklistData,
          totalProgress: 100,
        })
        setIsFinished(true)
        setTimeout(() => setData(null), animationTime)
        return
      } else {
        setData(null)
        return
      }
    }
    setData(checklistData)
  }, [checklistData])

  if (!data) {
    return <></>
  }

  return (
    <WidgetWrapper title="Checklist">
      <div className=" h-10 gap-2 items-center">
        <P>
          {isFinished
            ? 'You did it!'
            : `${data.totalChecked} finished out of ${data.totalItems}`}
        </P>
      </div>
      <ProgressBar
        progress={data?.totalProgress}
        activateAnimation={true}
        animationTime={animationTime}
      />
      {data?.result?.map((ch: ChecklistType) => (
        <div className="mb-6" key={ch.id}>
          <div className="mt-6 mb-3 flex justify-between items-baseline">
            <P className="font-medium text-text-secondary text-base">
              {ch.title}
            </P>
            <P className="text-sm text-text-tertiary w-10">
              {ch.progress} / {ch.items.length}
            </P>
          </div>
          <div className="flex flex-col gap-4 md:gap-2">
            {ch?.items.map((x) => (
              <div
                key={x.id}
                className={cn(!!x.checked && 'opacity-50 line-through')}
              >
                <Input
                  name={x.id}
                  type="checkbox"
                  checked={x.checked}
                  className="text-text-secondary"
                  onChange={() => onCheck(ch, x)}
                  inlineLabel={
                    <span
                      dangerouslySetInnerHTML={{
                        __html: renderInlineMarkdown(x.label),
                      }}
                    />
                  }
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </WidgetWrapper>
  )
}
