import crypto from 'crypto'
import path from 'path'
import dayjs from 'dayjs'
import { diff } from 'json-diff'
import jwtLib, { JwtPayload } from 'jsonwebtoken'
import config from '#server/config'
import { SafeResponse } from '#server/types'

export const jwt = {
  sign(payload: JwtPayload, expiresIn: number): Promise<SafeResponse<string>> {
    return new Promise((resolve) => {
      jwtLib.sign(payload, config.jwtSecret, { expiresIn }, (error, token) => {
        if (error) {
          resolve({ success: false, error })
        }
        resolve({ success: true, data: token! })
      })
    })
  },
  verify(token: string): Promise<SafeResponse<JwtPayload>> {
    return new Promise((resolve) => {
      jwtLib.verify(token, config.jwtSecret, (error, payload) => {
        if (error) {
          resolve({ success: false, error })
        }
        resolve({ success: true, data: payload as JwtPayload })
      })
    })
  },
}

export const getTimezoneOffset = (timezone: string) => {
  // to test how it works on a machine with UTC use `dayjs().utc()`
  const now = dayjs()
  const utcOffset = now.utcOffset()
  const timezoneOffset = now.tz(timezone).utcOffset()
  return (timezoneOffset - utcOffset) / 60
}

export const getUtcHourForTimezone = (
  localHour: number,
  timezone: string
): number => {
  const result = localHour - getTimezoneOffset(timezone)
  if (result > 24) {
    return result - 24
  }
  if (result < 0) {
    return 24 - result
  }
  return result
}

export const cloneRegExp = (input: RegExp, injectFlags: string = '') => {
  const pattern = input.source
  let flags = ''
  // Test for global
  if (input.global || /g/i.test(injectFlags)) {
    flags += 'g'
  }
  // Test for ignoreCase
  if (input.ignoreCase || /i/i.test(injectFlags)) {
    flags += 'i'
  }
  // Test for multiline
  if (input.multiline || /m/i.test(injectFlags)) {
    flags += 'm'
  }
  // Return a clone with the additive flags
  return new RegExp(pattern, flags)
}

export function generateId(length = 16, prefix = '') {
  const bytes = crypto.randomBytes(length / 2)
  const hexString = bytes.toString('hex')
  return prefix + hexString
}

export const getJSONdiff = (
  json1: Record<string, unknown>[],
  json2: Record<string, unknown>[],
  reference: string
) => {
  const changes: string[] = []
  const difference = diff(json1, json2)
  difference?.forEach((v: Array<any>, idx: number) => {
    if (v[0] === '~') {
      changes.push(json2[idx][reference] as string)
      return v[1]
    }
  })
  return changes
}

export function getFilePath(relativePath: string): string {
  return path.join(process.cwd(), relativePath)
}

export const safeRequire = (filePath: string, verbose = false) => {
  try {
    return require(filePath)
  } catch (err) {
    if (verbose) {
      console.log('Error in "safeRequire":', filePath, err)
    }
    return null
  }
}
