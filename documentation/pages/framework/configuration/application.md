# Application.json

This file configures how modules are displayed on the screen.
You can set different module placement for mobile and for desktop. Tablet view will follow the desktop configuration.

### Application configuration sample

```
{
  "name": <Your-app-name>,
  "auth": {
    "providers": ["polkadot"]
  },
  "layout": {
    "mobile": {
      "fixed": [["users", "NewjoinerDetector"]],
      "office": [
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

## Desktop

You can choose between 3 and 2 column layout.

### 3 col layout

<Image src="/layout-3col.png" alt="Layout-3" width={600} height={650} />

In order to configure 3 columns populate "sidebar", "main" and "sidebarRight" with your configuration.

E.g

```
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
        [["users", "UsersMapWidget", { "offices": ["global"] }]]
        [["hub-map", "HubMap"]],
      ],
      "sidebarRight": [
          ["events", "UpcomingEvents"],
          ["news", "LatestNews"]
        ]
    }
```

### 2 col layout

<Image src="/layout-2col.png" alt="Layout-2" width={600} height={650} />

For the 2 column layout populate "sidebar" and "main" only.

E.g

```
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
        [["users", "UsersMapWidget", { "offices": ["global"] }]]
        [["hub-map", "HubMap"]],
        // the folllowing two modules will split the space between them under the HubMap
        [
          ["events", "UpcomingEvents"],
          ["news", "LatestNews"]
        ]
      ]
    }
```

## Mobile

```
"mobile": {
    "fixed": [["users", "NewjoinerDetector"]],
    "office": [
    ["quick-navigation", "QuickNav"],
    ["users", "UsersMapWidget", { "offices": ["global"] }],
    ["about", "AboutWidget", { "offices": ["berlin", "lisbon", "london"] }]
    ],
    "events": [["events", "UpcomingEvents"]],
    "news": [["news", "LatestNews"]]
},
```

`office`, `events`, `news` are the 3 tabs in the mobile view. You can configure what to show for each of them.
