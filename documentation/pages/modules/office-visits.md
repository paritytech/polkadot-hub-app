# Office visits

Module which combines functionality of visits, room-reservation and guest-invites modules together.

## Manifest.json

| key                     | value                                        |
| ----------------------- | -------------------------------------------- |
| id                      | office-visits                                |
| name                    | Office Visits                                |
| dependencies            | vists, guest-invites, room-reseration, users |
| requiredIntegrations    | []                                           |
| recommendedIntegrations | []                                           |

## Available Widgets

### Actions

To enable - add the following to the [application.json](../framework/configuration/application.md) configuration.

```json
[
    "office-visits",
    "Actions",
    { "offices": ["sampleOfficeId-1", "sampleOfficeId-2"] }
],
```

<Image
  src="/modules/officeVisitsActions.png"
  alt="office vists actions"
  width="500"
  height="500"
  style="border: 1px solid lightGray; border-radius: 10px; margin-top: 10px"
/>

### MyOfficeVisits

To enable - add the following to the [application.json](../framework/configuration/application.md) configuration.

```json
[
    "office-visits",
    "MyOfficeVisits",
    { "offices": ["sampleOfficeId-1", "sampleOfficeId-2"] }
],
```

Widget shows user's future desk bookings, meeting room bookings, approved guest invites. User can cancel and edit the records directly from the widget. Clicking on each record will open its detail, which will show the map with the chosen booking marked in pink.

<Image
  src="/modules/officeVisits.png"
  alt="office vists"
  width="500"
  height="500"
  style="border: 1px solid lightGray; border-radius: 10px; margin-top: 10px"
/>
