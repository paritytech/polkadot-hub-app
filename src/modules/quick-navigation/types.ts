export type QuickNavigationItem = {
  url: string
  name: string
  icon: string
  sameTab: boolean
  external: boolean
}

export type NavigationSection = {
  section: string
  main: string
  links: Array<QuickNavigationItem>
}
