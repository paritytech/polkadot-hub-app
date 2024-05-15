import axios from 'axios'
import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { Payment } from './models'
import { PaymentProvider, PaymentStatus } from '../types'
import { getDotPrice, getPriceInDot } from '../helper'

const publicRouter: FastifyPluginCallback = async function (fastify, opts) {}

const userRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.post(
    '/intents',
    async (
      req: FastifyRequest<{
        Body: {
          paymentRecordId: string
        }
      }>,
      reply
    ) => {
      const record = await Payment.findByPk(req.body.paymentRecordId)
      if (!record) {
        return reply.throw.badParams()
      }
      const paymentIntent =
        await fastify.integrations.Stripe.createPaymentIntent(
          record.purchasedProductReference.amount * 100,
          'EUR'
        )
      // @todo do we need to save the whole reference object? omit some values?
      record.update({
        providerReferenceId: paymentIntent.id,
        provider: PaymentProvider.Stripe,
      })

      return {
        clientSecret: paymentIntent.client_secret,
      }
    }
  )

  fastify.get(
    '/price/dot/:currency',
    async (
      req: FastifyRequest<{
        Params: { currency: string }
        Reply: any
      }>,
      reply
    ) => {
      const dotPrice = await getDotPrice(req.params.currency)
      if (!dotPrice) {
        return reply.throw.notFound()
      }
      return dotPrice
    }
  )
  fastify.get(
    '/payments/:paymentId',
    async (
      req: FastifyRequest<{
        Params: { paymentId: string }
        Reply: any
      }>,
      reply
    ) => {
      if (!req.params.paymentId) {
        return reply.throw.notFound()
      }

      const paymentRecord = await fastify.db.Payment.findByPk(
        req.params.paymentId
      )
      if (!paymentRecord) {
        return reply.throw.notFound()
      }
      return paymentRecord
    }
  )
  fastify.post(
    '/payments',
    async (
      req: FastifyRequest<{
        Body: {
          amount: number
          provider: string
          purchasedProductReference: any
        }
      }>,
      reply
    ) => {
      const isProviderDot = req.body.provider === 'dot'
      const currency = isProviderDot ? 'DOT' : 'EUR' // @todo add default currency
      const amount = isProviderDot
        ? await getPriceInDot(req.body.amount)
        : req.body.amount
      const payload = {
        amount,
        currency,
        userId: req.user.id,
        status: PaymentStatus.Intent,
        provider: req.body.provider,
        purchasedProductReference: req.body.purchasedProductReference,
        reference: [],
      }
      const payment = Payment.create(payload)
      return payment
    }
  )

  fastify.put(
    '/payments',
    async (
      req: FastifyRequest<{
        Body: {
          id: string
          status: string
          providerReferenceId: string
          reference: Array<any>
        }
      }>,
      reply
    ) => {
      const paymentRecord = await Payment.findByPk(req.body.id)
      const data = req.body
      if (paymentRecord) {
        let updatedReference = []
        if (!paymentRecord.reference) {
          updatedReference = data.reference
        } else {
          updatedReference = [...paymentRecord.reference, ...data.reference]
        }
        // const updatedReference = [
        //   ...(!paymentRecord.reference ? [] : paymentRecord.reference),
        //   data.reference,
        // ]
        paymentRecord.update({
          reference: updatedReference,
          status: data.status,
          providerReferenceId: data.providerReferenceId,
        })
      }
      return paymentRecord
    }
  )
}

const adminRouter: FastifyPluginCallback = async function (fastify, opts) {}

module.exports = {
  publicRouter,
  userRouter,
  adminRouter,
}
