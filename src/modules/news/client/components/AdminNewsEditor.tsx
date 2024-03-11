import React, { useCallback, useEffect, useState } from 'react'
import { useStore } from '@nanostores/react'
import dayjs from 'dayjs'
import {
  Breadcrumbs,
  Button,
  ButtonsWrapper,
  H1,
  Input,
  MarkdownTextarea,
  WidgetWrapper,
} from '#client/components/ui'
import { EntityAccessSelector } from '#client/components/EntityAccessSelector'
import { showNotification } from '#client/components/ui/Notifications'
import { useDebounce, useDocumentTitle } from '#client/utils/hooks'
import * as stores from '#client/stores'
import { NewsRequest, EntityVisibility } from '#shared/types'
import { Notifications } from '../helpers'
import { useAdminNewsArticle, useCreateNews, useUpdateNews } from '../queries'

const requiredFields: Array<keyof NewsRequest> = ['title', 'content']

export const AdminNewsEditor = () => {
  useDocumentTitle('News Editor')
  const page = useStore(stores.router)
  const newsId = page?.route === 'adminNewsPage' ? page.params.newsId : 'new'
  const notNew = newsId !== 'new'

  // Database
  const { data: newsArticle, refetch: refetchArticle } = notNew
    ? useAdminNewsArticle(newsId)
    : { data: null, refetch: () => null }

  const { mutate: createNews, error: createNewsError } = useCreateNews(() => {
    showNotification(Notifications.CreatedSuccess, 'success')
    setFormIsPristine(true)
  })

  const { mutate: updateNews, error: createUpdateError } = useUpdateNews(
    newsId,
    () => {
      showNotification(Notifications.UpdatedSuccess, 'success')
      setFormIsPristine(true)
      refetchArticle()
    }
  )

  // Form
  const [formData, setFormData] = React.useState<NewsRequest>({
    title: '',
    content: '',
    offices: [],
    allowedRoles: [],
    visibility: EntityVisibility.None,
    published: false,
    publishedAt: dayjs().toDate(),
  })

  const [formIsPristine, setFormIsPristine] = useState<boolean>(true)
  const onFormChange = useCallback(
    (field: any) => (value: any) => {
      setFormData((x: any) => ({ ...x, [field]: value }))
      setFormIsPristine(false)
    },
    []
  )
  const onFormBulkChange = React.useCallback((data: Record<string, any>) => {
    setFormData((x) => ({ ...x, ...data }))
    setFormIsPristine(false)
  }, [])

  const onSubmit = useCallback(
    (ev: React.FormEvent) => {
      ev.preventDefault()
      return notNew ? updateNews(formData) : createNews(formData)
    },
    [notNew, formData]
  )

  const debouncedFormData: NewsRequest = useDebounce(formData, 1e3)

  const formIsValid = React.useMemo<boolean>(() => {
    return requiredFields.every((field) => Boolean(formData[field]))
  }, [requiredFields, debouncedFormData])

  useEffect(() => {
    if (newsArticle) {
      setFormData(newsArticle as NewsRequest)
    }
  }, [newsArticle])

  return (
    <WidgetWrapper>
      <div className="flex flex-col">
        <H1>{notNew ? 'Edit News Article' : 'Create News Article'}</H1>
        <Breadcrumbs
          items={[
            { label: 'News', href: '/admin/news' },
            {
              label: notNew && newsArticle ? newsArticle?.title : 'New article',
            },
          ]}
        />
        <form className="mb-0" onSubmit={onSubmit}>
          <EntityAccessSelector
            value={{
              visibility: formData.visibility,
              allowedRoles: formData.allowedRoles,
              offices: formData.offices,
            }}
            fields={['visibility', 'allowedRoles', 'offices']}
            visibilityTypes={[
              EntityVisibility.None,
              EntityVisibility.Url,
              EntityVisibility.Visible,
            ]}
            onChange={onFormBulkChange}
            containerClassName="my-6"
          />

          <Input
            type="text"
            name="title"
            value={formData.title}
            onChange={onFormChange('title')}
            label="Title"
            placeholder="News title"
            containerClassName="w-full mb-4"
            required={requiredFields.includes('title')}
          />

          <MarkdownTextarea
            name="content"
            onChangeValue={onFormChange('content')}
            defaultValue={formData.content || ''}
            label="Content"
            placeholder="Markdown content"
            className="mb-4"
            required={requiredFields.includes('content')}
          />

          <Input
            type="checkbox"
            checked={formData.published}
            onChange={onFormChange('published')}
            containerClassName="mb-4"
            inlineLabel={
              <span>
                Publish article
                <span className="ml-2 text-gray-400">
                  (Check if you want article to be visible to others, uncheck if
                  you want article to stay draft.)
                </span>
              </span>
            }
          />

          <div className="sticky bg-white mt-6 py-4 bottom-0 border-t border-gray-200 px-6 -mx-6 -mb-6 rounded-b-sm">
            <ButtonsWrapper
              left={[
                <Button
                  kind="secondary"
                  onClick={() => stores.goTo('adminNews')}
                >
                  Cancel
                </Button>,
              ]}
              right={[
                <Button
                  disabled={!formIsValid || formIsPristine}
                  type="submit"
                  kind="primary"
                >
                  {notNew ? 'Update' : 'Create'}
                </Button>,
              ]}
            />
          </div>
        </form>
      </div>
    </WidgetWrapper>
  )
}
