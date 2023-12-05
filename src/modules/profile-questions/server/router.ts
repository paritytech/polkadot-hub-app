import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { appConfig } from '#server/app-config'
import {
  ProfileQuestion,
  ProfileQuestionCategory,
  ProfileQuestionCategoryMetadata,
} from '../types'
import { Permissions } from '../permissions'
import { Metadata } from '../metadata-schema'

const publicRouter: FastifyPluginCallback = async function (fastify, opts) {}

const userRouter: FastifyPluginCallback = async function (fastify, opts) {
  fastify.get('/metadata', async (req: FastifyRequest, reply) => {
    req.check(Permissions.Use)
    const metadata = appConfig.getModuleMetadata(
      'profile-questions'
    ) as Metadata
    const questions = metadata.questions
    return questions.map((question: ProfileQuestionCategoryMetadata) => {
      return {
        category: question.category,
        questions: question.questions.map((q: string) => ({
          text: q,
          answer: '',
        })),
      }
    })
  })

  fastify.get(
    '/answers',
    async (req: FastifyRequest<{ Querystring: { userId: string } }>, reply) => {
      req.check(Permissions.Use)
      const userId = req.query.userId
      if (!userId) return []

      const answers = await fastify.db.ProfileQuestionAnswer.findOne({
        where: { userId },
      })
      if (!answers) {
        return []
      }

      return answers.answers.filter(
        (category: ProfileQuestionCategory) =>
          !!category.questions.find((q) => !!q.answer)
      )
    }
  )

  fastify.get('/answers/count', async (req: FastifyRequest, reply) => {
    req.check(Permissions.Use)
    const answer = await fastify.db.ProfileQuestionAnswer.findOne({
      where: {
        userId: req.user.id,
      },
    })
    if (!answer) {
      return 0
    }
    const answersCount = answer.answers.reduce(
      (acc: number, curr: ProfileQuestionCategory) => {
        const count: number = curr.questions.reduce(
          (acc: number, curr: ProfileQuestion) => {
            return acc + (!!curr.answer ? 1 : 0)
          },
          0
        )
        return acc + count
      },
      0
    )
    const totalQuestions = answer.answers?.reduce(
      (count: number, category: ProfileQuestionCategory) =>
        count + category.questions.length,
      0
    )
    const progressValue = totalQuestions
      ? Math.floor((answersCount * 100) / totalQuestions)
      : 0

    return {
      answersCount,
      totalQuestions,
      progressValue,
    }
  })

  fastify.get('/questions', async (req: FastifyRequest, reply) => {
    req.check(Permissions.Use)
    const answers = await fastify.db.ProfileQuestionAnswer.findOne({
      where: {
        userId: req.user.id,
      },
    })
    if (answers) {
      return answers.answers
    }

    const metadata = appConfig.getModuleMetadata(
      'profile-questions'
    ) as Metadata
    return metadata.questions.map((x) => {
      return {
        category: x.category,
        questions: x.questions.map((q) => ({
          text: q,
          answer: '', // ?
        })),
      }
    })
  })

  fastify.post(
    '/questions',
    async (
      req: FastifyRequest<{ Body: Array<ProfileQuestionCategory> }>,
      reply
    ) => {
      req.check(Permissions.Use)
      const answers = await fastify.db.ProfileQuestionAnswer.findOne({
        where: {
          userId: req.user.id,
        },
      })

      if (!answers) {
        await fastify.db.ProfileQuestionAnswer.create({
          userId: req.user.id,
          answers: req.body,
        })
      } else {
        await fastify.db.ProfileQuestionAnswer.update(
          {
            answers: req.body,
          },
          { where: { userId: req.user.id } }
        )
      }
      return reply.ok()
    }
  )
}

const adminRouter: FastifyPluginCallback = async function (fastify, opts) {}

module.exports = {
  publicRouter,
  userRouter,
  adminRouter,
}
