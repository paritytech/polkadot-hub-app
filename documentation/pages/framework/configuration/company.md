# Company.json

```json
{
  "id": "berlin",
  "name": "BerlinHub",
  "city": "Berlin",
  "country": "GE",
  "icon": "🇩🇪",
  "address": "Main street 10",
  "coordinates": [0.34324324, 0.234234234],
  "directions": "Entrance through the courtyard",
  "workingHours": ["09:00", "18:00"],
  "workingDays": "Mon - Fri",
  "timezone": "Europe/Berlin",
  "allowGuestInvitation": true,
  "allowDeskReservation": true,
  "allowRoomReservation": true,
  "areas": [
    {
      "id": "first_floor",
      "name": "First Floor",
      "available": true,
      "bookable": true,
      "map": "/path/to/map.png",
      "meetingRooms": [
        {
          "id": "hibiscus",
          "name": "Hibiscus",
          "description": "1st floor",
          "capacity": 5,
          "equipment": "whiteboard",
          "photo": "/path/to/photo.png",
          "workingHours": ["08:00", "19:00"],
          "autoConfirm": true,
          "position": {
            "x": 0,
            "y": 0
          }
        }
      ],
      "desks": [
        {
          "id": "a",
          "name": "A",
          "type": "flexible",
          "position": {
            "x": 0,
            "y": 0
          }
        }
      ]
    }
  ]
}
```

## Configurable fields

`name` - name of your company

`offices` - Array of your offices/hub configurations

| key                     | value                                                                                 | required                | var type              |
| ----------------------- | ------------------------------------------------------------------------------------- | ----------------------- | --------------------- |
| id                      | unique identifier, once created please do not change                                  | required                | string                |
| name                    | hub name                                                                              | required                | string                |
| city                    |                                                                                       |                         | string                |
| country                 | two letter code, e.g. GE                                                              |                         | string                |
| icon                    | e.g. 🇩🇪                                                                               |                         | string                |
| timezone                | e.g. Europe/London                                                                    | required                | string                |
| address                 | used in modules: About, Guest Invites                                                 | required for the module | string                |
| coordinates             | used in modules: About                                                                | required for the module | [float, float]        |
| directions              | used in modules: About                                                                | required for the module | string                |
| workingHours            | used in modules: About, e.g. ["09:00", "18:00"]                                       | required for the module | [string, string]      |
| workingDays             | used in modules: Guest Invites, About. e.g. "Mon - Fri"                               | required for the module | string                |
| roomsPlaceholderMessage | This message is shown in case you turned off `allowRoomReservation` for the given hub | optional                | string                |
| allowGuestInvitation    |                                                                                       | required                | boolean               |
| allowDeskReservation    |                                                                                       | required                | boolean               |
| allowRoomReservation    |                                                                                       | required                | boolean               |
| areas                   | hub floors                                                                            | required                | Array of JSON objects |

### Areas configuration

`areas`

| key          | value                                                        | required | var type              |
| ------------ | ------------------------------------------------------------ | -------- | --------------------- |
| id           | unique area identifier, once created please do not change    | required | string                |
| name         |                                                              | required | string                |
| available    | you can turn on and off the whole area                       | required | boolean               |
| bookable     | the area can be booked                                       | required | boolean               |
| map          | path to the map image, place in public folder in your config | required | string                |
| meetingRooms | meeting room configuration                                   | required | Array of JSON objects |
| desks        | desks configuration                                          | required | Array of JSON objects |

### Meeting Rooms configuration

`meetingRooms`

| key          | value                                                                                       | required | var type         |
| ------------ | ------------------------------------------------------------------------------------------- | -------- | ---------------- |
| id           | unique area identifier, once created please do not change                                   | required | string           |
| name         |                                                                                             | required | string           |
| description  | e.g. 1st floor                                                                              | required | string           |
| capacity     | room capacity                                                                               | required | number           |
| equipment    | e.g. Whiteboard, stationary, electrical sockets within reachable distance to the table.     | required | string           |
| photo        | path to the meeting room photo, place in public folder in your config                       | required | string           |
| workingHours |                                                                                             |          | [string, string] |
| autoConfirm  | some rooms may require manual approval by administrator                                     |          | boolean          |
| position     | {"x": 1, "y":1} position of the room on the map to display on the big map (module Hub Map ) |          | object           |

### Desks configuration

`desks`

| key      | value                                                                                                                                         | required | var type |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- |
| id       | unique area identifier, once created please do not change                                                                                     | required | string   |
| name     | this is displayed on the map, the shorter the better. e.g: A, B, C                                                                            | required | string   |
| type     | "flexible" - can be booked by anyone, "full_area" - will book the whole area or "multi" - multiple bookings can be made on the same desk/spot | required | string   |
| position | {"x": 1, "y":1} position of the desk on the floor map to display for booking                                                                  |          | object   |
