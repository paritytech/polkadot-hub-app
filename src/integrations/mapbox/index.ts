import { Integration } from '../integration'

export default class Mapbox extends Integration {
  id = 'mapbox'
  private credentials = {
    apiKey: process.env.MAPBOX_API_KEY || '',
  }

  get apiKey(): string {
    return this.credentials.apiKey
  }
}
