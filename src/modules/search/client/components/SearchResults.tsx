import React from 'react'
import { ComponentWrapper } from '#client/components/ui'
import * as stores from '#client/stores'
import { SearchSuggestionEntity, SearchSuggestion } from '#shared/types'
import { cn } from '#client/utils'
import { propEq } from '#shared/utils/fp'
import { useTagSyntax } from './../../shared-helpers'
import { SearchCustomEvents, goToSearchPage } from '../helpers'
import { useDocumentTitle } from '#client/utils/hooks'
import { PermissionsValidator } from '#client/components/PermissionsValidator'
import Permissions from '#shared/permissions'

export const SearchResults = () => (
  <PermissionsValidator
    required={[Permissions.search.Use]}
    onRejectGoHome
  >
    <_SearchResults/>
  </PermissionsValidator>
)

const _SearchResults: React.FC = () => {
  useDocumentTitle('Search')
  const [results = [], setResults] = React.useState<SearchSuggestion[]>([])
  const [focusedResultIndex, setFocusedResultIndex] = React.useState<number>(-1)

  const resultsNumber = React.useMemo(() => results.length, [results])

  const useResult = React.useCallback(() => {
    const result = results[focusedResultIndex]
    if (!result) return
    if (result.entity === SearchSuggestionEntity.User) {
      stores.goTo('publicProfile', { userId: result.id })
    }
    if (result.entity === SearchSuggestionEntity.Tag) {
      const query = useTagSyntax(result.title)
      goToSearchPage(query)
    }
  }, [focusedResultIndex, results])

  const onUpdateResults = React.useCallback(
    (ev: CustomEvent<SearchSuggestion[]>) => setResults(ev.detail),
    []
  )
  const onSearchBarKeyUp = React.useCallback(
    (ev: CustomEvent<'ArrowUp' | 'ArrowDown' | 'Enter'>) => {
      switch (ev.detail) {
        case 'ArrowDown': {
          setFocusedResultIndex((x) => (x >= resultsNumber - 1 ? 0 : x + 1))
          break
        }
        case 'ArrowUp': {
          setFocusedResultIndex((x) => (x <= 0 ? resultsNumber - 1 : x - 1))
          break
        }
        case 'Enter': {
          useResult()
          break
        }
      }
    },
    [resultsNumber, useResult]
  )
  const onResultClick = React.useCallback(
    (id: string) => (ev: React.MouseEvent) => {
      const sugg = results.find(propEq('id', id))
      if (!sugg) return
      if (sugg.entity === SearchSuggestionEntity.User) {
        stores.goTo('publicProfile', { userId: sugg.id })
      }
      if (sugg.entity === SearchSuggestionEntity.Tag) {
        const query = useTagSyntax(sugg.title)
        goToSearchPage(query)
      }
    },
    [results]
  )

  // setup search custom events listeners
  React.useEffect(() => {
    window.addEventListener(
      SearchCustomEvents.UpdateSearchResults,
      onUpdateResults as EventListener
    )
    window.addEventListener(
      SearchCustomEvents.SearchBarKeyUp,
      onSearchBarKeyUp as EventListener
    )
    return () => {
      window.removeEventListener(
        SearchCustomEvents.UpdateSearchResults,
        onUpdateResults as EventListener
      )
      window.removeEventListener(
        SearchCustomEvents.SearchBarKeyUp,
        onSearchBarKeyUp as EventListener
      )
    }
  }, [onUpdateResults, onSearchBarKeyUp])

  return (
    <ComponentWrapper>
      {!results.length ? (
        <div className="min-h-[100px] flex items-center justify-center text-gray-500">
          No results
        </div>
      ) : (
        results.map((x, i) => (
          <div
            key={x.id}
            className={cn(
              'flex items-center px-2 py-2 cursor-pointer rounded-tiny',
              focusedResultIndex === i && 'bg-applied-hover'
            )}
            onMouseMove={() => setFocusedResultIndex(i)}
            onClick={onResultClick(x.id)}
          >
            {x.entity === SearchSuggestionEntity.User ? (
              <div className="rounded-[99px] w-14 h-14 mr-3 overflow-hidden flex-shrink-0">
                {!!x.image && <img src={x.image} className="block" />}
              </div>
            ) : null}
            {x.entity === SearchSuggestionEntity.Tag ? (
              <div className="rounded-[99px] w-14 h-14 mr-3 bg-fill-6 text-text-tertiary flex justify-center items-center flex-shrink-0">
                #
              </div>
            ) : null}
            <div className="flex-1">
              <div className="leading-none">{x.title}</div>
              {!!x.subtitle && (
                <div className="min-w-0 text-text-tertiary text-sm leading-none truncate mt-2">
                  {x.subtitle}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </ComponentWrapper>
  )
}
