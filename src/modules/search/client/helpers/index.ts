export enum SearchCustomEvents {
  UpdateSearchResults = 'search:update-search-results',
  SearchBarKeyUp = 'search:search-bar-key-up',
}

export const goToSearchPage = (query: string) => {
  const url = new URL(window.location.href)
  url.pathname = '/search'
  url.searchParams.set('q', query)
  window.location.href = url.toString()
}
