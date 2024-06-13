import { FRIENDLY_DATE_FORMAT } from '#client/constants'
import dayjs from 'dayjs'

export const appearance = {
  theme: 'stripe',
  variables: {
    fontFamily: ' "Inter", sans-serif',
    borderRadius: '32px',
    accessibleColorOnColorPrimary: '#262626',
    focusOutline: 'none',
    focusBoxShadow: 'none',
    colorTextSecondary: '#868685',
  },
  rules: {
    '.Input': {
      borderColor: '#EBEBEB',
      marginBottom: '6px',
      boxShadow: 'none',
      padding: '12px 16px',
    },
    '.Input:hover': {
      borderColor: '#000000',
      outline: 'var(--focusOutline)',
    },
    '.Input:focus': {
      borderColor: '#000000',
      outline: 'var(--focusOutline)',
    },
    '.Label': {
      color: 'var(--colorTextSecondary)',
      fontSize: '16px',
      textTransform: 'lowercase',
    },
  },
}

export const hasMembershipExpired = (
  paymentDate: Date,
  type: 'day' | 'hour',
  length: number
) => {
  return dayjs().isAfter(dayjs(paymentDate).add(length, type))
}
