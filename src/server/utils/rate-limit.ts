import { FastifyInstance, FastifyPluginCallback } from 'fastify'
import fastifyRateLimit, { RateLimitPluginOptions } from '@fastify/rate-limit'

const DEFAULT_OPTIONS: RateLimitPluginOptions = {
  max: 1,
  timeWindow: 30e3,
  hook: 'preHandler',
  cache: 10e3,
  addHeadersOnExceeding: {
    'x-ratelimit-limit': false,
    'x-ratelimit-remaining': false,
    'x-ratelimit-reset': false,
  },
  addHeaders: {
    'x-ratelimit-limit': false,
    'x-ratelimit-remaining': false,
    'x-ratelimit-reset': false,
    'retry-after': false,
  },
  errorResponseBuilder: (_, context) => ({
    statusCode: 429,
    message: `Too many requests. Try after ${context.after}.`,
  }),
}

export async function useRateLimit(
  fastify: FastifyInstance,
  cb: FastifyPluginCallback,
  opts: Partial<RateLimitPluginOptions> = {}
) {
  await fastify.register(fastifyRateLimit, {
    ...DEFAULT_OPTIONS,
    ...opts,
  })
  return cb(fastify, {}, () => {})
}
