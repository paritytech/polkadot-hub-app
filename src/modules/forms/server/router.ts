import dayjs from 'dayjs'
import csvParser from 'papaparse'
import {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyReply,
  FastifyRequest,
} from 'fastify'
import { Op, Filterable } from 'sequelize'
import { appConfig } from '#server/app-config'
import { getJSONdiff } from '#server/utils'
import { EntityVisibility } from '#shared/types'
import * as fp from '#shared/utils/fp'
import { User } from '#modules/users/types'
import { useRateLimit } from '#server/utils/rate-limit'
import { Permissions } from '../permissions'
import { getTemplateData } from './helpers'
import {
  Form,
  FormAdminResponse,
  FormCreationRequest,
  FormDuplicationRule,
  FormSubmission,
  FormSubmissionRequest,
  PublicForm,
} from '../types'

const mId = 'forms'

const publicRouter: FastifyPluginCallback = async (fastify, opts) => {
  fastify.get(
    '/form/:formId',
    async (
      req: FastifyRequest<{ Params: { formId: string }; Reply: PublicForm }>,
      reply
    ) => {
      const form = await fastify.db.Form.findByPk(req.params.formId)
      if (!form) {
        return reply.throw.notFound()
      }

      if (!req.user && form.visibility !== EntityVisibility.UrlPublic) {
        return reply.throw.notFound()
      }

      if (!req.can(Permissions.AdminManage)) {
        if (form.visibility === EntityVisibility.None) {
          return reply.throw.notFound()
        }
        if (form.visibility !== EntityVisibility.UrlPublic) {
          if (!fp.hasIntersection(form.allowedRoles, req.user.roles)) {
            return reply.throw.notFound()
          }
        }
      }

      if (form.duplicationRule === 'reject') {
        if (!req.user) {
          return reply.throw.conflict()
        }
        const formSubmission = await fastify.db.FormSubmission.findOneForUser(
          form.id,
          req.user.id
        )
        if (formSubmission) {
          if (!form.responsibleUserIds.includes(req.user.id)) {
            if (!req.can(Permissions.AdminManage)) {
              return reply.throw.conflict()
            }
          }
        }
      }

      return form.usePublicFormView()
    }
  )

  const SUBMIT_FORM_TIME_WINDOW_SECONDS = 30
  async function submitFormRouteHandler(
    req: FastifyRequest<{
      Params: { formId: string }
      Body: FormSubmissionRequest
    }>,
    reply: FastifyReply
  ) {
    const form = await fastify.db.Form.findByPk(req.params.formId)
    if (!form) {
      return reply.throw.notFound()
    }

    if (!req.user && form.visibility !== EntityVisibility.UrlPublic) {
      return reply.throw.notFound()
    }

    // check visibility & allowedRoles
    if (!req.can(Permissions.AdminManage)) {
      if (form.visibility === EntityVisibility.None) {
        return reply.throw.gone()
      }
      if (form.visibility !== EntityVisibility.UrlPublic) {
        if (!fp.hasIntersection(form.allowedRoles, req.user.roles)) {
          return reply.throw.notFound()
        }
      }
    }

    // process anonymous submission
    if (!req.user && form.visibility === EntityVisibility.UrlPublic) {
      const formSubmission = await fastify.db.FormSubmission.create({
        creatorUserId: null,
        userId: null,
        formId: form.id,
        answers: form.formatAnswers(req.body.data),
      })

      if (form.responsibleUserIds.length && fastify.integrations.Matrix) {
        const responsibleUsers = await fastify.db.User.findAllActive({
          where: { id: { [Op.in]: form.responsibleUserIds } },
        })
        const message = appConfig.templates.notification(
          mId,
          'formSubmissionAnonymous',
          {
            ...getTemplateData(null, form, formSubmission),
            office: req.office,
          }
        )

        if (message) {
          for (const responsibleUser of responsibleUsers) {
            fastify.integrations.Matrix.sendMessageToUserDeferred(
              responsibleUser,
              message
            )
          }
        }
      }

      return reply.ok()
    }

    // retrieve submission user & author
    const user = req.body.userId
      ? await fastify.db.User.findByPk(req.body.userId)
      : req.user
    const author = req.user
    if (!user || !author) {
      return reply.throw.badParams('Bad params')
    }

    if (user.id !== author.id && !req.can(Permissions.AdminManage)) {
      return reply.throw.accessDenied(
        "You don't have enough permissions for submitting on someone's behalf"
      )
    }

    // process duplicationRule
    let formSubmission = null
    if (
      [
        FormDuplicationRule.Reject,
        FormDuplicationRule.Rewrite,
        FormDuplicationRule.RewriteEdit,
      ].includes(form.duplicationRule)
    ) {
      formSubmission = await fastify.db.FormSubmission.findOneForUser(
        form.id,
        user.id
      )

      if (formSubmission && form.duplicationRule === 'reject') {
        if (!form.responsibleUserIds.includes(author.id)) {
          if (!req.can(Permissions.AdminManage)) {
            return reply.throw.conflict()
          }
        }
      }

      if (
        formSubmission &&
        [FormDuplicationRule.Rewrite, FormDuplicationRule.RewriteEdit].includes(
          form.duplicationRule
        )
      ) {
        const formattedAnswers = form.formatAnswers(req.body.data)
        const changes = getJSONdiff(
          formSubmission.answers,
          formattedAnswers,
          'question'
        )

        if (form.responsibleUserIds.length && !!changes.length) {
          const responsibleUsers = await fastify.db.User.findAllActive({
            where: { id: { [Op.in]: form.responsibleUserIds } },
          })
          const messageKey = 'formSubmissionChange'

          if (fastify.integrations.Matrix && form.responsibleUserIds.length) {
            const message = appConfig.templates.notification(mId, messageKey, {
              ...getTemplateData(user, form, formSubmission, changes),
              office: req.office,
            })
            if (message) {
              for (const responsibleUser of responsibleUsers) {
                fastify.integrations.Matrix.sendMessageToUserDeferred(
                  responsibleUser,
                  message
                )
              }
            }
          }

          if (fastify.integrations.EmailSMTP) {
            const emailMessage = appConfig.templates.email(mId, messageKey, {
              ...getTemplateData(user, form, formSubmission, changes),
              office: req.office,
            })

            if (!emailMessage?.html) {
              return reply.ok()
            }
            for (const responsibleUser of responsibleUsers) {
              fastify.integrations.EmailSMTP.sendEmailDeferred({
                to: responsibleUser.email,
                html: emailMessage.html,
                subject: emailMessage.subject ?? '',
              })
            }
          }
        }

        await formSubmission.update({
          answers: formattedAnswers,
        })
        return reply.ok()
      }
    }

    // create new submission
    formSubmission = await fastify.db.FormSubmission.create({
      creatorUserId: author.id,
      userId: user.id,
      formId: form.id,
      answers: form.formatAnswers(req.body.data),
    })

    if (form.responsibleUserIds.length && fastify.integrations.Matrix) {
      const responsibleUsers = await fastify.db.User.findAll({
        where: { id: { [Op.in]: form.responsibleUserIds } },
      })
      const message = appConfig.templates.notification(mId, 'formSubmission', {
        ...getTemplateData(user, form, formSubmission),
        office: req.office,
      })

      if (message) {
        for (const responsibleUser of responsibleUsers) {
          fastify.integrations.Matrix.sendMessageToUserDeferred(
            responsibleUser,
            message
          )
        }
      }
    }

    return reply.ok()
  }

  fastify.register(async (fastify) => {
    await useRateLimit(
      fastify,
      async (fastify: FastifyInstance) => {
        fastify.post('/form/:formId', submitFormRouteHandler)
      },
      {
        timeWindow: SUBMIT_FORM_TIME_WINDOW_SECONDS * 1e3,
        onExceeded: (req: FastifyRequest) => {
          req.log.warn(
            `Attempting to submit the form more than once every ${SUBMIT_FORM_TIME_WINDOW_SECONDS} seconds.`
          )
        },
      }
    )
  })
}

