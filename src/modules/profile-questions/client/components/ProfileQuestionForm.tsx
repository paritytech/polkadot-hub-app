import * as React from 'react'
import {
  BackButton,
  ComponentWrapper,
  FButton,
  H1,
  H2,
  P,
  ProgressDots,
  Textarea,
} from '#client/components/ui'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import { goTo } from '#client/stores/router'
import { ProfileQuestion, ProfileQuestionCategory } from '#shared/types'
import { cn } from '#client/utils'
import Permissions from '#shared/permissions'
import { useQuestions, useUpdateAnswers } from '../queries'

export const ProfileQuestionForm: React.FC = () => (
  <PermissionsValidator
    required={[Permissions['profile-questions'].Use]}
    onReject={() => goTo('profile')}
  >
    <_ProfileQuestionForm />
  </PermissionsValidator>
)

const _ProfileQuestionForm: React.FC = () => {
  const { data: questionsData = [], refetch: refetchQuestions } = useQuestions()
  const [questionCategories, setQuestionCategories] =
    React.useState<Array<ProfileQuestionCategory>>()
  const [stepIndex, setStepIndex] = React.useState(0)
  const [totalSteps, setTotalSteps] = React.useState(0)

  const { mutate: updateAnswers } = useUpdateAnswers(() => {
    refetchQuestions()
  })
  const isLast = React.useMemo(
    () => stepIndex + 1 === totalSteps,
    [stepIndex, totalSteps]
  )

  React.useEffect(() => {
    if (questionsData.length) {
      setQuestionCategories(questionsData)
      setTotalSteps(questionsData.length)
    }
  }, [stepIndex, questionsData])

  const handleChange = (category: string, id: number, answer: string) => {
    // @todo sanitize these answers ?
    if (questionCategories) {
      const questionAnswer: Array<ProfileQuestion> = questionCategories[
        stepIndex
      ].questions.map((q: ProfileQuestion, idx: number) => ({
        text: q.text,
        answer: idx === id ? answer : q.answer,
      }))

      setQuestionCategories(
        questionCategories?.map((cat: ProfileQuestionCategory) => {
          if (cat.category === category) {
            return {
              category,
              questions: questionAnswer,
            }
          }
          return cat
        })
      )
    }
  }

  if (!questionCategories) {
    return <></>
  }

  return (
    <ComponentWrapper>
      <BackButton />
      <div className="flex flex-col sm:flex-row sm:justify-between items-center mt-4">
        <H1 className="text-xl">Get to know me</H1>
        <ProgressDots total={totalSteps} value={stepIndex + 1} />
      </div>

      {questionCategories[stepIndex] && (
        <div className="mt-8">
          <H2 className="capitalize">
            {questionCategories[stepIndex].category}
          </H2>
          {questionCategories[stepIndex].questions.map((q, idx: number) => (
            <div
              className="sm:grid sm:grid-cols-[30%_65%] sm:gap-6 mt-10"
              key={idx}
            >
              <P className="text-sm text-text-secondary mt-0">{q.text}</P>
              <Textarea
                value={q.answer}
                placeholder=""
                className="flex flex-col "
                onChange={(e) =>
                  handleChange(questionCategories[stepIndex].category, idx, e)
                }
              ></Textarea>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <div
          className={cn(
            'flex gap-2 flex-col sm:flex-row',
            `${stepIndex === 0 ? 'justify-end' : 'justify-between'}`
          )}
        >
          {stepIndex > 0 && (
            <FButton
              kind="secondary"
              onClick={() => setStepIndex(stepIndex - 1)}
              className="h-14 px-8 py-[18px]"
            >
              Back
            </FButton>
          )}
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end w-full">
            {!isLast && (
              <FButton
                kind="secondary"
                onClick={() => setStepIndex(stepIndex + 1)}
                className="h-14"
              >
                Skip
              </FButton>
            )}
            <FButton
              kind="primary"
              type="submit"
              onClick={() => {
                updateAnswers(questionCategories)
                if (isLast) {
                  goTo('profile')
                } else {
                  setStepIndex(stepIndex + 1)
                }
              }}
            >
              {isLast ? 'Save' : 'Next'}
            </FButton>
          </div>
        </div>
      </div>
    </ComponentWrapper>
  )
}
