import fastifyCookie from '@fastify/cookie'
import fastifyStatic from '@fastify/static'
// import fastifyWebsocket from '@fastify/websocket'
import dayjs from 'dayjs'
import dayjsCustomParseFormat from 'dayjs/plugin/customParseFormat'
import dayjsIsSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import dayjsTimezone from 'dayjs/plugin/timezone'
import dayjsUtc from 'dayjs/plugin/utc'
import Fastify, { FastifyReply } from 'fastify'
import { appConfig } from '#server/app-config'
import config from '#server/config'
import { sequelize } from '#server/db'
import { getFilePath } from '#server/utils'
import { exceptionsReplyDecorator } from '#server/utils/exceptions'
import { log as logger } from '#server/utils/log'
import { errorPageTemplate } from '#server/utils/error-template'
import { moduleRouterPlugin } from '#server/module-router-plugin'
import { authPlugin } from '#server/auth/auth-plugin'
import { SESSION_TOKEN_COOKIE_NAME } from './constants'

dayjs.extend(dayjsCustomParseFormat)
dayjs.extend(dayjsTimezone)
dayjs.extend(dayjsUtc)
dayjs.extend(dayjsIsSameOrAfter)

const fastify = Fastify({ logger })

// Plugins
fastify.register(fastifyCookie)
fastify.register(fastifyStatic, {
  root: [getFilePath('config/public'), getFilePath('public')],
  decorateReply: true,
})
fastify.register(fastifyStatic, {
  root: getFilePath('dist_client/js'),
  prefix: '/js/',
  decorateReply: false,
})
fastify.register(fastifyStatic, {
  root: getFilePath('dist_client/css'),
  prefix: '/css/',
  decorateReply: false,
})
// fastify.register(fastifyWebsocket, {
//   options: {
//     maxPayload: 1048576,
//   },
// })

// fastify.register(async (fastify) => {
//   fastify.get('/ws', { websocket: true }, (conn, req) => {
//     conn.socket.on('message', (message) => {
//       // message.toString()
//       conn.socket.send('hi from server')
//     })
//   })
// })

fastify.decorateReply('throw', exceptionsReplyDecorator)
fastify.decorateReply(
  'setSessionCookie',
  function (token: string, path?: string) {
    return this.setCookie(SESSION_TOKEN_COOKIE_NAME, token, {
      path: path ?? '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    })
  }
)
fastify.decorateReply('ok', function (msg?: string) {
  const reply = this as unknown as FastifyReply
  return reply.status(200).send({ message: msg || undefined })
})

// Database
fastify.addHook('onClose', (fastify, done) => sequelize.close())

// Routes
if (appConfig.error) {
  fastify.get('/', async (req, reply) => {
    return reply.header('Content-Type', 'text/html; charset=utf-8').send(
      errorPageTemplate({
        subtitle: appConfig.error?.message!,
        body: appConfig.error?.payload || undefined,
      })
    )
  })
} else {
  fastify.register(authPlugin(), { prefix: '/auth' })
  fastify.register(moduleRouterPlugin())
  fastify.get('/', function (req, reply) {
    reply.sendFile('app.html')
  })
}

// Handle errors
fastify.setErrorHandler((error, req, reply) => {
  const initialStatusCode = error.statusCode || reply.statusCode
  const statusCode = initialStatusCode >= 400 ? initialStatusCode : 500
  const defaultMessage = 'Internal error'
  let message: string = error.message || defaultMessage
  if (statusCode >= 500) {
    const errorObject = {
      reqId: req.id,
      req: {
        method: req.method,
        url: req.url,
      },
      stack: error.stack || null,
    }
    if (config.env === 'development') {
      fastify.log.error(
        error,
        `${message} @ ${req.id} ${req.method} ${req.url}`
      )
    } else {
      fastify.log.error(errorObject, message)
      message = defaultMessage
    }
  }
  return reply.status(statusCode).send({ statusCode, message })
})

fastify.setNotFoundHandler((req, res) => {
  if (req.headers.accept?.includes('text/html')) {
    if (appConfig.error) {
      res.redirect('/')
    } else {
      res.sendFile('app.html')
    }
    return
  }
  res.code(404).send('Not found')
})

fastify.listen({ port: config.port, host: '0.0.0.0' }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  fastify.log.info(
    `🚀 App launched: http://127.0.0.1:${config.port} ${
      config.debug ? '[DEBUG]' : ''
    }`
  )
})
