import { EntityVisibility } from '#shared/types'

export interface NewsItem {
  id: string
  title: string
  content: string
  creatorUserId: string
  offices: string[]
  allowedRoles: string[]
  visibility: EntityVisibility
  published: boolean
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type NewsResponse = Pick<
  NewsItem,
  'id' | 'title' | 'content' | 'offices' | 'publishedAt' | 'published'
>

export type NewsRequest = Pick<
  NewsItem,
  'title' | 'content' | 'offices' | 'publishedAt' | 'published' | 'allowedRoles' | 'visibility'
>
