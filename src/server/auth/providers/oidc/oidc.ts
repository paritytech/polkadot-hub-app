import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { JWTPayload } from 'jose'
import config from '#server/config'

// --- Types -------------------------------------------------------------------

type OidcDiscovery = {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  jwks_uri: string
}

export type OidcTokenResponse = {
  id_token: string
  access_token?: string
  token_type?: string
  expires_in?: number
}

export type OidcClaims = {
  iss: string
  sub: string
  aud: string
  nonce: string
  preferred_username?: string
}

// --- Discovery cache (lazy, retry on failure) --------------------------------

let cachedDiscovery: OidcDiscovery | null = null
let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null

export async function getDiscovery(): Promise<OidcDiscovery> {
  if (cachedDiscovery) return cachedDiscovery

  const url = `${config.oidcIssuer.replace(/\/+$/, '')}/.well-known/openid-configuration`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`OIDC discovery failed: ${res.status} ${res.statusText}`)
  }

  const doc = (await res.json()) as OidcDiscovery

  if (doc.issuer !== config.oidcIssuer) {
    throw new Error(
      `OIDC discovery issuer mismatch: expected ${config.oidcIssuer}, got ${doc.issuer}`
    )
  }

  cachedDiscovery = doc
  cachedJwks = createRemoteJWKSet(new URL(doc.jwks_uri))
  return doc
}

// --- Authorization URL -------------------------------------------------------

export async function buildAuthorizationUrl(
  state: string,
  nonce: string,
  redirectUri: string
): Promise<string> {
  const disco = await getDiscovery()
  const params = new URLSearchParams({
    client_id: config.oidcClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile',
    state,
    nonce,
  })
  return `${disco.authorization_endpoint}?${params.toString()}`
}

// --- Token exchange ----------------------------------------------------------

export async function exchangeCode(
  code: string,
  redirectUri: string
): Promise<OidcTokenResponse> {
  const disco = await getDiscovery()
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: config.oidcClientId,
    client_secret: config.oidcClientSecret,
    redirect_uri: redirectUri,
  })

  const res = await fetch(disco.token_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OIDC token exchange failed: ${res.status} ${text}`)
  }

  return (await res.json()) as OidcTokenResponse
}

// --- ID token verification ---------------------------------------------------

export async function verifyIdToken(
  idToken: string,
  expectedNonce: string
): Promise<OidcClaims> {
  if (!cachedJwks) {
    const disco = await getDiscovery()
    cachedJwks = createRemoteJWKSet(new URL(disco.jwks_uri))
  }

  const { payload } = await jwtVerify(idToken, cachedJwks, {
    issuer: config.oidcIssuer,
    audience: config.oidcClientId,
  })

  // jose does not verify nonce — manual check is required
  const nonce = payload.nonce as string | undefined
  if (nonce !== expectedNonce) {
    throw new Error('OIDC nonce mismatch')
  }

  if (!payload.sub) {
    throw new Error('OIDC ID token missing sub claim')
  }

  return {
    iss: payload.iss!,
    sub: payload.sub,
    aud: typeof payload.aud === 'string' ? payload.aud : payload.aud![0],
    nonce: nonce!,
    preferred_username: payload.preferred_username as string | undefined,
  }
}
