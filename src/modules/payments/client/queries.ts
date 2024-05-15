import { useQuery, useMutation } from 'react-query'
import { AxiosError, AxiosResponse } from 'axios'
import { api } from '#client/utils/api'
// import { Entity } from '#shared/types'

export const useCreatePaymentIntent = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, any>(
    (data: any) => api.post('/user-api/payments/intents', data),
    { onSuccess: cb }
  )

export const useCreatePayment = () =>
  useMutation<AxiosResponse, AxiosError, any>((data: any) =>
    api.post('/user-api/payments/payments', data)
  )

export const useUpdatePayment = () =>
  useMutation<AxiosResponse, AxiosError, any>((data: any) =>
    api.put('/user-api/payments/payments', data)
  )

export const useGetPayment = (paymentId: string) => {
  const path = `/user-api/payments/payments/${paymentId}`
  return useQuery<any, AxiosError>(
    path,
    async () => (await api.get<any>(path)).data,
    { enabled: !!paymentId }
  )
}

export const useCurrencyPrice = (currency: string) => {
  const path = `/user-api/payments/price/dot/${currency}`
  return useQuery<any, AxiosError>(
    path,
    async () => (await api.get<any>(path)).data
  )
}

export const useMembership = (membershipId: string) => {
  return {
    data: {
      name: 'Casual',
      length: '30 days',
      amount: 1,
      currency: 'EUR',
      description: 'Casual access to the space, without a desk.',
      url: 'http://localhost:3000/membership.png',
      location: 'berlin',
    },
  }
}
