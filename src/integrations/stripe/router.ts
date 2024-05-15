import { Payment } from '#modules/payments/server/models'
import { PaymentStatus } from '#shared/types'
import { FastifyPluginCallback } from 'fastify'
import { Op } from 'sequelize'

const webhookRouter: FastifyPluginCallback = async (fastify, opts) => {
  fastify.post('/result', async (request, reply) => {
    const event = request.body

    // const chargeEvents = [
    //   'charge.succeeded',
    //   'charge.pending',
    //   'charge.expired',
    //   'charge.failed',
    // ]
    // const paymentIntentEvents = [
    //   'payment_intent.canceled',
    //   'payment_intent.created',
    //   'payment_intent.partially_funded',
    //   'payment_intent.payment_failed',
    //   'payment_intent.processing',
    //   'payment_intent.succeeded',
    //   'payment_intent.requires_action',
    // ]

    // Handle the event
    const paymentIntentId =
      event.data.object.object === 'payment_intent'
        ? event.data.object.id
        : event.data.object.payment_intent
    const paymentRecord = await Payment.findOne({
      where: {
        providerReferenceId: paymentIntentId,
        currency: {
          [Op.ne]: 'DOT',
        },
      },
    })

    if (!paymentRecord) {
      // we do not have this payment record
      return { received: true }
    }

    const updatedReference = [
      ...(!paymentRecord.reference ? [] : paymentRecord.reference),
      event,
    ]

    switch (event?.type) {
      case 'payment_intent.created':
        await paymentRecord.update({
          reference: updatedReference,
        })
        break
      case 'payment_intent.payment_failed':
      case 'charge.failed':
        await paymentRecord.update({
          status: PaymentStatus.Error,
          reference: updatedReference,
        })
        break
      case 'charge.succeeded':
        await paymentRecord.update({
          status: PaymentStatus.Success,
          reference: updatedReference,
        })
        break
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    // Return a response to acknowledge receipt of the event
    return { received: true }
  })
}

module.exports = {
  webhookRouter,
}
