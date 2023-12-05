export type ProfileQuestionAnswer = {
  id: string
  userId: string
  answers: Array<ProfileQuestionCategory>
  createdAt: Date
  updatedAt: Date
}

export type ProfileQuestionCategory = {
  category: string
  questions: Array<ProfileQuestion>
}

export type ProfileQuestionCategoryMetadata = {
  category: string
  questions: Array<string>
}

export type ProfileQuestion = {
  text: string
  answer: string
}

export type CountResponse = {
  answersCount: number
  totalQuestions: number
  progressValue: number
}
