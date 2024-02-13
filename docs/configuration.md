# Profile

## Configuring contact fields

Contact fields are displayed when users are onboarding. Users can modify contact fields in their profile after the onboarding as well.

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
