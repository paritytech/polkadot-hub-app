import { createServer } from 'node:http'
import { randomBytes } from 'node:crypto'
import { generateKeyPair, exportJWK, SignJWT } from 'jose'

// --- Configuration (override with env vars) -----------------------------------
const PORT     = +(process.env.STUB_PORT || 4000)
const ISSUER   = process.env.STUB_ISSUER         || `http://127.0.0.1:${PORT}`
const CID      = process.env.STUB_CLIENT_ID      || 'hq-local'
const CSECRET  = process.env.STUB_CLIENT_SECRET  || 'stub-secret'
const REDIRECTS = (process.env.STUB_REDIRECT_URIS || 'http://127.0.0.1:3000/auth/oidc/callback').split(',')
const SUB      = process.env.STUB_SUB            || 'stub-sub-0000000001'
const UNAME    = process.env.STUB_USERNAME       || 'alexa.stub'
const RAND_SUB = process.env.STUB_RANDOM_SUB     === '1'
// Deliberate failure modes (all off by default)
const FAIL = {
  wrongKey:   process.env.STUB_FAIL_WRONG_KEY   === '1',
  wrongIss:   process.env.STUB_FAIL_WRONG_ISS   === '1',
  wrongAud:   process.env.STUB_FAIL_WRONG_AUD   === '1',
  expired:    process.env.STUB_FAIL_EXPIRED      === '1',
  wrongNonce: process.env.STUB_FAIL_WRONG_NONCE === '1',
  omitSub:    process.env.STUB_FAIL_OMIT_SUB    === '1',
}

// --- Key material -------------------------------------------------------------
const KID = 'stub-key-1'
const { publicKey, privateKey } = await generateKeyPair('EdDSA')
const pubJwk = { ...(await exportJWK(publicKey)), kid: KID, use: 'sig', alg: 'EdDSA' }
const { privateKey: wrongKey } = await generateKeyPair('EdDSA') // for FAIL.wrongKey

// Authorization code store: code -> { nonce, redirect_uri, client_id, scope, sub, created }.
// Codes are single-use and expire after 60 s.
const codes = new Map()

const disco = JSON.stringify({
  issuer: ISSUER, authorization_endpoint: `${ISSUER}/authorize`,
  token_endpoint: `${ISSUER}/token`, userinfo_endpoint: `${ISSUER}/userinfo`,
  jwks_uri: `${ISSUER}/.well-known/jwks.json`,
  grant_types_supported: ['authorization_code'], response_types_supported: ['code'],
  id_token_signing_alg_values_supported: ['EdDSA'],
  scopes_supported: ['openid', 'profile', 'email', 'groups'],
  subject_types_supported: ['public'],
  token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
})

const json = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)) }
const oerr = (res, s, error, desc) => json(res, s, { error, error_description: desc })
const body = (req) => new Promise(r => { let d = ''; req.on('data', c => { d += c }); req.on('end', () => r(d)) })
const log = (m, p, o) => console.log(`${new Date().toISOString()}  ${m} ${p}  → ${o}`)

