import { SafeResponse } from '#server/types'
import { log } from '#server/utils/log'

export type Credentials = Record<string, string>

export class Integration {
  id!: string

  async init(): Promise<void> {
    log.info(`Integration "${this.id}" is initialised`)
  }

  async destroy(): Promise<void> {
    log.info(`Integration "${this.id}" is destroyed.`)
  }

  error(error: unknown, message?: string): SafeResponse {
    log.error(`Error in "${this.id}" integration: ` + message)
    log.error(JSON.stringify(error))
    return { success: false, error: error as Error }
  }

  success<T>(data?: T): SafeResponse<T> {
    if (data !== undefined) {
      return { success: true, data: data } as SafeResponse<T>
    }
    return { success: true } as SafeResponse<T>
  }
}
