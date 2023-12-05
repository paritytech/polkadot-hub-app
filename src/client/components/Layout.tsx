import * as React from 'react'
import { Header } from '#client/components/Header'
import { Container } from '#client/components/Container'
import { Background } from '#client/components/ui/Background'

type Props = {
  children: React.ReactNode
}

export const Layout: React.FC<Props> = ({ children }) => {
  return (
    <Background className="pb-10">
      <Header />
      <Container>{children}</Container>
    </Background>
  )
}
