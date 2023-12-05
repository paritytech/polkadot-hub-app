import { openPage as _openPage } from '@nanostores/router'
import { router as _router, Route } from './__import-stores'

export const router = _router

// @todo replace it with `stores.openPage(stores.router, '...', {...})
export const goTo = <P extends Route>(
  page: P,
  params: Record<string, string> = {}
  // @ts-ignore @fixme
) => openPage(router, page, params)

export const openPage = _openPage
