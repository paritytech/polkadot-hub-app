import React, { useState } from 'react'
import { Background, ComponentWrapper } from '#client/components/ui'

import { Header } from '#client/components/Header'
import { PaymentWidget } from './PaymentWidget'

export const PaymentPage: React.FC<{
  membershipId: string
}> = ({ membershipId = '1' }) => {
  return (
    <Background className={''}>
      <Header />
      <ComponentWrapper>
        <PaymentWidget membershipId={membershipId} />
      </ComponentWrapper>
    </Background>
  )
}
