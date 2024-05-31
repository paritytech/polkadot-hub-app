# Guest invites module

This module allows inviting guests to visit the office

## Manifest.json

| key                     | value         |
| ----------------------- | ------------- |
| id                      | guest-invites |
| name                    | Guest Invites |
| dependencies            | users, vists  |
| requiredIntegrations    | email-smtp    |
| recommendedIntegrations | matrix        |

## Guest invite flow

1. User creates a new guest invite by using Actions module and choosing `Invite a Guest`

   <Image
     src="/modules/officeVisitsActions.png"
     alt="office vists actions"
     width="500"
     height="500"
     style="border: 1px solid lightGray; border-radius: 10px; margin-top: 10px"
   />

2. Fill out guest invite form.

   <Image
     src="/modules/guestInviteForm.png"
     alt="guest invite form"
     width="500"
     height="500"
     style="border: 1px solid lightGray; border-radius: 10px; margin-top: 10px"
   />

3. The guest will receive an email with the invitation and a link. The default text template of the email can be changed by overriding the template in the config folder. See [templates](../framework/configuration/templates.md) for more details.

4. Guest clicks the link and fills out a form specifying which date they are intersted in visiting the office/hub.

   <Image
     src="/modules/guestInviteFormGuest.png"
     alt="invite form for guest"
     width="500"
     height="500"
     style="border: 1px solid lightGray; border-radius: 10px; margin-top: 10px"
   />

5. The admin has to approve guest invite and allocate a desk for them.

   <Image
     src="/modules/guestInviteAdmin.png"
     alt="invite form for guest"
     style="border: 1px solid lightGray; border-radius: 10px; margin-top: 10px"
   />

   <Image
     src="/modules/guestInviteAdmin2.png"
     alt="invite form for guest"
     style="border: 1px solid lightGray; border-radius: 10px; margin-top: 10px"
   />

6. After the invitation is confirmed by admin, the guest receives a welcome email which specifies how to get to the office plus information on code of conduct, etc.
