import { FastifyReply } from 'fastify'

export const exceptionsReplyDecorator = {
  getter() {
    const reply = this as unknown as FastifyReply
    return {
      notFound(msg?: string) {
        return reply
          .status(404)
          .send({ statusCode: 404, message: msg || `Not found` })
      },
      badParams(msg?: string) {
        return reply
          .status(400)
          .send({ statusCode: 400, message: msg || `Bad request parameters` })
      },
      rejected(msg?: string) {
        return reply
          .status(400)
          .send({ statusCode: 400, message: msg || `Request rejected` })
      },
      misconfigured(msg?: string) {
        return reply.status(500).send({
          statusCode: 500,
          message: msg || `Something is not configured`,
        })
      },
      authException(msg?: string) {
        return reply
          .status(401)
          .send({ statusCode: 401, message: msg || `Wrong auth token` })
      },
      accessDenied(msg?: string) {
        return reply.status(403).send({
          statusCode: 403,
          message: msg || `You don't have access to this page`,
        })
      },
      conflict(msg?: string) {
        return reply.status(409).send({
          statusCode: 409,
          message: msg || `Conflict in the current state of the resource`,
        })
      },
      gone(msg?: string) {
        return reply.status(410).send({
          statusCode: 410,
          message: msg || `The requested resource is no longer available`,
        })
      },
      internalError(msg?: string) {
        return reply.status(500).send({
          statusCode: 500,
          message: msg || `Internal server error`,
        })
      },
    }
  },
}
