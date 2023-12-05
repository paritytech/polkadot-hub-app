import * as React from 'react'
import { useStore } from '@nanostores/react'
import dayjs from 'dayjs'
import * as stores from '#client/stores'
import { Header } from '#client/components/Header'
import {
  BackButton,
  Background,
  ComponentWrapper,
  H1,
  LoaderSpinner,
  P,
} from '#client/components/ui'
import { renderMarkdown } from '#client/utils/markdown'
import { useDocumentTitle } from '#client/utils/hooks'
import { DATE_FORMAT } from '../helpers'
import { useNewsArticle } from '../queries'

export const NewsPage = () => {
  const page = useStore(stores.router)
  const newsId = page?.route === 'newsPage' ? page?.params?.newsId : null
  const { data: article } = useNewsArticle(newsId)
  useDocumentTitle(article?.title || 'Loading...')

  // TODO: if !article && !isLoading -> goTo('home')

  return (
    <Background>
      <Header />
      {article ? (
        <ComponentWrapper className="h-auto">
          <BackButton />
          <div className="py-2 sm:py-12">
            <div className="max-w-3xl mx-auto px-2 pt-8">
              <H1>{article?.title}</H1>
              <P textType="additional" className="text-text-secondary mb-0">
                Published on {dayjs(article.publishedAt).format(DATE_FORMAT)}{' '}
              </P>

              <div
                className="my-16"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(article?.content),
                }}
              />
            </div>
          </div>
        </ComponentWrapper>
      ) : (
        <LoaderSpinner className="h-full w-full" />
      )}
    </Background>
  )
}
