import { useQuery, useMutation } from 'react-query'
import { AxiosError, AxiosResponse } from 'axios'
import { api } from '#client/utils/api'
import { PaymentItemWithUser } from '../types'

export const useCreatePaymentIntent = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, any>(
    (data: any) => api.post('/user-api/payments/intents', data),
    { onSuccess: cb }
  )

export const useCreatePayment = () =>
  useMutation<AxiosResponse, AxiosError, PaymentItem>((data: PaymentItem) =>
    api.post('/user-api/payments/payments', data)
  )

export const useUpdatePayment = () =>
  useMutation<AxiosResponse, AxiosError, any>((data: any) =>
    api.put('/user-api/payments/payments', data)
  )

export const useGetPayment = (paymentId: string) => {
  const path = `/user-api/payments/payments/${paymentId}`
  return useQuery<PaymentItemWithUser, AxiosError>(
    path,
    async () => (await api.get<PaymentItemWithUser>(path)).data,
    { enabled: !!paymentId }
  )
}

export const useCurrencyPrice = () => {
  const path = `/user-api/payments/price/dot`
  return useQuery<any, AxiosError>(
    path,
    async () => (await api.get<any>(path)).data
  )
}

export const useGetPayments = (searchQuery: string) => {
  const path = `/admin-api/payments/payments?q=${searchQuery}`
  return useQuery<any, AxiosError>(
    path,
    async () => (await api.get<any>(path)).data
  )
}

export const useGetInvoice = (paymentId: string) => {
  const path = `/admin-api/payments/payments/invoice/${paymentId}`
  return useQuery<any, AxiosError>(
    path,
    async () => (await api.get<any>(path)).data,
    { enabled: !!paymentId }
  )
}

export const useSendInvoice = (cb: () => void) =>
  useMutation<AxiosResponse, AxiosError, any>(
    (data: any) => api.post(`/user-api/payments/invoices`, data),
    { onSuccess: cb }
  )

// @todo: temporary, for testing only
export const useMembership = (membershipId: string) => {
  return {
    data: {
      id: '1231231',
      name: 'Casual',
      duration: '30',
      type: 'day', // type 'hour' ?
      amount: 1,
      currency: 'EUR',
      description: 'Casual access to the space, without a desk.',
      url: 'http://localhost:3000/membership.png',
      location: 'berlin',
    },
  }
}
