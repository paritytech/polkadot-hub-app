# Configuration

Configuration for the project lives in a `./config` directory. We suggest keeping that directory in a separate repository and create symbolic link it for local development. You can find a sample folder called `config-demo` [here](https://github.com/paritytech/polkadot-hub-app/tree/master/config-demo)

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
