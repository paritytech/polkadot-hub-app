# stub-idp — local OIDC identity provider for development

A minimal OpenID Connect provider that mimics `sso.dotsamalabs.com` for
local testing. It speaks real OIDC (authorization code flow, EdDSA-signed
ID tokens, discovery document, JWKS) but skips the human authentication
step — `/authorize` immediately redirects back with a code.

## Prerequisites

`jose` must be installed in the project (`npm i jose` or `yarn add jose`).
It is not yet in `package.json`.

## Run

```bash
node stub-idp.mjs
```

Starts on `http://127.0.0.1:4000` by default. No build step.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `STUB_PORT` | `4000` | Listen port |
| `STUB_ISSUER` | `http://127.0.0.1:4000` | `iss` in discovery and tokens |
| `STUB_CLIENT_ID` | `hq-local` | Expected `client_id` from the RP |
| `STUB_CLIENT_SECRET` | `stub-secret` | Expected `client_secret` |
| `STUB_REDIRECT_URIS` | `http://127.0.0.1:3000/auth/oidc/callback` | Comma-separated allowlist |
| `STUB_SUB` | `stub-sub-0000000001` | Fixed `sub` claim (stable across restarts) |
| `STUB_USERNAME` | `alexa.stub` | `preferred_username` claim |
| `STUB_RANDOM_SUB` | `0` | Set to `1` to generate a random `sub` per authorization (tests unenrolled-identity rejection) |

## Failure modes

Each is an env var set to `1` to activate. All off by default.

| Variable | Effect |
|---|---|
| `STUB_FAIL_WRONG_KEY` | Signs the ID token with a different Ed25519 key than the one in the JWKS. RP should fail signature verification. |
| `STUB_FAIL_WRONG_ISS` | Sets `iss` to `https://evil.example.com`. RP should reject issuer mismatch. |
| `STUB_FAIL_WRONG_AUD` | Sets `aud` to `wrong-audience`. RP should reject audience mismatch. |
| `STUB_FAIL_EXPIRED` | Sets `exp` to `0s` (already expired at issuance). RP should reject expired token. |
| `STUB_FAIL_WRONG_NONCE` | Replaces the real nonce with a random value. RP should reject nonce mismatch. |
| `STUB_FAIL_OMIT_SUB` | Omits the `sub` claim entirely. RP should reject malformed token. |

## Verify standalone (curl)

```bash
# 1. Fetch discovery
curl -s http://127.0.0.1:4000/.well-known/openid-configuration | jq .

# 2. Fetch JWKS
curl -s http://127.0.0.1:4000/.well-known/jwks.json | jq .

# 3. Hit /authorize — follow the redirect to capture code and state
curl -sv 'http://127.0.0.1:4000/authorize?client_id=hq-local&redirect_uri=http://127.0.0.1:3000/auth/oidc/callback&response_type=code&scope=openid+profile&state=test123&nonce=nonce456' 2>&1 | grep -i location
# → Location: http://127.0.0.1:3000/auth/oidc/callback?code=<CODE>&state=test123

# 4. Exchange the code (replace <CODE> with the value from step 3)
curl -s -X POST http://127.0.0.1:4000/token \
  -d 'grant_type=authorization_code&code=<CODE>&client_id=hq-local&client_secret=stub-secret&redirect_uri=http://127.0.0.1:3000/auth/oidc/callback' \
  | jq .
```

The token response contains `id_token` (a JWT you can decode at
jwt.io or with `jose` to verify the claims).
