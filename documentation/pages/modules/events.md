# Events module

Special pages for events, with different visibility options (invites only, office-wide, public), and the ability to attach a check-in form asking attendees for necessary information, such as food preferences or flight times.

## Manifest.json

| key                     | value              |
| ----------------------- | ------------------ |
| id                      | events             |
| name                    | Events             |
| dependencies            | users, forms       |
| requiredIntegrations    | []                 |
| recommendedIntegrations | email-smtp, matrix |

## Available Widgets

### My Events

To enable - add the following to the [application.json](../framework/configuration/application.md) configuration.

```json
["events", "MyEvents"]
```

`My Events` widget shows the events that the user has submitted an application for. It will show with green background if the even application was confirmed and with yellow background if the application is pending.

<Image
  src="/modules/eventsUser.png"
  alt="my events"
  width="500"
  height="500"
  style="border: 1px solid lightGray; border-radius: 10px; margin-top: 10px"
/>

### Upcoming Events

To enable - add the following to the [application.json](../framework/configuration/application.md) configuration.

```json
["events", "UpcomingEvents"]
```

`Upcoming Events` widget shows the events that are scheduled in the future. Admin can specify which offices/hubs to show events for. Different offices/hubs can have different events. Users can apply for events using this widget.

<Image
  src="/modules/eventsUpcoming.png"
  alt="upcoming events"
  width="500"
  height="500"
  style="border: 1px solid lightGray; border-radius: 10px; margin-top: 10px"
/>

### Uncompleted Actions

To enable - add the following to the [application.json](../framework/configuration/application.md) configuration.

```json
["events", "UncompletedActions"]
```

Some events have checklists in them that the applicant has to attend to. `Uncompleted Actions` widget reminds the user of those uncompleted checklists for events that they have applied for.

<Image
  src="/modules/eventsUncompletedActions.png"
  alt="uncompleted actions"
  width="500"
  style="border: 1px solid lightGray; border-radius: 10px; margin-top: 10px"
/>

<Image
  src="/modules/eventsEventSample.png"
  alt="uncompleted actions"
  width="500"
  style="border: 1px solid lightGray; border-radius: 10px; margin-top: 10px"
/>
