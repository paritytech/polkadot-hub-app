# Configuration

Configuration for the project lives in a `./config` directory. We suggest keeping that directory in a separate repository and create symbolic link it for local development.

```
./config
├── application.json                        app name, auth, and homepage layout
├── company.json                            company name, offices, departments, divisions
├── modules.json                            list of enabled modules with their metadata and enabled integrations
├── permissions.json                        list of roles with their permissions, default role by email domain
├── modules                                 custom modules
│   ├── division-sync
│   ├── help-center
├── public                                  custom static files
│   ├── manifest.webmanifest                custom manifest (as it can contain custom app name, icons set, etc)
│   ├── images
│   │   └── ...
└── templates                               custom text templates
    ├── guest-invites
    │   └── email.yaml
    └── visits
        └── notification.yaml
```

## Integrations

### Email-smtp

Add `.env` variables.

```
   SMTP_ENDPOINT=""

   SMTP_PORT=

   SMTP_USERNAME=""

   SMTP_PASSWORD=""

   SMTP_FROM_NAME=""

   SMTP_FROM_EMAIL=""
```

### Matrix

### Mapbox

Support for maps.

We use `mapbox` in a few places:

- All users map at `/map`.
- Map of the hub location on the about page `/about/<hubId>`
- User location on their profile if they specify that they want to share. `/profile/<userId>`

## Text templates

Depending on the configuration of your project you might have certain integrations turned on, e.g. email.
The app sends default texts when emails are sent. You can ovewrite these texts with your customs ones.

1. Create a folder with the module name in the templates folder , e.g. `./config/templates/guest-invites`
2. Create a YAML file for the text message. We have 3 types of messages: notification (matrix), email, text (error messages). E.g. `email.yml`
3. Look up the email message key [here](https://github.com/paritytech/polkadot-hub-app/blob/master/src/integrations/email-smtp/README.md#guest-invites).
4. Add your custom message to yml file. [See example here](https://github.com/paritytech/polkadot-hub-app/blob/master/src/modules/guest-invites/templates/email.yaml)
