import * as React from 'react'
import { ComponentWrapper, H2, P } from '#client/components/ui'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import { ProfileQuestion } from '#shared/types'
import Permissions from '#shared/permissions'
import { useAnswers } from '../queries'

type Props = {
  userId: string
}

export const ProfileQuestionsWidget: React.FC<Props> = (props) => (
  <PermissionsValidator required={[Permissions['profile-questions'].Use]}>
    <_ProfileQuestionsWidget {...props} />
  </PermissionsValidator>
)

const _ProfileQuestionsWidget: React.FC<Props> = ({ userId }) => {
  const { data: answers = [] } = useAnswers(userId)
  if (!answers.length) {
    return <></>
  }
  return (
    <ComponentWrapper className="mt-2">
      <Section title="Get to know me">
        <div className="flex flex-col gap-6">
          {answers.map((category, idx) => {
            return (
              <div key={category.category + idx}>
                <div className="flex flex-col gap-6">
                  {category.questions.map((question: ProfileQuestion) => {
                    if (question.answer) {
                      return (
                        <div
                          className="sm:grid sm:grid-cols-[30%_65%] sm:gap-6"
                          key={question.text}
                        >
                          <P
                            className="text-text-secondary mt-0 mb-2 sm:mb-0"
                            textType="additional"
                          >
                            {question.text}
                          </P>
                          <P className="mt-0">{question.answer}</P>
                        </div>
                      )
                    }
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Section>
    </ComponentWrapper>
  )
}

// temporary copy from Public Profile, as the layout will be adjusted during refactor
const Section: React.FC<{
  title: string
  hr?: boolean
  children: JSX.Element | JSX.Element[]
}> = ({ title, hr, children }) => (
  <div className="text-left">
    {hr && <hr className="my-8" />}
    <H2 className="mb-8">{title}</H2>
    <div className="flex flex-col gap-4 sm:gap-3">{children}</div>
  </div>
)
