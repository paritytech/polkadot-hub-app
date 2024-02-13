import dayjs from 'dayjs'
import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import csvParser from 'papaparse'
import { Op, Filterable } from 'sequelize'
import { appConfig } from '#server/app-config'
import { getJSONdiff } from '#server/utils'
import config from '#server/config'
import { User } from '#modules/users/server/models'
import {
  FormDuplicationRule,
  FormSubmissionRequest,
  PublicForm,
} from '#modules/forms/types'
import { EntityVisibility } from '#shared/types'
import * as fp from '#shared/utils/fp'
import { Permissions } from '../permissions'
import {
  Event,
  EventAdminResponse,
  EventApplication,
  EventApplicationStatus,
  EventCreationRequest,
  EventParticipant,
  EventPublicResponse,
  EventToogleCheckboxRequest,
} from '../types'
import { getApplicationMessage, getApplicationUpdateMessage } from './helpers'
import { isEventApplicationUncompleted } from './helpers/checklists'
import { Metadata } from '../metadata-schema'

const mId = 'events'

const getAllFormSubmissionsUrl = (formId: string) =>
  `${config.appHost}/admin/forms/${formId}/submissions`

const getUserFormSubmissionUrl = (formId: string, submissionId: string) =>
  `${config.appHost}/admin/forms/${formId}/submissions/${submissionId}`

const publicRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get(
    '/event/:eventId',
    async (
      req: FastifyRequest<{
        Params: { eventId: string }
        Reply: EventPublicResponse
      }>,
      reply
    ) => {
      const event = await fastify.db.Event.findByPk(req.params.eventId)
      if (!event) {
        return reply.throw.notFound()
      }
      let form = null
      if (event.formId) {
        form = await fastify.db.Form.findByPk(event?.formId)
      }

      if (!req.can(Permissions.AdminManage)) {
        if (event.visibility === EntityVisibility.None) {
          return reply.throw.notFound()
        }
        const userRoles = req.user
          ? req.user.roles
          : [appConfig.lowPriorityRole]
        if (!fp.hasIntersection(event.allowedRoles, userRoles)) {
          return reply.throw.notFound()
        }
      }

      const application = req.user
        ? await fastify.db.EventApplication.findOne({
            where: {
              userId: req.user.id,
              eventId: event.id,
            },
          })
        : null

      const checkmarks = application
        ? await fastify.db.EventCheckmark.findAll({
            where: {
              userId: req.user.id,
              eventId: event.id,
            },
          })
        : []

      return event.usePublicView(application, checkmarks, form)
    }
  )
}

const userRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.post(
    '/event/:eventId/apply',
    async (req: FastifyRequest<{ Params: { eventId: string } }>, reply) => {
      const event = await fastify.db.Event.findByPk(req.params.eventId)
      if (!event) {
        return reply.throw.notFound()
      }

      if (!req.can(Permissions.AdminManage)) {
        if (event.visibility === EntityVisibility.None) {
          return reply.throw.notFound()
        }
        if (!fp.hasIntersection(event.allowedRoles, req.user.roles)) {
          return reply.throw.notFound()
        }
      }

      if (event.formId) {
        return reply.throw.rejected(
          `The event's questionnaire is required for submission`
        )
      }
      const application = await fastify.db.EventApplication.findOne({
        where: {
          userId: req.user.id,
          eventId: event.id,
        },
      })
      if (application) {
        return reply.throw.rejected(`You already have an application`)
      }

      const newApplication = await fastify.db.EventApplication.create({
        creatorUserId: req.user.id,
        userId: req.user.id,
        status: event.getApplicationStatus(req.user),
        eventId: event.id,
        formId: null,
        formSubmissionId: null,
      })

      // Send user notification via Matrix
      const matrix = fastify.integrations.Matrix
      if (matrix && req.user.id && event) {
        const user = req.user
        const message = getApplicationMessage(
          newApplication.status,
          user,
          event
        )
        if (message) {
          matrix.sendMessageToUserDeferred(user, message)
        }
      }
      return reply.ok()
    }
  )

  fastify.get(
    '/event/:eventId/form',
    async (
      req: FastifyRequest<{ Params: { eventId: string }; Reply: PublicForm }>,
      reply
    ) => {
      const event = await fastify.db.Event.findByPk(req.params.eventId)
      if (!event) {
        return reply.throw.notFound()
      }
      if (!event.formId) {
        return reply.throw.gone()
      }
      const form = await fastify.db.Form.findByPk(event.formId)
      if (!form) {
        return reply.throw.notFound()
      }

      if (!req.can(Permissions.AdminManage)) {
        if (form.visibility === EntityVisibility.None) {
          return reply.throw.notFound()
        }
        // Inherit access policy from the parent event
        if (!fp.hasIntersection(event.allowedRoles, req.user.roles)) {
          return reply.throw.notFound()
        }
      }

      // Check previous application
      if (form.duplicationRule === 'reject') {
        const formSubmission = await fastify.db.FormSubmission.findOneForUser(
          form.id,
          req.user.id
        )
        if (formSubmission) {
          return reply.throw.conflict()
        }
      }

      return form.usePublicFormView()
    }
  )

  // TODO: GET /event/:eventId/form/submissions -> PublicFormSubmission

  // TODO: omit the `formId` parameter
  fastify.post(
    '/event/:eventId/form/:formId/apply',
    async (
      req: FastifyRequest<{
        Params: { eventId: string; formId: string }
        Body: FormSubmissionRequest
      }>,
      reply
    ) => {
      const user = req.body.userId
        ? await fastify.db.User.findByPkActive(req.body.userId)
        : req.user
      const author = req.user
      if (!user || !author) {
        return reply.throw.badParams('Bad params')
      }

      const event = await fastify.db.Event.findByPk(req.params.eventId)
      if (!event) {
        return reply.throw.notFound()
      }
      if (event.formId !== req.params.formId) {
        return reply.throw.badParams()
      }
      const form = await fastify.db.Form.findByPk(event.formId)
      if (!form) {
        return reply.throw.notFound()
      }

      const isDirect = user.id === author.id
      if (!isDirect) {
        if (!req.can(Permissions.AdminManage)) {
          return reply.throw.accessDenied(
            "You don't have enough permissions for submitting on someone's behalf"
          )
        }
      }

      if (!req.can(Permissions.AdminManage)) {
        if (form.visibility === EntityVisibility.None) {
          return reply.throw.notFound()
        }
        // Inherit access policy from the parent event
        if (!fp.hasIntersection(event.allowedRoles, req.user.roles)) {
          return reply.throw.notFound()
        }
      }

      // Check previous form submission
      let formSubmission = null
      if (
        (
          ['reject', 'rewrite', 'rewrite_edit'] as FormDuplicationRule[]
        ).includes(form.duplicationRule)
      ) {
        formSubmission = await fastify.db.FormSubmission.findOneForUser(
          form.id,
          user.id
        )
        if (formSubmission && form.duplicationRule === 'reject') {
          return reply.throw.conflict()
        }

        if (
          formSubmission &&
          (['rewrite', 'rewrite_edit'] as FormDuplicationRule[]).includes(
            form.duplicationRule
          )
        ) {
          const formattedAnswers = form.formatAnswers(req.body.data)
          const changes = getJSONdiff(
            formSubmission.answers,
            formattedAnswers,
            'question'
          )
          await formSubmission.update({
            answers: formattedAnswers,
          })

          const eventApplication = await fastify.db.EventApplication.findOne({
            where: {
              userId: user.id,
              eventId: event.id,
              formSubmissionId: formSubmission.id,
            },
          })

          if (
            eventApplication?.status === EventApplicationStatus.CancelledUser
          ) {
            // reopen event application
            await eventApplication
              .set({
                status: event.getApplicationStatus(user),
              })
              .save()
          }

          if (form.responsibleUserIds.length && !!changes.length) {
            if (!eventApplication) {
              fastify.log.warn(
                {
                  formId: form.id,
                  userId: user.id,
                  formSubmissionId: formSubmission.id,
                },
                'Skipped form submission change notifications: missing event application'
              )
            } else {
              const responsibleUsers = await fastify.db.User.findAllActive({
                where: { id: { [Op.in]: form.responsibleUserIds } },
              })
              const data = {
                user: user.usePublicProfileView(),
                form,
                changes,
                formSubmissionsUrl: getAllFormSubmissionsUrl(form.id),
                userFormSubmissionUrl: getUserFormSubmissionUrl(
                  form.id,
                  formSubmission.id
                ),
                office: req.office,
              }
              if (
                fastify.integrations.Matrix &&
                form.responsibleUserIds.length
              ) {
                const message = appConfig.templates.notification(
                  'forms',
                  'formSubmissionChange',
                  data
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
              if (fastify.integrations.EmailSMTP) {
                const emailMessage = appConfig.templates.email(
                  'forms',
                  'formSubmissionChange',
                  data
                )
                if (emailMessage?.html) {
                  for (const responsibleUser of responsibleUsers) {
                    fastify.integrations.EmailSMTP.sendEmailDeferred({
                      to: responsibleUser.email,
                      html: emailMessage.html,
                      subject: emailMessage.subject ?? '',
                    })
                  }
                }
              }
            }
          }

          return reply.ok()
        }
      }

      // Create form submission
      formSubmission = await fastify.db.FormSubmission.create({
        creatorUserId: author.id,
        userId: user.id,
        formId: form.id,
        answers: form.formatAnswers(req.body.data),
      })

      // Create event application
      const eventApplicationStatus = event.getApplicationStatus(user)
      const eventApplication = await fastify.db.EventApplication.create({
        creatorUserId: author.id,
        status: eventApplicationStatus,
        userId: user.id,
        eventId: event.id,
        formId: form.id,
        formSubmissionId: formSubmission.id,
      })

      // Notify responsible managers via Matrix
      if (fastify.integrations.Matrix && form.responsibleUserIds.length) {
        const responsibleUsers = await fastify.db.User.findAllByIds(
          form.responsibleUserIds
        )

        const message = appConfig.templates.notification(
          'forms',
          'formSubmission',
          {
            user: user.usePublicProfileView(),
            form,
            formSubmissionsUrl: getAllFormSubmissionsUrl(form.id),
            userFormSubmissionUrl: getUserFormSubmissionUrl(
              form.id,
              formSubmission.id
            ),
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

      // Send user notification to the user via Matrix
      const matrix = fastify.integrations.Matrix
      if (matrix) {
        const message = getApplicationMessage(
          eventApplication.status,
          user,
          event
        )
        if (message) {
          matrix.sendMessageToUserDeferred(user, message)
        }
        // Invite in the event's Matrix room
        if (
          eventApplication.status === 'confirmed' &&
          event.externalIds.matrixRoom &&
          user.externalIds.matrixRoomId
        ) {
          matrix.inviteUserInRoomDeferred(
            event.externalIds.matrixRoom,
            user.externalIds.matrixRoomId
          )
        }
      }
      return reply.ok()
    }
  )

  fastify.get('/event', async (req, reply) => {
    if (!req.office) {
      return reply.throw.badParams('Invalid office ID')
    }
    const events = await fastify.db.Event.findAll({
      where: {
        endDate: {
          [Op.gte]: new Date(),
        },
        visibility: EntityVisibility.Visible,
        allowedRoles: { [Op.overlap]: req.user.roles },
        offices: { [Op.contains]: [req.office.id] },
      },
      order: ['startDate'],
    })

    const applications = await fastify.db.EventApplication.findAll({
      where: {
        userId: req.user.id,
        eventId: {
          [Op.in]: events.map((x: Event) => x.id),
        },
      },
    })

    return events.map((e) => {
      const application = applications.find((a) => a.eventId === e.id)
      return e.usePublicView(application || null, [], null)
    })
  })

  fastify.get('/event/me', async (req, reply) => {
    if (!req.office) {
      return reply.throw.badParams('Invalid office ID')
    }

    const applicationEventIds = await fastify.db.EventApplication.findAll({
      where: {
        status: {
          [Op.in]: [
            EventApplicationStatus.Opened,
            EventApplicationStatus.Pending,
            EventApplicationStatus.Confirmed,
          ],
        },
        userId: req.user.id,
      },
      attributes: ['eventId'],
    }).then((xs) => xs.map((x) => x.eventId))

    const events = await fastify.db.Event.findAll({
      where: {
        id: { [Op.in]: applicationEventIds },
        endDate: {
          [Op.gte]: new Date(),
        },
        visibility: {
          [Op.in]: [EntityVisibility.Visible, EntityVisibility.Url],
        },
      },
      order: [['startDate', 'ASC']],
    })
    return events
  })

  fastify.get('/event/uncompleted', async (req, reply) => {
    if (!req.office) {
      return reply.throw.badParams('Invalid office ID')
    }

    // fetch all upcoming event IDs
    let events = await fastify.db.Event.findAll({
      where: {
        endDate: {
          [Op.gte]: new Date(),
        },
        visibility: {
          [Op.in]: [EntityVisibility.Visible, EntityVisibility.Url],
        },
      },
    })
    events = events.filter((x) => x.checklist?.length) // FIXME: move it in the sql query
    if (!events.length) {
      return []
    }
    const applicationsProgress: boolean[] = await Promise.all(
      events.map(async (event) => {
        const eventApplicationExists =
          await fastify.db.EventApplication.findOne({
            where: {
              eventId: event.id,
              userId: req.user.id,
              status: EventApplicationStatus.Confirmed,
            },
          })
        if (eventApplicationExists) {
          return isEventApplicationUncompleted(
            fastify.sequelize,
            event,
            req.user.id
          )
        }
        return false
      })
    )
    const filteredEvents = events.filter((x, i) => applicationsProgress[i])
    return filteredEvents
  })

  fastify.get(
    '/event/with-form/:formId',
    async (req: FastifyRequest<{ Params: { formId: string } }>, reply) => {
      if (!req.params.formId) {
        return reply.throw.badParams('Missing formId')
      }
      const event = await fastify.db.Event.findOne({
        where: { formId: req.params.formId },
      })
      return event?.usePreviewView() || null
    }
  )

  fastify.post(
    '/event/:eventId/checkmark',
    async (
      req: FastifyRequest<{
        Params: { eventId: string }
        Body: EventToogleCheckboxRequest
      }>,
      reply
    ) => {
      const event = await fastify.db.Event.findByPk(req.params.eventId)
      if (!event) {
        return reply.throw.notFound()
      }

      if (!req.can(Permissions.AdminManage)) {
        if (event.visibility === EntityVisibility.None) {
          return reply.throw.accessDenied()
        }
        if (!fp.hasIntersection(event.allowedRoles, req.user.roles)) {
          return reply.throw.accessDenied()
        }
      }

      const application = await fastify.db.EventApplication.findOne({
        where: {
          userId: req.user.id,
          eventId: event.id,
        },
      })

      if (
        !application ||
        application.status !== EventApplicationStatus.Confirmed
      ) {
        return reply.throw.badParams()
      }

      const checkmark = await fastify.db.EventCheckmark.findOne({
        where: {
          userId: req.user.id,
          eventId: event.id,
          checkboxId: req.body.checkboxId,
        },
      })

      if (req.body.checked && !checkmark) {
        await fastify.db.EventCheckmark.create({
          userId: req.user.id,
          eventId: event.id,
          checkboxId: req.body.checkboxId,
        })
      } else if (!req.body.checked && checkmark) {
        await checkmark.destroy()
      }

      return reply.ok()
    }
  )

  fastify.put(
    '/applications/:applicationId',
    async (
      req: FastifyRequest<{
        Params: { applicationId: string }
        Body: { status: EventApplicationStatus }
      }>,
      reply
    ) => {
      const application = await fastify.db.EventApplication.findOne({
        where: {
          userId: req.user.id,
          id: req.params.applicationId,
        },
      })

      if (!application) {
        return reply.throw.notFound()
      }

      if (req.user.id !== application.userId) {
        return reply.throw.accessDenied()
      }

      // the user can only change status from pending/confirmed
      if (
        ![
          EventApplicationStatus.Opened,
          EventApplicationStatus.Confirmed,
        ].includes(application.status)
      ) {
        return reply.throw.rejected()
      }

      // the user can only change status to cancelled_user
      if (![EventApplicationStatus.CancelledUser].includes(req.body.status)) {
        return reply.throw.rejected()
      }

      await application.set({ status: req.body.status }).save()

      const event = await fastify.db.Event.findByPk(application.eventId)
      const user = await fastify.db.User.findByPkActive(application.userId)

      // Send user notification via Matrix
      if (fastify.integrations.Matrix && user && event) {
        const message = getApplicationMessage(application.status, user, event)
        if (message) {
          fastify.integrations.Matrix.sendMessageToUserDeferred(user, message)
        }

        const adminMessage = getApplicationUpdateMessage(
          application.status,
          user,
          event
        )
        if (adminMessage) {
          fastify.integrations.Matrix.sendMessageInAdminRoomDeferred(
            adminMessage
          )
        }
      }

      if (
        fastify.integrations.EmailSMTP &&
        user &&
        event &&
        event.responsibleUserIds.length
      ) {
        const eventApplicationsUrl = `${config.appHost}/admin/events/${event.id}/applications`

        const emailMessage = appConfig.templates.email(
          mId,
          'eventApplicationCancelledUser',
          {
            user: {
              fullName: user.fullName,
              email: user.email,
              applicationUrl: `${eventApplicationsUrl}/${application.id}`,
              profileUrl: `${config.appHost}/profile/${user.id}`,
            },
            event: {
              title: event.title,
              applicationsUrl: eventApplicationsUrl,
            },
            office: req.office,
            appName: appConfig.config.application.name,
          }
        )

        if (emailMessage?.html) {
          for (const responsibleUserId of event.responsibleUserIds) {
            const userDetails = await User.findByPkActive(responsibleUserId)
            if (!userDetails) {
              return
            }
            fastify.integrations.EmailSMTP.sendEmailDeferred({
              to: userDetails.email,
              html: emailMessage.html,
              subject: emailMessage.subject ?? '',
            })
          }
        }
      }
      return reply.ok()
    }
  )

  fastify.get(
    '/global-events',
    async (
      req: FastifyRequest<{
        Querystring: { month: number; year: number }
      }>,
      reply
    ) => {
      const date = dayjs().month(req.query.month).year(req.query.year).date(1)

      const events = await fastify.db.Event.findAll({
        attributes: [
          'id',
          'title',
          'startDate',
          'endDate',
          'location',
          [fastify.sequelize.literal('"metadata"->>\'type\''), 'type'],
        ],
        where: {
          [Op.and]: [
            {
              startDate: {
                [Op.and]: [
                  {
                    [Op.gte]: dayjs()
                      .month(req.query.month)
                      .year(req.query.year)
                      .date(1)
                      .format('YYYY-MM-DD'),
                  },
                  {
                    [Op.lte]: date.endOf('month').format('YYYY-MM-DD'),
                  },
                ],
              },
              'metadata.global': true,
              visibility: EntityVisibility.Visible,
              allowedRoles: { [Op.overlap]: req.user.roles },
            },
          ],
        },
        order: [['startDate', 'ASC']],
      })
      return events
    }
  )

  fastify.get('/metadata', async (req: FastifyRequest, reply) => {
    req.check(Permissions.ListGlobalEvents)
    return appConfig.getModuleMetadata('events') as Metadata
  })

  fastify.get(
    '/event/:eventId/participants',
    async (req: FastifyRequest<{ Params: { eventId: string } }>, reply) => {
      if (!req.can(Permissions.ListParticipants)) {
        return []
      }
      const where: Filterable<Event>['where'] = {
        id: req.params.eventId,
        visibility: {
          [Op.in]: [EntityVisibility.Visible, EntityVisibility.Url],
        },
      }
      if (!req.can(Permissions.AdminManage)) {
        where.allowedRoles = { [Op.overlap]: req.user.roles }
      }
      const event = await fastify.db.Event.findOne({ where })
      if (!event) {
        return []
      }
      const applications = (await fastify.db.EventApplication.findAll({
        where: {
          eventId: event.id,
          status: EventApplicationStatus.Confirmed,
        },
        include: [
          { model: User, attributes: ['id', 'fullName', 'team', 'avatar'] },
        ],
      })) as unknown as Array<EventApplication & { User: EventParticipant }>

      return applications.map((x) => x.User)
    }
  )
}

const adminRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get(
    '/event',
    async (
      req: FastifyRequest<{
        Reply: EventAdminResponse[]
        Querystring: { visibility?: EntityVisibility; office?: string }
      }>,
      reply
    ) => {
      req.check(Permissions.AdminList)

      const where: Filterable<Event>['where'] = {}
      if (req.query.office) {
        where.offices = { [Op.contains]: [req.query.office] }
      }
      if (req.query.visibility) {
        where.visibility = req.query.visibility
      }
      const events = await fastify.db.Event.findAll({
        where,
        order: [['startDate', 'DESC']],
      })

      const applicationsCountByEventId =
        await fastify.db.EventApplication.countByEventId()
      const result: EventAdminResponse[] = events.map((x) => ({
        ...x.toJSON(),
        applicationsCount: applicationsCountByEventId[x.id] || 0,
      }))
      return result
    }
  )

  fastify.get(
    '/event/:eventId',
    async (
      req: FastifyRequest<{ Params: { eventId: string }; Reply: Event }>,
      reply
    ) => {
      req.check(Permissions.AdminList)
      const event = await fastify.db.Event.findByPk(req.params.eventId)
      if (!event) {
        return reply.throw.notFound()
      }
      return event
    }
  )

  fastify.post(
    '/event',
    async (req: FastifyRequest<{ Body: EventCreationRequest }>, reply) => {
      req.check(Permissions.AdminManage)

      const event = await fastify.db.Event.create({
        creatorUserId: req.user.id,
        title: req.body.title,
        description: req.body.description,
        offices: req.body.offices,
        visibility: req.body.visibility,
        allowedRoles: req.body.allowedRoles,
        content: req.body.content,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        location: req.body.location,
        locationLat: req.body.locationLat,
        locationLng: req.body.locationLng,
        coverImageUrl: req.body.coverImageUrl,
        checklist: req.body.checklist,
        confirmationRule: req.body.confirmationRule,
        notificationRule: req.body.notificationRule,
        formId: req.body.formId == 'none' ? null : req.body.formId,
        responsibleUserIds: req.body.responsibleUserIds,
      })
      return reply.ok()
    }
  )

  fastify.put(
    '/event/:eventId',
    async (
      req: FastifyRequest<{
        Body: EventCreationRequest
        Params: { eventId: string }
      }>,
      reply
    ) => {
      req.check(Permissions.AdminManage)
      const event = await fastify.db.Event.findByPk(req.params.eventId)
      if (!event) {
        return reply.throw.notFound()
      }

      await event
        .set({
          title: req.body.title,
          description: req.body.description,
          offices: req.body.offices,
          allowedRoles: req.body.allowedRoles,
          visibility: req.body.visibility,
          content: req.body.content,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
          mapUrl: req.body.mapUrl,
          address: req.body.address,
          location: req.body.location,
          locationLat: req.body.locationLat,
          locationLng: req.body.locationLng,
          coverImageUrl: req.body.coverImageUrl,
          checklist: req.body.checklist,
          confirmationRule: req.body.confirmationRule,
          notificationRule: req.body.notificationRule,
          formId: req.body.formId == 'none' ? null : req.body.formId,
          responsibleUserIds: req.body.responsibleUserIds ?? [],
        })
        .save()
      return reply.ok()
    }
  )

  // @todo implement soft deletion
  // fastify.delete(
  //   '/event/:eventId',
  //   async (
  //     req: FastifyRequest<{ Params: { eventId: string } }>,
  //     reply
  //   ) => {
  //     req.check(Permissions.AdminManage)
  //     const event = await fastify.db.Event.findByPk(req.params.eventId)
  //     if (!event) {
  //       return reply.throw.notFound()
  //     }
  //     await event.destroy()
  //     return reply.ok()
  //   }
  // )

  fastify.get(
    '/event/:eventId/application',
    async (
      req: FastifyRequest<{
        Params: { eventId: string }
        Reply: EventApplication[]
      }>,
      reply
    ) => {
      req.check(Permissions.AdminList)
      const event = await fastify.db.Event.findByPk(req.params.eventId)
      if (!event) {
        return reply.throw.notFound()
      }
      const applications = await fastify.db.EventApplication.findAll({
        where: {
          eventId: event.id,
        },
      })
      return applications
    }
  )

  fastify.get(
    '/event/:eventId/applications.csv',
    async (req: FastifyRequest<{ Params: { eventId: string } }>, reply) => {
      req.check(Permissions.AdminList)

      const event = await fastify.db.Event.findByPk(req.params.eventId)
      if (!event) {
        return reply.throw.notFound()
      }

      const applications = await fastify.db.EventApplication.findAll({
        where: { eventId: event.id },
      })

      const form = event.formId
        ? await fastify.db.Form.findByPk(event.formId)
        : null
      const questions = form ? form.listInputBlocks() : []
      const formSubmissions = form
        ? await fastify.db.FormSubmission.findAll({
            where: { formId: form.id },
          })
        : []
      const userIds = Array.from(new Set(applications.map((s) => s.userId)))
      const users = await fastify.db.User.findAllActive({
        where: { id: { [Op.in]: userIds } },
      })
      const usersById = users.reduce(
        (acc, x) => ({ ...acc, [x.id]: x }),
        {} as Record<string, User>
      )

      const csvRows: string[][] = []

      // csv header
      const header = ['_Status', '_User', '_Email']
      form?.metadataFields.forEach((f) => {
        header.push(f.label)
      })
      questions.forEach((q) => {
        header.push(q.label || q.id)
      })
      csvRows.push(header)

      // csv body
      applications.forEach((a) => {
        const row: string[] = []
        const user = usersById[a.userId]
        row.push(a.status)
        row.push(user.fullName || '–')
        row.push(user.email || '–')

        const formSubmission = formSubmissions.find(
          (x) => x.id === a.formSubmissionId
        )
        const metadata = formSubmission?.metadata || []
        form?.metadataFields.forEach((f) => {
          const metadataRecord = metadata.find((x) => x.id === f.id)
          row.push(metadataRecord?.value || '')
        })

        questions.forEach((q) => {
          const answer = formSubmission?.answers.find((x) => x.id === q.id)
          const rawValue = answer?.value || ''
          const value = Array.isArray(rawValue) ? rawValue.join(', ') : rawValue
          row.push(value)
        })

        csvRows.push(row)
      })

      const csvContent = csvParser.unparse(csvRows)

      reply.headers({
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=event-applications.csv', // TODO: use slugify to name the exported file
        Pragma: 'no-cache',
      })
      return reply.code(200).send(csvContent)
    }
  )

  fastify.get(
    '/event/:eventId/application/:eventApplicationId',
    async (
      req: FastifyRequest<{
        Params: { eventId: string; eventApplicationId: string }
        Reply: EventApplication | null
      }>,
      reply
    ) => {
      req.check(Permissions.AdminList)
      const event = await fastify.db.Event.findByPk(req.params.eventId)
      if (!event) {
        return reply.throw.notFound()
      }
      const application = await fastify.db.EventApplication.findOne({
        where: {
          id: req.params.eventApplicationId,
          eventId: event.id,
        },
      })
      return application
    }
  )

  fastify.put(
    '/event/:eventId/application/:applicationId',
    async (
      req: FastifyRequest<{
        Params: { eventId: string; applicationId: string }
        Body: Pick<EventApplication, 'status'>
      }>,
      reply
    ) => {
      req.check(Permissions.AdminManage)
      const event = await fastify.db.Event.findByPk(req.params.eventId)
      if (!event) {
        return reply.throw.notFound()
      }
      const application = await fastify.db.EventApplication.findOne({
        where: { id: req.params.applicationId, eventId: req.params.eventId },
      })
      if (!application) {
        return reply.throw.notFound()
      }

      await application.set({ status: req.body.status }).save()

      // Send user notification via Matrix
      if (fastify.integrations.Matrix) {
        const user = await fastify.db.User.findByPkActive(application.userId)
        if (user) {
          const message = getApplicationMessage(application.status, user, event)
          if (message) {
            fastify.integrations.Matrix.sendMessageToUserDeferred(user, message)
          }
        }
      }
      return reply.ok()
    }
  )

  fastify.delete(
    '/event/:eventId/application/:applicationId',
    async (
      req: FastifyRequest<{
        Params: { eventId: string; applicationId: string }
      }>,
      reply
    ) => {
      req.check(Permissions.AdminManage)
      const event = await fastify.db.Event.findByPk(req.params.eventId)
      if (!event) {
        return reply.throw.notFound()
      }
      const application = await fastify.db.EventApplication.findOne({
        where: { id: req.params.applicationId, eventId: req.params.eventId },
      })
      if (!application) {
        return reply.throw.notFound()
      }

      try {
        await fastify.sequelize.transaction(async (transaction) => {
          await application.destroy({ transaction })
          if (application.formSubmissionId && application.formId) {
            await fastify.db.FormSubmission.destroy({
              where: {
                id: application.formSubmissionId,
                formId: application.formId,
              },
              transaction,
            })
          }
        })
      } catch (err) {
        fastify.log.error(err)
        return reply.throw.internalError(
          "The event application can't be removed"
        )
      }

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
}

module.exports = {
  publicRouter,
  userRouter,
  adminRouter,
}
