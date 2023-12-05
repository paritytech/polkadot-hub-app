import React from 'react'
import { FButton, H1, P, ComponentWrapper } from '#client/components/ui'

export const NotFound: React.FC = () => {
  return (
    <ComponentWrapper className="text-center">
      <H1>404</H1>
      <P className="mb-6">Page not found</P>
      <FButton href="/">Go to the home page</FButton>
    </ComponentWrapper>
  )
}