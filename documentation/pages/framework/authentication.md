# Authentication

Authentication providers are defined in `application.json` under `auth.providers`. The default provider is `polkadot`. You can also turn on `google` auth provider and specify roles according to your domain.

## Polkadot authentication

Users are registered with their polkadot addresses.

Users have to have valid NFTs in their wallet in order to access the physical space and certain parts of the app.

### Wallet Connect

Wallet Connect allows your users to log in using their mobile devices. It is advisable to turn this feature on. In order to activate Wallet Connect integration you have to provide `WALLET_CONNECT_PROJECT_ID` in your `.env` file.

Feel free to modify `AUTH_MESSAGE_TO_SIGN` to be any string you prefer instead of a random default string.

## Google authentication

Users can register using Google SSO. An automatic role can be configured and given based on the email domains users are registering with.
