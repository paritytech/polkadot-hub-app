import axios from 'axios'
import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { Payment } from './models'
import { PaymentProvider, PaymentStatus } from '../types'
import { getDotPrice, getPriceInDot } from '../helper'
import { Op } from 'sequelize'
import { User } from '#modules/users/server/models'
import { appConfig } from '#server/app-config'
import config from '#server/config'

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

      const paymentRecord = await fastify.db.Payment.findOne({
        where: {
          id: req.params.paymentId,
        },
        include: {
          model: User,
          required: true,
          attributes: ['email', 'fullName', 'id', 'avatar', 'isInitialised'],
        },
      })
      if (!paymentRecord) {
        return reply.throw.notFound()
      }
      return paymentRecord
    }
  )

  fastify.post(
    '/invoices',
    async (
      req: FastifyRequest<{
        Body: { paymentId: string }
        Reply: any
      }>,
      reply
    ) => {
      if (fastify.integrations.EmailSMTP) {
        const paymentRecord = await fastify.db.Payment.findByPk(
          req.body.paymentId
        )
        if (!paymentRecord) {
          return reply.throw.notFound()
        }
        const user = await fastify.db.User.findByPk(paymentRecord.userId)
        if (!user) {
          return reply.throw.notFound()
        }
        const emailMessage = appConfig.templates.email('payments', 'invoice', {
          companyName: appConfig.config.company.name,
          invoiceLink: `${config.appHost}/payments/invoice/${req.body?.paymentId}`,
          user: {
            fullName: user.fullName,
          },
        })
        if (emailMessage?.html) {
          fastify.integrations.EmailSMTP.sendEmailDeferred({
            to: req.user.email,
            html: emailMessage.html,
            subject: emailMessage.subject,
          })
        }
      }
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

const adminRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get(
    '/payments',
    async (
      req: FastifyRequest<{
        Querystring: { q?: string }
      }>,
      reply
    ) => {
      const paymentRecords = await fastify.db.Payment.findAll({
        where: {
          status: { [Op.ne]: 'intent' },
        },
        order: [['createdAt', 'DESC']],
        include: {
          model: User,
          required: true,
          attributes: ['email', 'fullName'],
        },
      })
      return paymentRecords
    }
  )
}

module.exports = {
  publicRouter,
  userRouter,
  adminRouter,
}
