import { useStore } from '@nanostores/react'
import * as React from 'react'
import config from '#client/config'
import * as stores from '#client/stores'
import { ButtonsWrapper, FButton, H1 } from '#client/components/ui'
import { propEq } from '#shared/utils/fp'
import { renderMarkdown } from '#client/utils/markdown'

type Props = {
  notice: string
  onSubmit: (ev: React.MouseEvent<HTMLButtonElement>) => void
}

export const VisitNotice: React.FC<Props> = ({ notice, onSubmit }) => {
  const officeId = useStore(stores.officeId)
  const office = React.useMemo(
    () => config.offices.find(propEq('id', officeId)),
    [officeId]
  )

  return (
    <div>
      <H1 className="font-extra">{office?.name} office visit request</H1>
      <div
        style={{ minHeight: '8em' }}
        dangerouslySetInnerHTML={{
          __html: notice
            ? renderMarkdown(String(notice))
            : `<span class='text-gray-300'>Nothing to preview</span>`,
        }}
      />

      <ButtonsWrapper
        className="mt-8 flex justify-between"
        right={[
          <FButton href="/" kind="secondary">
            Cancel
          </FButton>,
          <FButton kind="primary" onClick={onSubmit}>
            Agree and continue
          </FButton>,
        ]}
      />
    </div>
  )
}
