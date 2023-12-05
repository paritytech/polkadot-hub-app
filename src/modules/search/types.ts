export enum SearchSuggestionEntity {
  User = 'user',
  Event = 'event',
  Tag = 'tag'
}

export type SearchSuggestion = {
  id: string
  entity: SearchSuggestionEntity
  title: string
  subtitle: string | null
  image: string | null
  url: string
}
