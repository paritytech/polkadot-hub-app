import axios from 'axios'
import { Integration } from '../integration'
import { Paginated, Person, PublicHoliday, TimeAway } from './types'

class Humaans extends Integration {
  id = 'humaans'
  private credentials = {
    apiToken: process.env.HUMAANS_API_TOKEN || '',
  }

  private async makeRequest<T>(
    method: string,
    path: string,
    payload?: {
      data?: Record<string, unknown>
      params?: Record<string, unknown>
    }
  ): Promise<T> {
    return await axios({
      url: `https://app.humaans.io/api${path}`,
      method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.credentials.apiToken}`,
      },
      data: payload?.data,
      params: payload?.params,
    }).then((res) => res.data)
  }

  private async makePaginatedRequest<T>(
    path: string,
    params: Record<string, any> = {}
  ): Promise<T[]> {
    let result: T[] = []
    let skip = 0
    const limit = 200
    let totalFetched = 0
    while (true) {
      const response = await this.makeRequest<Paginated<T>>('GET', path, {
        params: { ...params, $limit: limit, $skip: skip },
      })
      if (response.data && response.data.length > 0) {
        result = result.concat(response.data)
        totalFetched += response.data.length
        if (totalFetched >= response.total) {
          break
        }
        skip += limit
      } else {
        break
      }
    }
    return result
  }

  async getEmployeeByEmail(email: string): Promise<Person | null> {
    const response = await this.makeRequest<Paginated<Person>>(
      'GET',
      '/people',
      {
        params: { email },
      }
    )
    return response.data?.[0] || null
  }

  async getEmployees(): Promise<Person[]> {
    return this.makePaginatedRequest<Person>('/people')
  }

  async getTimeAways(from: string, to: string): Promise<TimeAway[]> {
    return this.makePaginatedRequest<TimeAway>('/time-away', {
      'startDate[$gte]': from,
      'endDate[$lte]': to,
    })
  }

  async getPublicHolidays(
    from: string,
    to: string,
    calendarId: string
  ): Promise<PublicHoliday[]> {
    return this.makePaginatedRequest<PublicHoliday>('/public-holidays', {
      publicHolidayCalendarId: calendarId,
      'date[$gte]': from,
      'date[$lte]': to,
    })
  }
}

export default Humaans
