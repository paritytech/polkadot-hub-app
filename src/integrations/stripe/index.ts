import { Integration } from '../integration'
// @todo add to vars
const stripe = require('stripe')(
  'sk_test_51P1Km1P4RQeZqTUKN83xF38s7xWjkJaaxJrYm7LwvgCbBDsv9V8orZTcC9Z435mmNzMSNbxLsobfaNTNSoX8HdP600Xye9kzCS'
)

class Stripe extends Integration {
  private stripe
  constructor() {
    super()
    this.stripe = stripe
  }

  async getStripe() {
    return this.stripe
  }
  async pay(): Promise<void> {}

  async createPaymentIntent(amount: number, currency: string) {
    return this.stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
    })
  }
}

export default Stripe
