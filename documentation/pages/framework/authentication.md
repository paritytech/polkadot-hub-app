# Authentication

Authentication providers are defined in `application.json` under `auth.providers`. The default provider is `polkadot`. You can also turn on `google` auth provider and specify roles according to your domain.

## Polkadot authentication

Users can register with their polkadot addresses.

To activate polkadot authentication you modify `application.json` by adding `polkadot` in the list of auth providers. E.g.

```json
  "auth": {
    "providers": ["google", "polkadot"]
  },
```

Set `AUTH_MESSAGE_TO_SIGN` to a random string. It is used for users to verify that they are the owners of the wallet they are logging in with.

### Wallet Connect

Wallet Connect allows your users to log in using their mobile devices. It is advisable to turn this feature on. In order to activate Wallet Connect integration you have to provide `WALLET_CONNECT_PROJECT_ID` in your `.env` file.

Feel free to modify `AUTH_MESSAGE_TO_SIGN` to be any string you prefer instead of a random default string.

## Google authentication

Users can register using Google SSO. An automatic role can be configured and given based on the email domains users are registering with.

### Activate

Google callback: `http://<your-appHost>/auth/google/callback`

Configure a Google project, and populate `OAUTH2_GOOGLE_CLIENT_ID` and `OAUTH2_GOOGLE_CLIENT_SECRET` with generated values. See [this guide for reference](https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid)

To activate google authentication you modify `application.json` by adding `google` in the list of auth providers. E.g.

```json
  "auth": {
    "providers": ["google", "polkadot"]
  },
```
