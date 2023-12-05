import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { Filterable, Op } from 'sequelize'
import { EntityVisibility } from '#shared/types'
import { ChecklistAnswer } from './models'
import { Permissions } from '../permissions'
import {
  Checklist,
  ChecklistCreateFields,
  ChecklistType,
  GeneralChecklistItem,
} from '../types'

const publicRouter: FastifyPluginCallback = async function (fastify, opts) {}

const userRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get('/checklists', async (req, reply) => {
    req.check(Permissions.Use)
    let checklists: Array<Checklist> = await fastify.db.Checklist.findAll({
      attributes: ['id', 'title', 'items'],
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              {
                type: ChecklistType.all,
              },
              {
                type: ChecklistType.new,
                joinedDate: { [Op.lte]: req.user.createdAt },
              },
              {
                type: ChecklistType.selected,
                userIds: { [Op.contains]: [req.user.id] },
              },
            ],
          },
          {
            visibility: {
              [Op.in]: [EntityVisibility.Visible],
            },
          },
        ],
      },
      order: [['createdAt', 'ASC']],
      include: {
        model: ChecklistAnswer,
        as: 'answers',
        where: { userId: req.user.id },
        attributes: ['id', 'answers'],
        required: false,
      },
    })

    if (!checklists.length) {
      return []
    }

    const getCheckedTotal = (checklist: Checklist) =>
      checklist.answers && checklist.answers[0]
        ? checklist.answers[0]?.answers.filter((a) => !!a.checked).length
        : 0

    // checklists which are not finished
    checklists = checklists.filter(
      (ch: Checklist) => getCheckedTotal(ch) !== ch.items.length
    )

    const totalItems = checklists.reduce(
      (acc: number, ch: Checklist) => acc + ch.items.length,
      0
    )

    const totalChecked = checklists.reduce(
      (acc: number, ch: Checklist) => acc + getCheckedTotal(ch),
      0
    )

    const totalProgress = (totalChecked * 100) / totalItems

    const getCheckedValue = (ch: Checklist, id: string) =>
      ch?.answers
        ? ch.answers[0]?.answers?.find(
            (answer: GeneralChecklistItem) => answer.id === id
          )?.checked
        : false

    const result = checklists.map((ch: Checklist) => ({
      id: ch.id,
      title: ch.title,
      progress: getCheckedTotal(ch),
      items: ch.answers
        ? ch.items.map((item) => ({
            ...item,
            checked: getCheckedValue(ch, item.id),
          }))
        : ch.items,
    }))
    return {
      totalProgress,
      totalChecked,
      totalItems,
      result,
    }
  })

  fastify.put(
    '/checklists/:checklistId/answers',
    async (
      req: FastifyRequest<{
        Body: { answers: GeneralChecklistItem[] }
        Params: { checklistId: string }
      }>,
      reply
    ) => {
      req.check(Permissions.Use)
      if (!req.params.checklistId) {
        return reply.throw.notFound()
      }
      const answer = await fastify.db.ChecklistAnswer.findOne({
        where: {
          checklistId: req.params.checklistId,
          userId: req.user.id,
        },
      })
      if (!answer) {
        const checklist = await fastify.db.Checklist.findByPk(
          req.params.checklistId
        )
        if (!checklist) {
          return reply.throw.notFound()
        }
        await fastify.db.ChecklistAnswer.create({
          userId: req.user.id,
          answers: req.body.answers,
          checklistId: req.params.checklistId,
        })
      } else {
        await answer.update({
          answers: req.body.answers,
        })
      }
      return reply.ok()
    }
  )
}

const adminRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.post(
    '/checklists',
    async (req: FastifyRequest<{ Body: ChecklistCreateFields }>, reply) => {
      req.check(Permissions.AdminManage)

      const data = req.body
      await fastify.db.Checklist.create({
        title: data.title,
        type: data.type,
        userIds: data.userIds,
        items: data.items,
        visibility: data.visibility,
        allowedRoles: data.allowedRoles,
        offices: data.offices,
        joinedDate: data.joinedDate,
      })
      return reply.ok()
    }
  )

  fastify.get(
    '/checklists',
    async (
      req: FastifyRequest<{
        Querystring: { visibility: string; office: string }
      }>,
      reply
    ) => {
      req.check(Permissions.AdminManage)

      const where: Filterable<Checklist>['where'] = {}
      if (req.query.office) {
        where.offices = { [Op.contains]: [req.query.office] }
      }
      if (req.query.visibility) {
        where.visibility = req.query.visibility
      }
      return fastify.db.Checklist.findAll({
        where,
        order: [['createdAt', 'DESC']],
      })
    }
  )

  fastify.get(
    '/checklists/:checklistId',
    async (
      req: FastifyRequest<{
        Params: { checklistId: string }
        Reply: any
      }>,
      reply
    ) => {
      req.check(Permissions.AdminManage)

      const checklist = await fastify.db.Checklist.findByPk(
        req.params?.checklistId
      )
      if (!checklist) {
        return reply.throw.notFound()
      }
      if (checklist.type === ChecklistType.selected) {
        return {
          id: checklist.id,
          title: checklist.title,
          type: checklist.type,
          items: checklist.items,
          visibility: checklist.visibility,
          allowedRoles: checklist.allowedRoles,
          joinedDate: checklist.joinedDate,
          offices: checklist.offices,
          userIds: checklist.userIds,
        }
      }
      return checklist
    }
  )

  fastify.put(
    '/checklists/:checklistId',
    async (
      req: FastifyRequest<{
        Body: ChecklistCreateFields
        Params: { checklistId: string }
      }>,
      reply
    ) => {
      req.check(Permissions.AdminManage)

      const checklist = await fastify.db.Checklist.findByPk(
        req.params?.checklistId
      )
      if (!checklist) {
        return reply.throw.notFound()
      }
      const data = req.body
      await checklist
        .set({
          title: data.title,
          type: data.type,
          userIds: data.type == ChecklistType.selected ? data.userIds : [],
          items: data.items,
          joinedDate: data.type == ChecklistType.new ? data.joinedDate : null,
          allowedRoles: data.allowedRoles,
          visibility: data.visibility,
          offices: data.offices,
        })
        .save()

      const answeredChecklists = await fastify.db.ChecklistAnswer.findAll({
        where: {
          checklistId: req.params?.checklistId,
        },
      })
      if (!!answeredChecklists.length) {
        for (let answer of answeredChecklists) {
          await answer
            .set({
              answers: data.items.map((item) => {
                return {
                  id: item.id,
                  label: item.label,
                  checked: answer.answers.find((i) => i.id === item.id)
                    ?.checked,
                }
              }),
            })
            .save()
        }
      }
      return reply.ok()
    }
  )
}

module.exports = {
  publicRouter,
  userRouter,
  adminRouter,
}