const server = createServer(async (req, res) => {
  const url = new URL(req.url, ISSUER)
  const { pathname: path } = url

  if (req.method === 'GET' && path === '/.well-known/openid-configuration') {
    log('GET', path, '200 discovery')
    res.writeHead(200, { 'content-type': 'application/json' }); return res.end(disco)
  }
  if (req.method === 'GET' && path === '/.well-known/jwks.json') {
    log('GET', path, '200 jwks')
    return json(res, 200, { keys: [pubJwk] })
  }

  // --- Authorize: capture the RP's nonce and carry it through to the ID token via the code store ---
  if (req.method === 'GET' && path === '/authorize') {
    const p = url.searchParams
    const [clientId, redirectUri, state, nonce, scope] =
      ['client_id', 'redirect_uri', 'state', 'nonce', 'scope'].map(k => p.get(k))
    if (clientId !== CID)
      return (log('GET', path, `400 bad client_id`), oerr(res, 400, 'invalid_request', `unknown client_id: ${clientId}`))
    if (!REDIRECTS.includes(redirectUri))
      return (log('GET', path, `400 bad redirect_uri`), oerr(res, 400, 'invalid_request', `redirect_uri not allowed: ${redirectUri}`))

    const code = randomBytes(16).toString('hex')
    const sub  = RAND_SUB ? `random-${randomBytes(8).toString('hex')}` : SUB
    codes.set(code, { nonce, redirect_uri: redirectUri, client_id: clientId, scope: scope || 'openid', sub, created: Date.now() })
    log('GET', path, `302 → code ${code.slice(0, 8)}…`)
    res.writeHead(302, { location: `${redirectUri}?code=${code}&state=${encodeURIComponent(state)}` })
    return res.end()
  }

  // --- Token: redeem code, build and sign the ID token ---
  if (req.method === 'POST' && path === '/token') {
    const params = new URLSearchParams(await body(req))
    // Authenticate client: support client_secret_post and client_secret_basic
    let cid = params.get('client_id'), cs = params.get('client_secret')
    const ah = req.headers['authorization'] || ''
    if (ah.startsWith('Basic ')) { const [h, s] = Buffer.from(ah.slice(6), 'base64').toString().split(':'); cid = cid || h; cs = cs || s }
    if (cid !== CID || cs !== CSECRET)
      return (log('POST', path, '401 invalid_client'), oerr(res, 401, 'invalid_client', 'bad credentials'))
    if (params.get('grant_type') !== 'authorization_code')
      return (log('POST', path, '400 bad grant_type'), oerr(res, 400, 'invalid_request', 'only authorization_code supported'))

    const code = params.get('code')
    const stored = codes.get(code)
    if (!stored)
      return (log('POST', path, '400 invalid_grant'), oerr(res, 400, 'invalid_grant', 'code unknown or already used'))
    // Codes are single-use: delete on redemption
    codes.delete(code)
    if (Date.now() - stored.created > 60_000)
      return (log('POST', path, '400 code expired'), oerr(res, 400, 'invalid_grant', 'code expired'))
    if (params.get('redirect_uri') !== stored.redirect_uri)
      return (log('POST', path, '400 redirect_uri mismatch'), oerr(res, 400, 'invalid_grant', 'redirect_uri mismatch'))

    // Build claims — each failure mode is a single conditional here
    const claims = { preferred_username: UNAME }
    if (!FAIL.omitSub)    claims.sub   = stored.sub
    // The nonce from /authorize flows through the code store into the token.
    // This is the value the RP checks against its cookie — never hardcode or skip it.
    claims.nonce = FAIL.wrongNonce ? `wrong-${randomBytes(4).toString('hex')}` : stored.nonce
    if (stored.scope.includes('email')) { claims.email = `${UNAME}@stub.local`; claims.email_verified = true }

    const idToken = await new SignJWT(claims)
      .setProtectedHeader({ alg: 'EdDSA', kid: KID })
      .setIssuedAt()
      .setIssuer(FAIL.wrongIss ? 'https://evil.example.com' : ISSUER)
      .setAudience(FAIL.wrongAud ? 'wrong-audience' : stored.client_id)
      .setExpirationTime(FAIL.expired ? '0s' : '5m')
      .sign(FAIL.wrongKey ? wrongKey : privateKey)

    log('POST', path, `200 issued (sub=${claims.sub ?? '<omitted>'})`)
    console.log('  claims:', JSON.stringify(claims))
    return json(res, 200, { id_token: idToken, access_token: randomBytes(24).toString('hex'), token_type: 'Bearer', expires_in: 300 })
  }

  // --- Userinfo (not used by RP, but discovery advertises it) ---
  if (req.method === 'GET' && path === '/userinfo') {
    log('GET', path, '200'); return json(res, 200, { sub: SUB, preferred_username: UNAME })
  }

  log(req.method, path, '404'); res.writeHead(404); res.end('not found')
})

server.listen(PORT, '127.0.0.1', () => {
  const active = Object.entries(FAIL).filter(([,v]) => v).map(([k]) => k).join(', ') || 'none'
  console.log(`\nstub-idp listening on ${ISSUER}`)
  console.log(`  discovery:  ${ISSUER}/.well-known/openid-configuration`)
  console.log(`  client:     ${CID} / ${CSECRET}`)
  console.log(`  sub:        ${RAND_SUB ? '<random per request>' : SUB}`)
  console.log(`  username:   ${UNAME}`)
  console.log(`  redirects:  ${REDIRECTS.join(', ')}`)
  console.log(`  failures:   ${active}\n`)
})
