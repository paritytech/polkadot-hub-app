import React from 'react'
import { FButton, LabelWrapper, ProgressBar } from '#client/components/ui'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import * as stores from '#client/stores'
import Permissions from '#shared/permissions'
import { useMyAnswersCount } from '../queries'

const CONFIRM_MESSAGE =
  'Do you want to continue to answering questions? All unsaved profile changes will be lost.'

type Props = {
  isOuterFormChanged: boolean
}

export const ProfileQuestionsProgress: React.FC<Props> = (props) => (
  <PermissionsValidator required={[Permissions['profile-questions'].Use]}>
    <_ProfileQuestionsProgress {...props} />
  </PermissionsValidator>
)

const _ProfileQuestionsProgress: React.FC<Props> = ({ isOuterFormChanged }) => {
  const { data: countData } = useMyAnswersCount()

  return (
    <div>
      <LabelWrapper label="Get to know me" className="text-left p-0">
        <div className="flex flex-col gap-4 mt-6 mb-8">
          <ProgressBar
            progress={countData?.progressValue ?? 0}
            className="w-[300px]"
          />
          <p className="text-text-tertiary">
            {!countData?.answersCount
              ? 'No questions have been answered yet.'
              : `Answered questions: ${countData?.answersCount} / ${countData?.totalQuestions}`}{' '}
          </p>
          <FButton
            kind="secondary"
            onClick={(event: React.MouseEvent) => {
              event.preventDefault()
              if (isOuterFormChanged) {
                if (window.confirm(CONFIRM_MESSAGE)) {
                  stores.goTo('profileQuestions')
                }
              } else {
                stores.goTo('profileQuestions')
              }
            }}
            className="w-fit"
          >
            Answer Questions
          </FButton>
        </div>
      </LabelWrapper>
    </div>
  )
}
