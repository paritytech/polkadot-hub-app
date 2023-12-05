import {
  ComponentWrapper,
  H1,
  H2,
  HR,
  WidgetWrapper,
} from '#client/components/ui'
import { renderMarkdown } from '#client/utils/markdown'
import * as React from 'react'
import { useActiveAnnouncements } from '../queries'
import { useStore } from '@nanostores/react'
import * as stores from '#client/stores'

export const Announcement: React.FC<{
  title: string
  content: string
}> = () => {
  const officeId = useStore(stores.officeId)
  const { data: announcements } = useActiveAnnouncements(officeId)
  if (!announcements?.length) {
    return <></>
  }
  return (
    <WidgetWrapper>
      <div className="flex flex-col gap-y-4">
        {announcements &&
          announcements?.map((ann, i) => {
            return (
              <div key={ann.id}>
                {!!i && <HR className="mb-4" />}
                <div>
                  <H2>{ann.title}</H2>
                  <div
                    className="phq_markdown-content text-gray-800"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(ann.content),
                    }}
                  />
                </div>
              </div>
            )
          })}
      </div>
    </WidgetWrapper>
  )
}
