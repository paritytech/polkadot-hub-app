import { FButton } from '#client/components/ui'
import { Icons } from '#client/components/ui/Icons'
import * as stores from '#client/stores'
import { SearchSuggestionEntity } from '#shared/types'
import { cn } from '#client/utils'
import { propEq } from '#shared/utils/fp'
import {
  useDebounce,
  useFocusInputHotkey,
  useOnClickOutside,
} from '#client/utils/hooks'
import { useStore } from '@nanostores/react'
import React from 'react'
import { useTagSyntax } from './../../shared-helpers'
import { goToSearchPage, SearchCustomEvents } from '../helpers'
import { useSearchResults, useSearchSuggestions } from '../queries'

export const SearchBar: React.FC<{ mode: 'quick' | 'full' }> = ({ mode }) => {
  const layoutView = useStore(stores.layoutView)
  const refInput = React.useRef() as React.MutableRefObject<HTMLInputElement>
  const refRoot = React.useRef() as React.MutableRefObject<HTMLDivElement>
  const [isOpen, setIsOpen] = React.useState<boolean>(true)
  const [query, setQuery] = React.useState<string>('')
  const debouncedQuery = useDebounce(query, 400)
  const [focusedSuggIndex, setFocusedSuggIndex] = React.useState<number>(-1)
  const [isFullWidth, setIsFullWidth] = React.useState(false)
  const [isReadyForAnimation, setIsReadyForAnimation] = React.useState(false)

  const { data: suggestions = [] } = useSearchSuggestions(debouncedQuery, {
    enabled: mode === 'quick',
  })
  const { data: results = [] } = useSearchResults(debouncedQuery, {
    enabled: mode === 'full',
  })

  const suggestionsNumber = React.useMemo(
    () => suggestions.length,
    [suggestions]
  )

  const onOpen = React.useCallback(() => {
    setIsOpen(true)
    setTimeout(() => {
      refInput.current?.focus()
    }, 100)
  }, [refInput.current])
  const onClose = React.useCallback(() => {
    if (layoutView === 'mobile') {
      setIsOpen(false)
    }
    setQuery('')
    refInput.current?.blur()
  }, [refInput.current, layoutView])
  const onToggle = React.useCallback(() => {
    if (isOpen) {
      onClose()
    } else {
      onOpen()
    }
  }, [isOpen, onOpen, onClose])
  const onQueryChange = React.useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(ev.target.value)
    },
    []
  )
  const onQuickModeKeyUp = React.useCallback(
    (ev: React.KeyboardEvent<HTMLInputElement>) => {
      const key = ev.key
      if (key === 'Escape') {
        onClose()
        refInput.current?.blur()
      }
      if (!suggestionsNumber) {
        if (key === 'Enter') {
          goToSearchPage(query)
        }
        return
      }
      if (key === 'ArrowDown') {
        setFocusedSuggIndex((x) => {
          if (x >= suggestionsNumber) {
            // replace with `x >= suggestionsNumber - 1` to ignore ShowAll button
            return 0
          }
          return x + 1
        })
      }
      if (key === 'ArrowUp') {
        setFocusedSuggIndex((x) => {
          if (x <= 0) {
            return suggestionsNumber // replace with `suggestionsNumber - 1` to ignore ShowAll button
          }
          return x - 1
        })
      }
      if (key === 'Enter') {
        if (focusedSuggIndex === -1 || focusedSuggIndex === suggestionsNumber) {
          goToSearchPage(query)
        } else {
          useSuggestion(focusedSuggIndex)
        }
      }
    },
    [onClose, refInput.current, focusedSuggIndex, suggestionsNumber, query]
  )
  const onFullModeKeyUp = React.useCallback(
    (ev: React.KeyboardEvent<HTMLInputElement>) => {
      const key = ev.key
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter') {
        const event = new CustomEvent(SearchCustomEvents.SearchBarKeyUp, {
          detail: key,
        })
        window.dispatchEvent(event)
      }
    },
    []
  )
  const useSuggestion = React.useCallback(
    (index: number) => {
      const sugg = suggestions[index]
      if (!sugg) return
      if (sugg.entity === SearchSuggestionEntity.User) {
        stores.goTo('publicProfile', { userId: sugg.id })
      }
      if (sugg.entity === SearchSuggestionEntity.Tag) {
        const query = useTagSyntax(sugg.title)
        goToSearchPage(query)
      }
      onClose()
    },
    [suggestions]
  )
  const onSuggestionClick = React.useCallback(
    (id: string) => (ev: React.MouseEvent) => {
      const sugg = suggestions.find(propEq('id', id))
      if (!sugg) return
      if (sugg.entity === SearchSuggestionEntity.User) {
        stores.goTo('publicProfile', { userId: sugg.id })
      }
      if (sugg.entity === SearchSuggestionEntity.Tag) {
        const query = useTagSyntax(sugg.title)
        goToSearchPage(query)
      }
      onClose()
    },
    [suggestions]
  )
  const onLayoutViewChange = React.useCallback(
    // TODO: use a shared type
    (layoutView: 'desktop' | 'tablet' | 'mobile') => {
      switch (layoutView) {
        case 'desktop':
        case 'tablet': {
          setIsOpen(true)
          setIsFullWidth(true)
          break
        }
        case 'mobile': {
          setIsOpen(false)
          setIsFullWidth(false)
          break
        }
      }
    },
    []
  )
  const onViewAllClick = React.useCallback(() => goToSearchPage(query), [query])

  useFocusInputHotkey(React.useCallback(onOpen, [onOpen]))
  React.useEffect(() => setFocusedSuggIndex(-1), [suggestions])

  useOnClickOutside(refRoot, onClose)

  React.useEffect(() => {
    if (isOpen) {
      setIsFullWidth(true)
    } else {
      setTimeout(() => setIsFullWidth(false), 305)
    }
  }, [isOpen])

  React.useEffect(() => onLayoutViewChange(layoutView), [layoutView])

  React.useEffect(() => {
    // "send" search results in SearchResults component
    const event = new CustomEvent(SearchCustomEvents.UpdateSearchResults, {
      detail: results,
    })
    window.dispatchEvent(event)
  }, [results])

  React.useEffect(() => {
    if (mode !== 'full') return
    const q = debouncedQuery.trim()
    if (!q) return
    const url = new URL(window.location.href)
    url.searchParams.set('q', q)
    window.history.replaceState(null, document.title, url.toString())
  }, [mode, debouncedQuery])

  React.useEffect(() => {
    onLayoutViewChange(layoutView)
    setTimeout(() => {
      setIsReadyForAnimation(true)
    }, 600)
    if (mode === 'full') {
      const url = new URL(window.location.href)
      const query = (url.searchParams.get('q') || '').trim()
      if (query) {
        setQuery(query)
      }
      refInput.current?.focus()
    }
  }, [])

  return (
    <div
      className={cn('relative pl-4 pr-0 md:pr-4', isFullWidth ? 'w-full' : '')}
      ref={refRoot}
    >
      {!!suggestions.length && (
        <>
          <div className="absolute -inset-x-3 h-0 -top-4">
            <div
              className={cn(
                'rounded-b-[16px] overflow-hidden shadow-custom bg-white w-full pt-20 px-2 pb-2 z-[1]',
                'fixed sm:absolute',
                'left-0 sm:left-auto right-0 sm:right-auto top-0 sm:top-auto bottom-0 sm:bottom-auto'
              )}
            >
              {suggestions.map((x, i) => (
                <div
                  key={x.id}
                  className={cn(
                    'flex items-center px-2 py-2 cursor-pointer rounded-tiny',
                    focusedSuggIndex === i && 'bg-applied-hover'
                  )}
                  onMouseMove={() => setFocusedSuggIndex(i)}
                  onClick={onSuggestionClick(x.id)}
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
              ))}

              <FButton
                kind="link"
                onClick={onViewAllClick}
                onMouseMove={() => setFocusedSuggIndex(suggestions.length)}
                className={cn(
                  'w-full text-left',
                  focusedSuggIndex === suggestionsNumber && 'bg-applied-hover'
                )}
              >
                View All
              </FButton>
            </div>
          </div>
        </>
      )}

      <div className="search flex justify-end">
        <div className="search-icon w-[48px] h-[48px] flex-shrink-0 relative z-[2]">
          <button
            className={cn(
              'w-[48px] h-[48px] flex items-center justify-center outline-none bg-[#f0f0f0]',
              layoutView === 'mobile'
                ? isOpen
                  ? 'rounded-tl-md rounded-bl-md'
                  : 'rounded-md'
                : 'rounded-tl-md rounded-bl-md'
            )}
            onClick={onToggle}
          >
            <Icons.Search />
          </button>
        </div>
        <div
          className={cn(
            'search-input h-[48px] w-full md:w-auto bg-[#f0f0f0] rounded-tr-md rounded-br-md transition-width flex items-center z-[3]',
            isOpen && 'search-input_opened'
          )}
          style={
            isReadyForAnimation
              ? { transition: 'width .2s ease-in-out', willChange: 'width' }
              : {}
          }
        >
          <input
            ref={refInput}
            className="block w-full border-none bg-transparent outline-none"
            value={query}
            onChange={onQueryChange}
            onKeyUp={mode === 'quick' ? onQuickModeKeyUp : onFullModeKeyUp}
            placeholder="Search People or Tags"
          />
        </div>
      </div>
    </div>
  )
}
