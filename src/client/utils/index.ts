import { twMerge } from 'tailwind-merge'
import dayjs, { Dayjs } from 'dayjs'

export const cn = (
  ...chunks: Array<string | boolean | null | undefined>
): string => {
  return twMerge(...chunks.map((x) => (typeof x === 'string' ? x : '')))
}

export const toggleInArray = <T>(
  arr: T[],
  item: T,
  keepOne: boolean = false,
  maxNumber?: number,
  autoDeselect?: boolean
): T[] => {
  if (arr.includes(item)) {
    if (keepOne && arr.length === 1) {
      return arr
    }
    return arr.filter((x) => x !== item)
  } else {
    if (maxNumber) {
      if (arr.length >= maxNumber) {
        if (autoDeselect) {
          return arr.slice(1).concat(item)
        }
        return arr
      }
    }
    return arr.concat(item)
  }
}

export const generateId = (length: number = 16, prefix?: string): string => {
  const arr = new Uint8Array(length / 2)
  window.crypto.getRandomValues(arr)
  return (
    (prefix || '') +
    Array.from(arr, (x) => x.toString(16).padStart(2, '0')).join('')
  )
}

// export function getQueryParams(query: string): Record<string, string> {
//   const searchParams = new URLSearchParams(query);
//   const queryParams: Record<string, string> = {};
//   for (const [key, value] of searchParams.entries()) {
//     queryParams[key] = value;
//   }
//   return queryParams;
// }

// export const goToPage = (pathname: string, query: Record<string, string>) => {
//   const url = new URL(window.location.href)
//   url.pathname = pathname
//   for (let i in query) {
//     url.searchParams.set(i, query[i])
//   }
//   window.location.href = url.toString()
// }

export const trimString = (
  str: string,
  length: number = 32,
  postfix: string = '...'
): string => {
  if (!str) return ''
  return str.length < length ? str : str.slice(0, length) + postfix
}

export const formatDateRange = (
  startDate: string | Date | Dayjs,
  endDate: string | Date | Dayjs,
  datesOnly: boolean = false
): string => {
  const d1 = dayjs(startDate)
  const d2 = dayjs(endDate)
  const isSameDay = d1.format('DMMYY') === d2.format('DMMYY')
  const isSameMonth = isSameDay || d1.format('MYY') === d2.format('MYY')
  return isSameDay
    ? datesOnly
      ? `${d1.format('D MMMM YYYY')}`
      : `${d1.format('HH:mm')} - ${d2.format('HH:mm, D MMMM YYYY')}`
    : isSameMonth
    ? `${d1.format('D')} - ${d2.format('D MMMM YYYY')}`
    : `${d1.format('D MMMM')} - ${d2.format('D MMMM YYYY')}`
}
