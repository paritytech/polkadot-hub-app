# Email integration

## How to turn on Email integration in a module.

1. Make sure `manifest.ts` file of the module you are working with has `"email-smtp"` added to the array field `allowed_integrations`

2. Adjust `app.config.json`. Find configuration for your module and add `"email-smtp"` to the `"integrations"` array.

3. Add correct `.env` values. If you do not know those, have a look below.

   SMTP_ENDPOINT=""

   SMTP_PORT=

   SMTP_USERNAME=""

   SMTP_PASSWORD=""

   SMTP_FROM_NAME=""

   SMTP_FROM_EMAIL=""

## Notifications

### Events

responsible users - users who are specified in the event settings

| Name                                               | Message key                   | Endpoint                                  | Sent to           | Notes |
| -------------------------------------------------- | ----------------------------- | ----------------------------------------- | ----------------- | ----- |
| Event form submission data change                  | formSubmissionChange          | POST `/event/:eventId/form/:formId/apply` | responsible users |       |
| Application cancelled by user                      | eventApplicationCancelledUser | PUT `/applications/:applicationId`        | responsible users |       |
| User deleted (and their future event applications) | eventApplicationDeleted       | cron event-delete-data                    | responsible users |       |

### Forms

| Name                   | Message key          | Endpoint             | Sent to           | Notes |
| ---------------------- | -------------------- | -------------------- | ----------------- | ----- |
| Form submission change | formSubmissionChange | POST `/form/:formId` | responsible users |       |

### Guest invites

| Name                                                | Message key                | Endpoint                 | Sent to | Notes |
| --------------------------------------------------- | -------------------------- | ------------------------ | ------- | ----- |
| Guest Invitation Created by user                    | newInvitation              | POST `/invite/`          | guest   |       |
| Guest Invitation Status Update - Confirmed by admin | invitationConfirmedByAdmin | POST `/invite/:inviteId` | guest   |       |
| Guest Invitation Status Update - Cancelled by user  | invitationCancelledByUser  | PUT `/:guestInviteId`    | guest   |       |

If you want to create a custom invitation for each of your spaces, just create template messages with keys in the following format `messageKey[OfficeId]`, e.g. newInvitationLondon
