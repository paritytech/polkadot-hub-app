import axios from 'axios'
import { Integration } from '../integration'
import { NotionQueryDatabaseResponse } from './types'

class Notion extends Integration {
  id = 'notion'
  private credentials = {
    apiToken: process.env.NOTION_API_TOKEN || '',
  }
  private baseUrl = `https://api.notion.com/v1`
  private headers = {
    Accept: 'application/json',
    'Notion-Version': '2022-06-28',
    Authorization: `Bearer ${this.credentials.apiToken}`,
  }

  async queryDatabase(
    databaseId: string,
    query: any
  ): Promise<NotionQueryDatabaseResponse> {
    // https://developers.notion.com/reference/post-database-query
    return axios
      .post(`${this.baseUrl}/databases/${databaseId}/query`, query, {
        headers: this.headers,
      })
      .then((res) => res.data)
  }
}

export default Notion
