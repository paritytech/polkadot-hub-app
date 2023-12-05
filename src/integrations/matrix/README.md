# Matrix integration

Matrix integrations only work when application status is not in `debug`. Set `debug` to `false` in your `.env` file.

## How to turn on Matrix integration in a module.

1. Make sure `manifest.ts` file of the module you are working with has `"matrix"` added to the array field `allowed_integrations`

2. Adjust `app.config.json`. Find configuration for your module and add `"matrix"` to the `""integrations` array.

3. Add correct `.env` values. If you do not know those, have a look below.

   MATRIX_SERVER=""

   MATRIX_ADMIN_ROOM_ID="hq-admin-room-id-on-the-corresponding-server"

   MATRIX_API_TOKEN="bot-token-on-the-corresponding-server"

   MATRIX_BOT_NAME="display-name-of-the-bot-anything-you-like"

   MATRIX_BOT_USERNAME="matrix-username-on-the-corresponding-server"

## How to setup Matrix bot on the staging server

1. Open a new browser profile and go to [https://app.element.io](https://app.element.io)

2. Sign in → change the server to the staging server name (matrix.parity-lab.parity.io) → Sign in with google. You can fill in `MATRIX_SERVER`.

3. Create an empty room (turn off encryption while creating), that will be your admin room -> `MATRIX_ADMIN_ROOM_ID`

4. Get Bot Details from Pavel Baluev - you need a name and sign in credentials.

5. Invite a bot in your room.

6. [Obtain API Token for the Bot](https://t2bot.io/docs/access_tokens)

   6.1 Sign in using incognito browser as the bot. [https://app.element.io](https://app.element.io). Now you can fill in `MATRIX_BOT_USERNAME`

   6.2 Get Bot API token, Click on your user icon in top left -> All settings -> Help and About. Now you can fill in `MATRIX_API_TOKEN`

## Notifications

### Visits

| Name                          | Message key                     | Endpoint               | Sent to   | Notes |
| ----------------------------- | ------------------------------- | ---------------------- | --------- | ----- |
| Office visit booking by user  | officeVisitBooking              | POST `/visit`          | user      |       |
| Office visit booking by user  | officeVisitBookingAdmin         | POST `/visit`          | adminRoom |       |
| Cancel visit booking by user  | visitStatusChange               | PUT `/visits/:visitId` | user      |       |
| Cancel visit booking by user  | visitStatusChange               | PUT `/visits/:visitId` | adminRoom |       |
| Cancel visit booking by admin | visitStatusChangeByAdminForUser | PUT `/visits/:visitId` | user      |       |
| Cancel visit booking by admin | visitStatusChangeByAdminMessage | PUT `/visits/:visitId` | adminRoom |       |
| Visit reminder                | visitReminderCron               | visit-reminder cron    | user      |       |

### Events

responsible users - users who are specified in the event settings

| Name                                | Message key                    | Endpoint                                         | Sent to           | Notes                                          |
| ----------------------------------- | ------------------------------ | ------------------------------------------------ | ----------------- | ---------------------------------------------- |
| Application submission by user      | eventApplicationOpened         | POST `/event/:eventId/form/:formId/apply`        | applicant         | if a Matrix room was created - user is invited |
| Application submission by user      | eventApplicationOpened         | POST `/event/:eventId/apply`                     | applicant         |                                                |
| Application status updated by admin | eventApplication[status]       | PUT `/event/:eventId/application/:applicationId` | applicant         | Confirmed, Rejected, OptedOut                  |
| Application cancelled by user       | eventApplicationCancelledUser  | PUT `/applications/:applicationId`               | applicant         |                                                |
| Application cancelled by user       | eventApplicationUpdateForAdmin | PUT `/applications/:applicationId`               | adminRoom         |                                                |
| Event form submission               | formSubmission                 | POST `/event/:eventId/form/:formId/apply`        | responsible users |                                                |
| Event form submission data change   | formSubmissionChange           | POST `/event/:eventId/form/:formId/apply`        | responsible users |                                                |
| Event checklist not finished        | eventChecklistReminder         | cronjob - event-checklist-reminder               | applicant         |                                                |

### Forms

| Name                      | Message key             | Endpoint             | Sent to           | Notes |
| ------------------------- | ----------------------- | -------------------- | ----------------- | ----- |
| Form submission           | formSubmission          | POST `/form/:formId` | responsible users |       |
| Form submission anonymous | formSubmissionAnonymous | POST `/form/:formId` | responsible users |       |
| Form submission change    | formSubmissionChange    | POST `/form/:formId` | responsible users |       |

### Guest invites

| Name                                | Message key                       | Endpoint                 | Sent to   | Notes |
| ----------------------------------- | --------------------------------- | ------------------------ | --------- | ----- |
| Guest Invitation created by user    | newGuestInviteAdmin               | POST `/invite/`          | adminRoom |       |
| Guest Invitation confirmed by guest | openedGuestInviteAdmin            | POST `/invite/:code`     | adminRoom |       |
| Invitation confirmed by admin       | invitationConfirmedByAdmin        | POST `/invite/:inviteId` | adminRoom |       |
| Invitation cancelled by user        | invitationCancelledByUser         | PUT `/:guestInviteId`    | user      |       |
| Invitation cancelled by user        | invitationCancelledbyUserForAdmin | PUT `/:guestInviteId`    | adminRoom |       |

### Room Reservations

| Name                              | Message key                  | Endpoint                               | Sent to   | Notes |
| --------------------------------- | ---------------------------- | -------------------------------------- | --------- | ----- |
| Reservation Created               | newReservation               | POST `/room-reservations`              | user      |       |
| Reservation Created               | newReservationAdmin          | POST `/room-reservations`              | adminRoom |       |
| Reservation Status change by User | reservationStatusChange      | PUT `/:reservationId`                  | user      |       |
| Reservation Status change by User | reservationStatusChangeAdmin | PUT `/:reservationId`                  | adminRoom |       |
| Reservation Cancelled by Admin    | reservationCancelledForUser  | PUT `/room-reservation/:reservationId` | user      |       |
| Reservation Cancelled by Admin    | reservationStatusChangeAdmin | PUT `/room-reservation/:reservationId` | adminRoom |       |

### Users

| Name                 | Message key | Endpoint             | Sent to   | Notes |
| -------------------- | ----------- | -------------------- | --------- | ----- |
| Role change by admin | roleChanged | PUT `/users/:userId` | adminRoom |       |
