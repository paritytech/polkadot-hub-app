import React, { useState } from 'react'
import { BackButton, Background, ComponentWrapper } from '#client/components/ui'

import { Header } from '#client/components/Header'

export const HowToPayWithDot: React.FC<{
  amount: number
}> = ({ amount = '0.1' }) => {
  return (
    <Background className={''}>
      <Header />
      <ComponentWrapper>
        <h1>How to pay with DOT</h1>
        <ol className=" list-decimal list-inside">
          <li>Buy DOT</li>
          <li>Store it on a wallet of your choice</li>
          <li>Use it for payment</li>
        </ol>
      </ComponentWrapper>
    </Background>
  )
}