const userRouter: FastifyPluginCallback = async (fastify, opts) => {
  fastify.get(
    '/form/:formId/submission',
    async (req: FastifyRequest<{ Params: { formId: string } }>, reply) => {
      const form = await fastify.db.Form.findByPk(req.params.formId)
      if (!form) {
        return reply.throw.notFound()
      }
      const formSubmission = await fastify.db.FormSubmission.findOneForUser(
        form.id,
        req.user.id
      )
      return formSubmission
        ? formSubmission.usePublicFormSubmissionView()
        : null
    }
  )
}

const adminRouter: FastifyPluginCallback = async (fastify, opts) => {
  fastify.get(
    '/form',
    async (
      req: FastifyRequest<{
        Reply: FormAdminResponse[]
        Querystring: { visibility?: EntityVisibility }
      }>,
      reply
    ) => {
      req.check(Permissions.AdminList)
      const where: Filterable<Form>['where'] = {}

      if (req.query.visibility) {
        where.visibility = req.query.visibility
      }

      const forms = await fastify.db.Form.findAll({
        where,
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['content'] },
      })
      const submissionsCountByFormId =
        await fastify.db.FormSubmission.countByFormId()
      return forms.map((x) => ({
        ...x.toJSON(),
        submissionsCount: submissionsCountByFormId[x.id] || 0,
      }))
    }
  )

  fastify.get(
    '/form/:formId',
    async (
      req: FastifyRequest<{ Params: { formId: string }; Reply: Form | null }>,
      reply
    ) => {
      req.check(Permissions.AdminList)
      const form = await fastify.db.Form.findByPk(req.params.formId)
      if (!form) {
        return reply.throw.notFound()
      }
      return form
    }
  )

  fastify.put(
    '/form/:formId',
    async (
      req: FastifyRequest<{
        Params: { formId: string }
        Body: Partial<FormCreationRequest>
      }>,
      reply
    ) => {
      req.check(Permissions.AdminManage)
      const form = await fastify.db.Form.findByPk(req.params.formId)
      if (!form) {
        return reply.throw.notFound()
      }
      await fastify.db.Form.update(req.body, {
        where: { id: req.params.formId },
      })
      return reply.ok()
    }
  )

  fastify.delete(
    '/form/:formId',
    async (req: FastifyRequest<{ Params: { formId: string } }>, reply) => {
      req.check(Permissions.AdminManage)
      await fastify.db.Form.destroy({ where: { id: req.params.formId } })
      return reply.ok()
    }
  )

  fastify.get('/responsible-users', async (req, reply) => {
    const roles = appConfig.getRolesByPermission(
      Permissions.AdminReceiveNotifications
    )
    return fastify.db.User.findAllActive({
      where: { roles: { [Op.overlap]: roles } },
    })
  })

  fastify.post(
    '/form/:formId/duplicate',
    async (req: FastifyRequest<{ Params: { formId: string } }>, reply) => {
      req.check(Permissions.AdminManage)
      const form = await fastify.db.Form.findByPk(req.params.formId)
      if (!form) {
        return reply.throw.notFound()
      }
      await fastify.db.Form.create({
        title: `${form.title} (copy)`,
        description: form.description,
        visibility: EntityVisibility.None,
        allowedRoles: [],
        content: form.content,
        duplicationRule: form.duplicationRule,
        creatorUserId: req.user.id,
        responsibleUserIds: form.responsibleUserIds,
      })
      return reply.ok()
    }
  )

  fastify.post(
    '/form',
    async (req: FastifyRequest<{ Body: FormCreationRequest }>, reply) => {
      req.check(Permissions.AdminManage)
      await fastify.db.Form.create({
        ...req.body,
        creatorUserId: req.user.id,
      })
      return reply.ok()
    }
  )

  fastify.get(
    '/form/:formId/submissions',
    async (
      req: FastifyRequest<{
        Params: { formId: string }
        Reply: FormSubmission[]
      }>,
      reply
    ) => {
      req.check(Permissions.AdminList)
      const form = await fastify.db.Form.findByPk(req.params.formId)
      if (!form) {
        return reply.throw.notFound()
      }
      const formSubmissions = await fastify.db.FormSubmission.findAll({
        where: { formId: form.id },
        order: ['createdAt'],
      })
      return formSubmissions
    }
  )

  fastify.get(
    '/form/:formId/submissions.csv',
    async (req: FastifyRequest<{ Params: { formId: string } }>, reply) => {
      req.check(Permissions.AdminList)

      const form = await fastify.db.Form.findByPk(req.params.formId)
      if (!form) {
        return reply.throw.notFound()
      }

      const questions = form.listInputBlocks()
      const formSubmissions = await fastify.db.FormSubmission.findAll({
        where: { formId: form.id },
        order: ['createdAt'],
      })
      const userIds = Array.from(
        new Set(formSubmissions.map((s) => s.userId))
      ).filter(Boolean) as string[]
      const users = await fastify.db.User.findAllActive({
        where: { id: { [Op.in]: userIds } },
      })
      const usersById = users.reduce(
        (acc, x) => ({ ...acc, [x.id]: x }),
        {} as Record<string, User>
      )

      const csvRows: string[][] = []

      // csv header
      const header: string[] = ['_User', '_Email', '_Date']
      form.metadataFields.forEach((f) => {
        header.push(f.label)
      })
      questions.forEach((q) => {
        header.push(q.label || q.id)
      })
      csvRows.push(header)

      // csv body
      formSubmissions.forEach((s) => {
        const row: string[] = []
        const user = s.userId ? usersById[s.userId || ''] : null
        row.push(user ? user.fullName : 'Anonym')
        row.push(user ? user.email : '–')
        row.push(dayjs(s.createdAt).format('D MMM YYYY, HH:mm'))
        const metadata = s.metadata || []
        form.metadataFields.forEach((f) => {
          const metadataRecord = metadata.find((x) => x.id === f.id)
          row.push(metadataRecord?.value || '')
        })

        questions.forEach((q) => {
          const answer = s.answers.find((x) => x.id === q.id)
          const rawValue = answer?.value || ''
          const value = Array.isArray(rawValue) ? rawValue.join(', ') : rawValue
          row.push(value)
        })

        csvRows.push(row)
      })

      const csvContent = csvParser.unparse(csvRows)

      reply.headers({
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=form-submissions.csv', // TODO: use slugify to name the exported file
        Pragma: 'no-cache',
      })
      return reply.code(200).send(csvContent)
    }
  )

  fastify.get(
    '/form/:formId/submissions/:formSubmissionId',
    async (
      req: FastifyRequest<{
        Params: { formId: string; formSubmissionId: string }
        Reply: FormSubmission | null
      }>,
      reply
    ) => {
      req.check(Permissions.AdminList)
      const form = await fastify.db.Form.findByPk(req.params.formId)
      if (!form) {
        return reply.throw.notFound()
      }
      const formSubmission = await fastify.db.FormSubmission.findOne({
        where: {
          id: req.params.formSubmissionId,
          formId: form.id,
        },
      })
      return formSubmission
    }
  )

  fastify.put(
    '/form/:formId/submissions/:formSubmissionId',
    async (
      req: FastifyRequest<{
        Params: { formId: string; formSubmissionId: string }
        Body: Pick<FormSubmission, 'answers' | 'metadata'>
      }>,
      reply
    ) => {
      req.check(Permissions.AdminManage)
      const form = await fastify.db.Form.findByPk(req.params.formId)
      if (!form) {
        return reply.throw.notFound()
      }
      const formSubmission = await fastify.db.FormSubmission.findOne({
        where: {
          id: req.params.formSubmissionId,
          formId: req.params.formId,
        },
      })
      if (!formSubmission) {
        return reply.throw.notFound()
      }
      await formSubmission
        .set({
          answers: req.body.answers,
          metadata: req.body.metadata,
        })
        .save()
      return reply.ok()
    }
  )

  fastify.delete(
    '/form/:formId/submissions/:formSubmissionId',
    async (
      req: FastifyRequest<{
        Params: { formId: string; formSubmissionId: string }
      }>,
      reply
    ) => {
      req.check(Permissions.AdminManage)
      const form = await fastify.db.Form.findByPk(req.params.formId)
      if (!form) {
        return reply.throw.notFound()
      }
      await fastify.db.FormSubmission.destroy({
        where: {
          id: req.params.formSubmissionId,
          formId: req.params.formId,
        },
      })
      return reply.ok()
    }
  )
}

module.exports = {
  publicRouter,
  userRouter,
  adminRouter,
}
