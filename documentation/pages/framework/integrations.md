# Integrations

## Matrix

Matrix notifications are supported. In order to send the notifications one has to make sure users are providing matrix handles in their profiles.

See the [List of all notification types](https://github.com/paritytech/polkadot-hub-app/blob/3589ba1e06265d93597d37e01ad74d508bd63816/src/integrations/matrix/README.md#notifications) for more information.

The profile fields can be configured in metadata section of the "users" module in modules.json. See [users module](/modules/users) for more information.

### Mapbox

Support for maps. Activates if `MAPBOX_API_KEY` is set in your `.env` file.

`Mapbox` is used in a few places:

- All users map at `/map`.
- Map of the hub location on the about page `/about/<hubId>`
- User location on their profile if they specify that they want to share. `/profile/<userId>`

### Email-smtp

Set the following variables in your `.env` file.

```
   SMTP_ENDPOINT=""

   SMTP_PORT=""

   SMTP_USERNAME=""

   SMTP_PASSWORD=""

   SMTP_FROM_NAME=""

   SMTP_FROM_EMAIL=""
```
