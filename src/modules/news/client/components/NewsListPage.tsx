import { useStore } from '@nanostores/react'
import * as React from 'react'
import { Header } from '#client/components/Header'
import {
  BackButton,
  Background,
  ComponentWrapper,
  FButton,
  H1,
  H2,
  HR,
  P,
} from '#client/components/ui'
import * as stores from '#client/stores'
import { useNews } from '../queries'
import { NewsItem } from '#shared/types'
import dayjs from 'dayjs'

const MAX_NEWS_TO_SHOW = 10
export const NewsListPage = () => {
  const officeId = useStore(stores.officeId)
  const { data: news, isFetching } = useNews(officeId)

  const [showAll, setShowAll] = React.useState(false)
  const filteredNews = React.useMemo<NewsItem[]>(
    () => (showAll ? news || [] : (news || []).slice(0, MAX_NEWS_TO_SHOW)),
    [showAll, news]
  )
  React.useEffect(() => {
    if (news) {
      setShowAll(news?.length < MAX_NEWS_TO_SHOW)
    }
  }, [news])

  return (
    <Background>
      <Header />
      <ComponentWrapper>
        <BackButton />
        <H1 className="my-10 text-center">News</H1>
        <div>
          {!!filteredNews &&
            filteredNews.map((x, i) => (
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
          {!showAll && filteredNews.length > MAX_NEWS_TO_SHOW ? (
            <FButton
              kind="link"
              className="mt-4 ml-2"
              onClick={() => setShowAll(true)}
            >
              Show more
            </FButton>
          ) : null}
        </div>
      </ComponentWrapper>
    </Background>
  )
}
