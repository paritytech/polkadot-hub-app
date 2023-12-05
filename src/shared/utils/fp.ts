export const map =
  <T, R>(fn: (el: T, index?: number, arr?: T[]) => R) =>
  (array: T[]): R[] =>
    array.map(fn)

export const prop =
  <O, F extends keyof O>(field: F) =>
  (obj: O): O[F] =>
    obj[field]

export const propEq =
  <O, F extends keyof O>(field: F, ref: O[F]) =>
  (obj: O): boolean =>
    obj[field] === ref

export const propNotEq =
  <O>(field: keyof O, ref: any) =>
  (obj: O): boolean =>
    obj[field] !== ref

export const propIn =
  <O>(field: keyof O, refArray: any[]) =>
  (obj: O): boolean =>
    refArray.includes(obj[field])

export const propNotIn =
  <O>(field: keyof O, refArray: any[]) =>
  (obj: O): boolean =>
    !refArray.includes(obj[field])

export const groupBy =
  <O, F extends keyof O>(field: F) =>
  (acc: Record<string, O[]>, item: O, _index: number, _array: O[]) => {
    const key = String(item[field])
    return {
      ...acc,
      [key]: acc[key] ? [...acc[key], item] : [item],
    }
  }

export const by =
  <O, F extends keyof O>(field: F) =>
  (acc: Record<string, O>, item: O, _index: number, _array: O[]) => {
    const key = String(item[field])
    return {
      ...acc,
      [key]: item,
    }
  }

export const uniq = <T>(acc: T[], item: T, _index: number, _array: T[]) =>
  acc.includes(item) ? acc : [...acc, item]

export const eq =
  (value: any) =>
  (refValue: any): boolean =>
    refValue === value

export const notEq =
  (value: any) =>
  (refValue: any): boolean =>
    refValue !== value

export const last = <T>(arr: T[]): T => arr[arr.length - 1]

export const first = <T>(arr: T[]): T => arr[0]

export const nonNullable = <T>(value: T): value is NonNullable<T> =>
  value !== null && value !== undefined

export const trim = (value: string) => (value?.trim ? value.trim() : value)

export function throttle(func: Function, delay: number = 300) {
  let isThrottled = false
  let savedArgs: any
  let savedThis: any
  function wrapper(this: any) {
    if (isThrottled) {
      // eslint-disable-next-line prefer-rest-params
      savedArgs = arguments
      savedThis = this
      return
    }
    // eslint-disable-next-line prefer-rest-params
    func.apply(this, arguments)
    isThrottled = true
    setTimeout(function () {
      isThrottled = false
      if (savedArgs) {
        wrapper.apply(savedThis, savedArgs)
        savedArgs = savedThis = null
      }
    }, delay)
  }
  return wrapper
}

export const path =
  (pathArray: string[]) =>
  (obj: any): any => {
    let currentObj = obj
    for (let i = 0; i < pathArray.length; i++) {
      if (currentObj[pathArray[i]] === undefined) {
        return undefined
      }
      currentObj = currentObj[pathArray[i]]
    }
    return currentObj
  }

export const pick =
  <O extends Record<string, any>, F extends string>(
    fields: readonly F[] = []
  ) =>
  (obj: O): Pick<O, F> => {
    return fields.reduce((acc, field) => {
      return { ...acc, [field]: obj[field] }
    }, {} as Pick<O, F>)
  }

export const omit =
  <F extends string>(fields: readonly F[] = []) =>
  <O extends Record<string, any>>(obj: O): Omit<O, F> => {
    return Object.keys(obj).reduce((acc, x) => {
      // @ts-ignore FIXME:
      if (!fields.includes(x)) {
        return { ...acc, [x]: obj[x] }
      }
      return acc
    }, {} as Omit<O, F>)
  }

export const sortBy =
  <O, F extends keyof O>(field: F, order: 'asc' | 'desc' = 'asc') =>
  (a: O, b: O): 1 | -1 | 0 => {
    const aValue = a[field]
    const bValue = b[field]
    const ascOp: 1 | -1 = order === 'asc' ? 1 : -1
    const descOp: 1 | -1 = order === 'asc' ? -1 : 1
    return aValue > bValue ? ascOp : aValue < bValue ? descOp : 0
  }

export const sortWith =
  <O>(fn: (element: O) => string | number, order: 'asc' | 'desc' = 'asc') =>
  (a: O, b: O): 1 | -1 | 0 => {
    const aValue = fn(a)
    const bValue = fn(b)
    const ascOp: 1 | -1 = order === 'asc' ? 1 : -1
    const descOp: 1 | -1 = order === 'asc' ? -1 : 1
    return aValue > bValue ? ascOp : aValue < bValue ? descOp : 0
  }

export function capitalize(text: string): string {
  return text[0].toUpperCase() + text.slice(1)
}

export function camelcasify(text: string): string {
  const separator = /-|_/gm
  return text
    .split(separator)
    .map((x: string) => capitalize(x))
    .join('')
}
