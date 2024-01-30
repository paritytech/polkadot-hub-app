import React, { useEffect } from 'react'
import { useStore } from '@nanostores/react'
import dayjs from 'dayjs'
import { FButton, P, WidgetWrapper } from '#client/components/ui'
import * as stores from '#client/stores'
import { NewsItem } from '#shared/types'
import { useNews } from '../queries'

const Placeholder = () => (
  <div className="flex pl-4 gap-4">
    <div className="h-16 w-16 bg-gray-100 rounded-tiny"></div>
    <div className="pt-1 flex flex-col gap-1">
      <div className="h-4 w-44 bg-gray-100 rounded-tiny"></div>
      <div className="h-4 w-32 bg-gray-100 rounded-tiny"></div>
      <div className="h-4 w-32 bg-gray-100 rounded-tiny"></div>
    </div>
  </div>
)

const MAX_NEWS_TO_SHOW = 3
export const LatestNews = () => {
  const officeId = useStore(stores.officeId)
  const { data: news, isFetching } = useNews(officeId)
  const [showAll, setShowAll] = React.useState(false)
  const filteredNews = React.useMemo<NewsItem[]>(
    () => (showAll ? news || [] : (news || []).slice(0, MAX_NEWS_TO_SHOW)),
    [showAll, news]
  )
  useEffect(() => {
    if (news) {
      setShowAll(news?.length < MAX_NEWS_TO_SHOW)
    }
  }, [news])

  return (
    <WidgetWrapper
      title={news?.length ? 'News' : 'No news'}
      className="pl-2 pr-2"
      titleClassName="pl-4"
    >
      {!news?.length ? (
        <div className="flex flex-col gap-4">
          <Placeholder />
          <Placeholder />
          <Placeholder />
        </div>
      ) : (
        <div>
          {filteredNews.map((x, i) => (
            <div
              key={x.id}
              onClick={() => stores.goTo('newsPage', { newsId: x.id })}
              className={
                'flex flex-col gap-4 pl-4 pr-4 hover:bg-applied-hover hover:rounded-tiny cursor-pointer'
              }
            >
              <div>
                <P textType="additional" className="text-text-tertiary mb-1">
                  {dayjs(x.publishedAt).format('D MMM')}
                </P>
                <div className="mb-2">{x.title}</div>
              </div>
              {i + 1 === filteredNews.length &&
              filteredNews.length <= MAX_NEWS_TO_SHOW ? (
                ''
              ) : (
                <hr className="bg-applied-separator" />
              )}
            </div>
          ))}
          <FButton
            kind="link"
            className="mt-4 ml-2"
            onClick={() => stores.goTo('newsList')}
          >
            Show more
          </FButton>
        </div>
      )}
    </WidgetWrapper>
  )
}
