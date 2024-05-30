# Users module

This is the core module of the framework. It has to be enabled for everything else to work as everything depends on it.

To enable make sure `enabled: true` is set under `users` module in [modules.json](../framework/configuration/modules.md)

Functionality:

- Everything about user profile

- Map of all users widget and page

- User onboarding

## Available Widgets

### Onboarding for new joiners

If new joiner is detected then the onboarding is shown. If you want new joiner detection to be enabled add `["users", "NewjoinerDetector"]` in the [application.json](../framework/configuration/application.md) configuration.

There are 3 steps in the onboarding. You can configure all the fields that shown in the onboarding. Removing certain fields will remove steps too.

<Image
  src="/modules/usersOnboarding1.png"
  alt="Onboarding page 1"
  width={700}
  height={800}
/>

<Image
  src="/modules/usersOnboarding2.png"
  alt="Onboarding page 2"
  width={700}
  height={800}
/>

<Image
  src="/modules/usersOnboarding3.png"
  alt="Onboarding page 3"
  width={700}
  height={800}
/>

#### Configuring profile/onboarding fields

Configure which contact fields to show for users to fill out in their profiles and during onboarding.

You can configure which contact fields are required for your instance by setting `required` to true or false.

You can change the displayed field names for them by modifying `fieldName` values.

If you do not want to use a certain field, you can remove its configuration entirely and it wont be shown.

e.g

```json
"metadata": {
    "profileFields": {
        "birthday": {
            "label": "Birthday",
            "required": false
        },
        "team": {
            "label": "Team",
            "placeholder": "Team name",
            "required": false
        },
        "jobTitle": {
            "label": "What do you do?",
            "placeholder": "Rust Engineer",
            "required": false
        },
        "bio": {
            "label": "Notes about you",
            "placeholder": "Leave here any notes that may be helpful to others: how to work with you, scope of responsibility, extra contact information, or literally anything you want to share with people visiting your profile.",
            "required": false
        },
        "contacts": {
            "matrix": {
              "label": "Matrix Handle",
              "placeholder": "@username:example.com",
              "required": true,
              "prefix": "https://matrix.to/#/@"
            },
            "github": {
              "label": "GitHub",
              "placeholder": "username",
              "required": false,
              "prefix": "https://github.com/"
            },
            "telegram": {
              "label": "Telegram",
              "placeholder": "username",
              "required": false,
              "prefix": "https://t.me/"
            },
            "signal": {
              "label": "Signal",
              "placeholder": "username",
              "required": false,
              "prefix": "https://signal.me/#p/"
            },
            "twitter": {
              "label": "Twitter",
              "placeholder": "username",
              "required": false,
              "prefix": "https://twitter.com/"
            }
        }
    }
}

```

### User Profile Card

To enable - add `["users", "ProfileCard"]` in the [application.json](../framework/configuration/application.md) configuration.

<Image
  src="/modules/usersProfileCard.png"
  alt="Profile card widget"
  width="350"
  height="400"
  style="border: 1px solid lightGray; border-radius: 10px; "
/>

### Users Map Widget

To enable - add `["users", "UsersMapWidget", { "offices": ["global"] }]` in the [application.json](../framework/configuration/application.md) configuration. You can specify which office/hub you want to show it in.

**Stealth mode** - if a user does not want to be shown on the map they can toggle stealth mode. Stealth mode option is also availble in user profile form.

<Image
  src="/modules/usersMap.png"
  alt="Users map"
  width="600"
  height="500"
  style="border: 1px solid lightGray; border-radius: 10px; "
/>

This widget has its own full page as well.

<Image
  src="/modules/usersMapPage.png"
  alt="Users map page"
  style="border: 1px solid lightGray; border-radius: 10px; "
/>
