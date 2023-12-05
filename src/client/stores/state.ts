import { atom, computed } from 'nanostores'
import config from '#client/config'
import { UserMe } from '#shared/types'
import { PermissionsSet } from '#shared/utils'

// FIXME: do not hardcode values here & use as client constant
type LayoutView = 'mobile' | 'tablet' | 'desktop'
const MEDIA_QUERIES: Record<LayoutView, string> = {
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
}

const LocalStorageStateKey = 'mphq_state'

type AppState = {
  me: UserMe | null
  officeId: string
  isAdmin: boolean
  lastVisitedAdminRoute: string | null
  layoutView: LayoutView
}

const defaultValues: AppState = {
  me: null,
  officeId: config.offices[0]?.id || 'UNKNOWN',
  isAdmin: false,
  lastVisitedAdminRoute: null,
  layoutView: getInitialLayoutView(),
}
const cachedStateKeys: Array<keyof AppState> = [
  'officeId',
  'lastVisitedAdminRoute',
]

const appStateInitialValue = {
  ...defaultValues,
  ...getInitialAppState(),
}
if (config.offices.every((x) => x.id !== appStateInitialValue.officeId)) {
  appStateInitialValue.officeId = config.offices[0].id
}
export const appState = atom<AppState>(appStateInitialValue)

export const permissions = atom<PermissionsSet>(new PermissionsSet())

// Setters
export const setAppStateItem = <K extends keyof AppState>(
  key: K,
  value: AppState[K]
): void => {
  appState.set({ ...appState.get(), [key]: value })
  if (cachedStateKeys.includes(key)) {
    saveAppStateInLocalStorage({ [key]: value })
  }
}
export const setAppState = (value: Partial<AppState>): void => {
  appState.set({ ...appState.get(), ...value })
  const cachedValue = Object.keys(cachedStateKeys).reduce((acc, x) => {
    if (value.hasOwnProperty(x)) {
      return { ...acc, x: value }
    }
    return acc
  }, {})
  saveAppStateInLocalStorage(cachedValue)
}

// Computed
export const me = computed(appState, (value) => value.me)
export const isAdmin = computed(appState, (value) => value.isAdmin)
export const officeId = computed(appState, (value) => value.officeId)

export const layoutView = computed(appState, (value) => value.layoutView)
const onMediaQueryMatchingChange =
  (view: LayoutView) => (ev: MediaQueryListEvent) => {
    if (ev.matches) {
      setAppStateItem('layoutView', view)
    }
  }
window
  .matchMedia(MEDIA_QUERIES.mobile)
  .addEventListener('change', onMediaQueryMatchingChange('mobile'))
window
  .matchMedia(MEDIA_QUERIES.tablet)
  .addEventListener('change', onMediaQueryMatchingChange('tablet'))
window
  .matchMedia(MEDIA_QUERIES.desktop)
  .addEventListener('change', onMediaQueryMatchingChange('desktop'))

// Helpers
function getInitialAppState(): Partial<AppState> {
  const fromLocalStorage = getAppStateFromLocalStorage()
  const fromUrlParams = getAppStateFormUrlParams()
  const layoutView = getInitialLayoutView()
  const result = { ...fromLocalStorage, ...fromUrlParams, layoutView }
  saveAppStateInLocalStorage(result)
  return result
}

function getAppStateFromLocalStorage(): Partial<AppState> {
  try {
    const record = localStorage.getItem(LocalStorageStateKey)
    if (record) {
      return JSON.parse(record)
    }
    return {}
  } catch (err) {
    console.error('Error retrieving app state', err)
    return {}
  }
}

function saveAppStateInLocalStorage(value: Partial<AppState> = {}): void {
  try {
    const currentValue = JSON.parse(
      localStorage.getItem(LocalStorageStateKey) || '{}'
    )
    localStorage.setItem(
      LocalStorageStateKey,
      JSON.stringify({ ...currentValue, ...value })
    )
  } catch (err) {
    console.error('Error saving the app state in localStorage')
    localStorage.removeItem(LocalStorageStateKey)
  }
}

function getAppStateFormUrlParams(): Partial<AppState> {
  const url = new URL(document.location.href)
  const office = url.searchParams.get('office')
  const result: Partial<AppState> = {}
  if (office) {
    result['officeId'] = office
    url.searchParams.delete('office')
    window.history.replaceState({}, document.title, url.href)
  }
  return result
}

function getInitialLayoutView(): LayoutView {
  const value = Object.keys(MEDIA_QUERIES).find((view) => {
    const mqString = MEDIA_QUERIES[view as LayoutView]
    const { matches } = window.matchMedia(mqString)
    return matches
  }) as LayoutView
  if (!value) {
    console.warn(`Failed to match media query.`)
    return 'desktop'
  }
  return value
}
