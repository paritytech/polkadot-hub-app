import React, { useEffect } from 'react'
import { useStore } from '@nanostores/react'
import dayjs from 'dayjs'
import {
  FButton,
  P,
  PlaceholderCard,
  WidgetWrapper,
} from '#client/components/ui'
import * as stores from '#client/stores'
import { NewsItem } from '#shared/types'
import { useNews } from '../queries'

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
          <PlaceholderCard />
          <PlaceholderCard />
          <PlaceholderCard />
        </div>
      ) : (
        <div className="flex flex-col justify-between pb-10">
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
          </div>
          {filteredNews.length >= 3 && (
            <FButton
              kind="link"
              className="w-auto self-start"
              onClick={() => stores.goTo('newsList')}
            >
              Show more
            </FButton>
          )}
        </div>
      )}
    </WidgetWrapper>
  )
}
