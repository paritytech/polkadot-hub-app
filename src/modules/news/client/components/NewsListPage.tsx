import { useStore } from '@nanostores/react'
import * as React from 'react'
import { Header } from '#client/components/Header'
import {
  BackButton,
  Background,
  ComponentWrapper,
  FButton,
  H1,
  P,
} from '#client/components/ui'
import * as stores from '#client/stores'
import { useNews } from '../queries'
import { NewsItem } from '#shared/types'
import dayjs from 'dayjs'
import { paginateArray } from '#modules/events/client/helpers'

const pageSize = 10

export const NewsListPage = () => {
  const officeId = useStore(stores.officeId)
  const { data: news, isFetched } = useNews(officeId)
  const [newsData, setNewsData] = React.useState<Array<NewsItem>>([])
  const [page, setPage] = React.useState(1)

  React.useEffect(() => {
    if (news?.length && isFetched) {
      let limit = page === 1 ? pageSize : page * pageSize
      const result = paginateArray(news, 1, limit)
      setNewsData(result)
    }
  }, [news, officeId, page])

  return (
    <Background>
      <Header />
      <ComponentWrapper>
        <BackButton />
        <H1 className="my-10 text-center">News</H1>
        <div>
          {!!newsData &&
            newsData.map((x, i) => (
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
                {i + 1 === news?.length && news?.length <= pageSize ? (
                  ''
                ) : (
                  <hr className="bg-applied-separator" />
                )}
              </div>
            ))}
          {!!news && news.length !== newsData.length ? (
            <FButton
              kind="link"
              className="mt-4 ml-2"
              onClick={() => setPage((p) => p + 1)}
            >
              Show more
            </FButton>
          ) : null}
        </div>
      </ComponentWrapper>
    </Background>
  )
}
