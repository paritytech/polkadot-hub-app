# Modules.json

This is where you turn on/off app modules, set their integrations, metadata and other configuration.

```
    {
      "id": "announcements",
      "enabled": true
    }
```

To enable a module it has to have `enabled` set to `true`.

Some modules have metadata that need to be configured in order for the module to function properly. You can see specification for each module on its module page under [/modules](/modules)

## Portals

You can inject modules inside of other modules using portals. Portals are not enabled on all modules, but some use it. See specific module page for reference on its usage of portals.
