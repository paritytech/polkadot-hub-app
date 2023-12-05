import { AxiosError, AxiosResponse } from 'axios'
import { useMutation, useQuery } from 'react-query'
import { api } from '#client/utils/api'
import { CountResponse, ProfileQuestionCategory } from '#shared/types'

export const useQuestions = () => {
  const path = `/user-api/profile-questions/questions`
  return useQuery<ProfileQuestionCategory[], AxiosError>(
    path,
    async () => (await api.get<ProfileQuestionCategory[]>(path)).data,
    {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )
}

export const useAnswers = (userId: string) => {
  const path = `/user-api/profile-questions/answers`
  return useQuery<ProfileQuestionCategory[], AxiosError>(
    [path, { userId }],
    async ({ queryKey }) => (await api.get<ProfileQuestionCategory[]>(path, { params: queryKey[1] })).data,
    {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )
}

export const useMyAnswersCount = () => {
  const path = `/user-api/profile-questions/answers/count`
  return useQuery<CountResponse, AxiosError>(
    path,
    async () => (await api.get<CountResponse>(path)).data
  )
}

export const useUpdateAnswers = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, ProfileQuestionCategory[]>(
    (data: ProfileQuestionCategory[]) => {
      return api.post('/user-api/profile-questions/questions', data)
    },
    { onSuccess: cb }
  )
