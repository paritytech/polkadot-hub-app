import axios from 'axios'
import Decimal from 'decimal.js'

Decimal.set({ precision: 10 })

// @todo move this to some sort of admin config

const DISCOUNT_COEFFICIENT = 0.2

export const getPriceInDot = async (fiatAmount: string | number) => {
  const dotPrice = await getDotPrice('eur')
  if (!fiatAmount || !dotPrice) {
    return 0
  }
  return new Decimal(fiatAmount).div(new Decimal(dotPrice)).toString()
}

export const getDiscountValue = (price: string) => {
  if (!price) {
    return 0
  }
  return new Decimal(price).mul(DISCOUNT_COEFFICIENT).toString()
}

export const getDotPrice = async (currency: string) => {
  const url = 'https://api.coingecko.com/api/v3/coins/polkadot'
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      //@todo - move api key to vars
      'x-cg-demo-api-key': 'CG-mq6gQiFHVGM5nDUjSVfPAEeZ',
    },
  }
  try {
    const result = await (await axios(url, options)).data
    return result.market_data.current_price[currency.toLowerCase()] ?? 0
  } catch (e) {
    console.log(e)
    return 0
  }
}
