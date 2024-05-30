# Application.json

This file configures how modules are displayed on the screen.
You can set different module placement for mobile and for desktop. Tablet view will follow the desktop configuration.

Authentication providers are also defined here under `auth.providers`. The default provider is `polkadot`. You can also turn on `google` auth provider and specify roles according to your domain.

### Application configuration sample

```json
{
  "name": <Your-app-name>,
  "auth": {
    "providers": ["polkadot"]
  },
  "layout": {
    "mobile": {
      "fixed": [
        ["users", "NewjoinerDetector"],
        ["users", "UserStatus"]
        ],
      "office": [
        ["events", "UncompletedActions"],
        ["events", "MyEvents"],
        ["quick-navigation", "QuickNav"],
        ["users", "UsersMapWidget", { "offices": ["global"] }],
        ["about", "AboutWidget", { "offices": ["berlin", "lisbon", "london"] }]
      ],
      "events": [["events", "UpcomingEvents"]],
      "news": [["news", "LatestNews"]]
    },
    "desktop": {
      "sidebar": [
        ["quick-navigation", "QuickNav"],
        ["about", "AboutWidget", { "offices": ["berlin", "lisbon", "london"] }]
      ],
      "main": [
        [
          [
            "office-visits",
            "Actions",
            { "offices": ["berlin", "lisbon", "london"] }
          ]
        ],
        [["announcements", "Announcement"]],
        [["users", "UsersMapWidget", { "offices": ["global"] }]],
        [
          ["events", "UpcomingEvents"],
          ["news", "LatestNews"]
        ]
      ]
    }
  }
}

```

## Mobile

```json
  "mobile": {
    "fixed": [
      ["users", "NewjoinerDetector"],
      ["users", "UserStatus"]
      ],
    "office": [
      ["events", "UncompletedActions"],
      ["events", "MyEvents"],
      ["quick-navigation", "QuickNav"],
      ["users", "UsersMapWidget", { "offices": ["global"] }],
      ["about", "AboutWidget", { "offices": ["berlin", "lisbon", "london"] }]
    ],
    "events": [["events", "UpcomingEvents"]],
    "news": [["news", "LatestNews"]]
  },
```

`fixed` - items above the call to action widget (Visit office, Book a Room, Invite a Guest)

`office`, `events`, `news` tabs are configurable.

<div style="display: flex; column-gap: 10px; align-items: flex-end">
<Image
  src="/mobileOffice.png"
  alt="mobile office"
  width="250"
  height="200"
  style="border: 1px solid lightGray; border-radius: 10px; margin-top: 10px"
/>

<Image
  src="/mobileEvents.png"
  alt="mobile events"
  width="250"
  height="200"
  style="border: 1px solid lightGray; border-radius: 10px; margin-top: 10px"
/>

<Image
  src="/mobileNews.png"
  alt="mobile news"
  width="250"
  height="200"
  style="border: 1px solid lightGray; border-radius: 10px; margin-top: 10px"
/>

</div>

## Desktop

```json
    "desktop": {
      "sidebar": [
        ["quick-navigation", "QuickNav"],
        ["about", "AboutWidget", { "offices": ["berlin", "lisbon", "london"] }]
      ],
      "main": [
        [
          [
            "office-visits",
            "Actions",
            { "offices": ["berlin", "lisbon", "london"] }
          ]
        ],
        [["announcements", "Announcement"]],
        [["users", "UsersMapWidget", { "offices": ["global"] }]],
        [
          ["events", "UpcomingEvents"],
          ["news", "LatestNews"]
        ]
      ],
      "sidebarRight": [
        ["events", "MyEvents"],
        ["events", "UpcomingEvents"],
        ["news", "LatestNews"]
      ]
    }

```

<Image
  src="/desktopLayout.png"
  alt="desktop layout"
  style="border: 1px solid lightGray; border-radius: 10px; margin-top: 10px"
/>
You can choose between 3 and 2 column layout.

### 3 col layout

In order to configure 3 columns populate `sidebar`, `main` and `sidebarRight` with your configuration.

<Image src="/layout-3col.png" alt="Layout-3" width={600} height={650} />

### 2 col layout

For the 2 column layout populate `sidebar` and `main` only.
<Image src="/layout-2col.png" alt="Layout-2" width={600} height={650} />

### Widget configuration

```
["users", "UsersMapWidget", { "offices": ["global"] }],
```

This configuration only shows widget `UsersMapWidget` from the `users` module in the office with id `global`

```
["news", "LatestNews"]
```

Widget `LatestNews` from module `news` is displayed in all hubs.

```
["about", "AboutWidget", { "offices": ["berlin", "lisbon", "london"] }]
```

Widget `AboutWidget` from module `about` is displayed in `berlin`, `lisbon` and `london` hubs.
