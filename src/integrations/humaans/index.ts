import axios from 'axios'
import { Integration } from '../integration'
import { Paginated, Person, TimeAway } from './types'

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
    let result: Person[] = []
    let skip = 0
    const limit = 200
    let totalFetched = 0
    while (true) {
      const response = await this.makeRequest<Paginated<Person>>(
        'GET',
        '/people',
        {
          params: { $limit: limit, $skip: skip },
        }
      )
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

  async getTimeAways(from: string, to: string): Promise<TimeAway[]> {
    let result: TimeAway[] = []
    let skip = 0
    const limit = 200
    let totalFetched = 0
    while (true) {
      const response = await this.makeRequest<Paginated<TimeAway>>(
        'GET',
        '/time-away',
        {
          params: {
            $limit: limit,
            $skip: skip,
            'startDate[$gte]': from,
            'endDate[$lte]': to,
          },
        }
      )
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
}

export default Humaans
