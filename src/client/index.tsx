import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider, QueryClient } from 'react-query'
import { App } from './App'
import { Notifications } from '#client/components/ui'

const container = document.createElement('div')
document.body.appendChild(container)
const root = createRoot(container!)

const queryClient = new QueryClient()
queryClient.setDefaultOptions({
  queries: {
    retry: false
  }
})

root.render(
  <QueryClientProvider client={queryClient}>
    <App />
    <Notifications />
  </QueryClientProvider>
)
