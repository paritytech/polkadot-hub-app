# Permissions

You can define custom access permissions and custom roles here. Permissions for each module are defined in the `src/modules/<Module-name>/permissions.ts`

// @TODO - Update the config-demo with admin permissions

// @TODO - Add a list of available permissions

E.g.

```json
{
  "roleGroups": [
    {
      "id": "base",
      "name": "Base user roles",
      "roles": [
        {
          "id": "regular",
          "name": "HubMember",
          "permissions": [
            "users.list_profiles",
            "users.manage_profile",
            "users.use_map",
            "users.use_onboarding",
            "visits.list_visitors",
            "visits.create",
            "guest-invites.create",
            "room-reservation.create",
            "search.use",
            "events.list_global_events",
            "events.list_participants",
            "quick-navigation.use",
            "profile-questions.use",
            "help-center.get_content",
            "checklists.use",
            "announcements.use"
          ],
          "accessByDefault": true
        }
      ]
    },
    {
      "id": "admins",
      "name": "Admins 🔥",
      "roles": [
        {
          "id": "admin",
          "name": "Admin",
          "permissions": [
            "users.__admin",
            "users.admin.list",
            "users.admin.manage",
            "users.admin.assign_roles",
            "users.list_profiles",
            "users.manage_profile",
            "users.use_map",
            "users.use_onboarding",
            "visits.__admin",
            "events.admin.manage",
            "events.list_global_events",
            "checklists.admin.manage",
            "announcements.__admin",
            "announcements.use",
            "working-hours.__admin",
            "working-hours.admin.list",
            "working-hours.admin.manage",
            "admin-dashboard.__admin",
            "memberships.__admin"
          ],
          "accessByDefault": true
        }
      ]
    }
  ]
}
```
