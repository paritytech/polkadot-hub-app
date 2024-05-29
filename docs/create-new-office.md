# Quick start: How to create a new office?

Open the `app.config.json` file and scroll down to the `offices` section. This section contains a list of all the offices currently configured in the system. To add a new office, add the following JSON structure:

```json
# app.config.json

{
    "offices": [
        {
            "id": "berlin",
            "name": "Berlin Office",
            "city": "Berlin",
            "country": "DE",
            "icon": "🇩🇪", // any symbol or emoji
            "address": "Kottbusser Tor",
            "timezone": "Europe/Berlin",
            "visitsConfig": {
                "workingDays": [0, 1, 2, 3, 4], // Mon-Fri
                "bookableDays": 30, // how many days in advance are allowed to book
                "maxCapacity": 35, // maximum office capacity (including non-working desks)
            },
            "areas": [
                {
                    "id": "floor_1",
                    "name": "1st Floor",
                    "capacity": 10,  // max people on this floor
                    "map": "/maps/1.png",  // link to floor map
                    "type": "desks",
                    "bookable": true, // you can temporarily disable
                    "desks": [
                        {
                            "id": "a",
                            "name": "A",
                            "type": "flexible",  // bookable by anyone
                            "position": {  // marker position on floor map
                                "x": 20, // %percent from top
                                "y": 15  // %percent from left
                            }
                        },
                        {
                            "id": "finance_desk",
                            "name": "Finance",
                            "type": "personal",  // only for specified user
                            "user": "finance@company.com",
                            "position": {
                                "x": 52,
                                "y": 15
                            }
                        },
                        {
                            "id": "drop-in",
                            "name": "Drop-in",
                            "type": "multi",  // multi-desk for unlimited bookings
                            "allowMultipleBookings": true,
                            "position": {
                                "x": 30,
                                "y": 15
                            }
                        }
                    ]
                }
            ],
            "rooms": [
                {
                    "id": "meeting_room_1",
                    "name": "Ambrose",
                    "description": "1st floor",
                    "workingHours": ["08:00", "22:00"],
                    "autoConfirm": true  // if set to false — requires admin confirmation
                }
            ]
        }
    ]
}
```

Put your floor plan images to `public/maps` directory, then you can always refer to them by the relative path like `/maps/my-office.png`.
