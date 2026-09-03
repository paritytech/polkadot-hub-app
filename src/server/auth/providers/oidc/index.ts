import { randomBytes } from 'node:crypto'
import {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyRequest,
  FastifyReply,
} from 'fastify'
import config from '#server/config'
import { jwt } from '#server/utils'
import { SESSION_TOKEN_COOKIE_NAME } from '#server/constants'
import { AuthProvider } from '#shared/types'
import type { AuthAddressPair } from '#shared/types'
import { getSession, getUserByOidcIdentity } from '../helper'
import {
  buildAuthorizationUrl,
  exchangeCode,
  verifyIdToken,
  OidcClaims,
} from './oidc'

const OIDC_STATE_COOKIE = 'oidc_state'

export const plugin: FastifyPluginCallback = async (
  fastify: FastifyInstance
) => {
  const redirectUri = `${config.appHost}/auth/oidc/callback`

  // --- Start login flow ------------------------------------------------------
  fastify.get('/login', async (_req, reply) => {
    const { cookieJwt, state, nonce } = await createStateCookie('login')
    reply.setCookie(OIDC_STATE_COOKIE, cookieJwt, stateCookieOpts())
    try {
      const url = await buildAuthorizationUrl(state, nonce, redirectUri)
      return reply.redirect(url)
    } catch (err: any) {
      fastify.log.error(`OIDC login redirect failed: ${err.message}`)
      return reply.redirect('/?error=oidc_unavailable')
    }
  })

  // --- Start enrol flow (requires existing session) --------------------------
  fastify.get('/enrol', async (req, reply) => {
    const user = await resolveSessionUser(req, fastify)
    if (!user) {
      return reply.redirect('/?error=unauthenticated')
    }
    const { cookieJwt, state, nonce } = await createStateCookie('enrol')
    reply.setCookie(OIDC_STATE_COOKIE, cookieJwt, stateCookieOpts())
    try {
      const url = await buildAuthorizationUrl(state, nonce, redirectUri)
      return reply.redirect(url)
    } catch (err: any) {
      fastify.log.error(`OIDC enrol redirect failed: ${err.message}`)
      return reply.redirect('/?error=oidc_unavailable')
    }
  })

  // --- Callback (handles both login and enrol) -------------------------------
  fastify.get(
    '/callback',
    async (
      req: FastifyRequest<{
        Querystring: { code?: string; state?: string; error?: string }
      }>,
      reply
    ) => {
      // Always clear the state cookie
      reply.clearCookie(OIDC_STATE_COOKIE, { path: '/auth/oidc' })

      // IDP-side error
      if (req.query.error) {
        fastify.log.error(`OIDC IDP error: ${req.query.error}`)
        return reply.redirect('/?error=oidc_idp_error')
      }

      // Recover and verify state cookie
      const stateCookie = req.cookies[OIDC_STATE_COOKIE]
      if (!stateCookie) {
        return reply.redirect('/?error=oidc_state_missing')
      }
      const statePayload = await verifyStateCookie(stateCookie)
      if (!statePayload) {
        return reply.redirect('/?error=oidc_state_invalid')
      }
      if (req.query.state !== statePayload.state) {
        return reply.redirect('/?error=oidc_state_mismatch')
      }

      // Exchange code and verify ID token
      const code = req.query.code
      if (!code) {
        return reply.redirect('/?error=oidc_code_missing')
      }
      let claims: OidcClaims
      try {
        const tokens = await exchangeCode(code, redirectUri)
        claims = await verifyIdToken(tokens.id_token, statePayload.nonce)
      } catch (err: any) {
        fastify.log.error(`OIDC token verification failed: ${err.message}`)
        return reply.redirect('/?error=oidc_verification_failed')
      }

      // Dispatch by intent
      if (statePayload.intent === 'enrol') {
        return handleEnrol(req, reply, claims, fastify)
      }
      return handleLogin(reply, claims, fastify)
    }
  )
}

// --- Login: look up user by (iss, sub) and create session --------------------

async function handleLogin(
  reply: FastifyReply,
  claims: OidcClaims,
  fastify: FastifyInstance
) {
  const user = await getUserByOidcIdentity(claims.iss, claims.sub)
  if (!user) {
    fastify.log.info(
      `OIDC login rejected: unknown identity iss=${claims.iss} sub=${claims.sub}`
    )
    return reply.redirect('/?error=oidc_unknown_identity')
  }
  const session = await getSession(user.id, fastify, {
    expiresInHours: config.oidcSessionLifetimeHours || undefined,
  })
  return reply.setSessionCookie(session.token).redirect('/')
}

// --- Enrol: link (iss, sub) to the currently authenticated user --------------

async function handleEnrol(
  req: FastifyRequest,
  reply: FastifyReply,
  claims: OidcClaims,
  fastify: FastifyInstance
) {
  const user = await resolveSessionUser(req, fastify)
  if (!user) {
    return reply.redirect('/?error=unauthenticated')
  }

  // Prevent linking an identity that already belongs to a different user
  const existing = await getUserByOidcIdentity(claims.iss, claims.sub)
  if (existing && existing.id !== user.id) {
    fastify.log.warn(
      `OIDC enrol conflict: iss=${claims.iss} sub=${claims.sub} already linked to user ${existing.id}`
    )
    return reply.redirect('/?error=oidc_identity_taken')
  }
  if (existing && existing.id === user.id) {
    // Already linked, nothing to do
    return reply.redirect('/')
  }

  const authId: AuthAddressPair = {
    name: claims.preferred_username ?? '',
    address: claims.sub,
  }
  await user.addAuthId(AuthProvider.Oidc, claims.iss, authId).save()

  fastify.log.info(
    `OIDC identity linked: user=${user.id} iss=${claims.iss} sub=${claims.sub}`
  )
  return reply.redirect('/?oidc_enrol=ok')
}

// --- Helpers -----------------------------------------------------------------

type StatePayload = {
  state: string
  nonce: string
  intent: 'login' | 'enrol'
}

async function createStateCookie(intent: 'login' | 'enrol') {
  const state = randomBytes(16).toString('hex')
  const nonce = randomBytes(16).toString('hex')
  const result = await jwt.sign({ state, nonce, intent }, 300)
  if (!result.success) {
    throw new Error('Failed to sign OIDC state cookie')
  }
  return { cookieJwt: result.data, state, nonce }
}

async function verifyStateCookie(
  token: string
): Promise<StatePayload | null> {
  const result = await jwt.verify(token)
  if (!result.success) return null
  const data = result.data as Record<string, unknown>
  if (!data.state || !data.nonce || !data.intent) return null
  return {
    state: data.state as string,
    nonce: data.nonce as string,
    intent: data.intent as 'login' | 'enrol',
  }
}

async function resolveSessionUser(
  req: FastifyRequest,
  fastify: FastifyInstance
) {
  const token = req.cookies[SESSION_TOKEN_COOKIE_NAME]
  if (!token) return null
  const verifyReq = await jwt.verify(token)
  if (!verifyReq.success) return null
  const userId = (verifyReq.data as Record<string, unknown>).id as string
  if (!userId) return null
  const session = await fastify.db.Session.findOne({
    where: { token, userId },
  })
  if (!session) return null
  return fastify.db.User.findOneActive({ where: { id: session.userId } })
}

function stateCookieOpts() {
  return {
    path: '/auth/oidc',
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'lax' as const,
    maxAge: 300,
  }
}
