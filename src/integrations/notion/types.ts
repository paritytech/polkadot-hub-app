type MultiSelect = {
  id: string
  type: 'multi_select'
  multi_select: Array<MultiSelectValue>
}

type DateValue = {
  id: string
  type: 'date'
  date: { start: Date; end: Date; time_zone: string | null }
}

type MultiSelectValue = {
  id: string
  name: string
  color: string
}

type NotionPage = {
  object: string
  id: string
  created_time: string
  last_edited_time: string
  created_by: [Object]
  last_edited_by: [Object]
  cover: string | null
  icon: string | null
  parent: [Object]
  archived: boolean
  properties: {
    'Event Name': {
      id: string
      type: string
      title: [
        {
          type: string
          text: {
            content: string
          }
          annotations: [Object]
          plain_text: string
          href: string
        }
      ]
    }
    Status: MultiSelect
    Type: MultiSelect
    City: MultiSelect
    URL: {
      id: string
      type: string
      url: string
    }
    Dates: DateValue
  }
  url: string
  public_url: string | null
}

export type NotionQueryDatabaseResponse = {
  object: string
  results: NotionPage[]
  has_more: boolean
  next_cursor: string | null
}
