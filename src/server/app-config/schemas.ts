import { any, z } from 'zod'

const componentRef: z.ZodTypeAny = z.lazy(() =>
  z.union([
    z.tuple([z.string(), z.string()]),
    z.tuple([
      z.string(),
      z.string(),
      z.object({ offices: z.array(z.string()).optional() }),
    ]),
    z.array(componentRef),
  ])
)

export const layout = z.object({
  mobile: z.object({
    fixed: z.array(componentRef),
    office: z.array(componentRef),
    events: z.array(componentRef),
    news: z.array(componentRef),
  }),
  desktop: z.object({
    sidebar: z.array(componentRef),
    main: z.array(z.array(componentRef)),
  }),
})

export const applicationConfig = z.object({
  name: z.string().nonempty(),
  auth: z.object({
    providers: z.array(z.enum(['google', 'polkadot'])),
  }),
  layout: layout,
})

export const officeVisitsConfig = z.object({
  workingDays: z.array(z.number().min(0).max(6)).min(1).max(7),
  bookableDays: z.number().min(1),
  maxCapacity: z.number().min(1),
  capacityThresholds: z.object({
    low: z.number().min(1),
    medium: z.number().min(1),
    high: z.number().min(1),
  }),
})

export const officeAreaDesk = z
  .object({
    id: z.string(),
    name: z.string(),
    position: z.object({
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
    }),
    allowMultipleBookings: z.boolean().default(false).optional(),
    fullAreaBooking: z.boolean().default(false),
    permittedRoles: z.array(z.string()).default([]),
  })
  .and(
    // TODO: delete `type` & `user` fields
    z.union([
      z.object({
        type: z.literal('personal'),
        user: z.string().email(),
      }),
      z.object({
        // @todo check if we need "multi"
        type: z.enum(['flexible', 'multi', 'full_area']),
      }),
    ])
  )

export const officeArea = z.object({
  id: z.string(),
  available: z.boolean().default(true),
  name: z.string(),
  capacity: z.number().min(1),
  map: z.string(),
  // @todo remove type: "desks"
  bookable: z.boolean().default(false),
  desks: z.array(officeAreaDesk).min(1),
  meetingRooms: z.array(officeAreaDesk).optional(),
})

export const officeRoom = z.object({
  id: z.string(),
  name: z.string(),
  available: z.boolean().default(true),
  description: z.string(),
  areaId: z.string(),
  photo: z.string(),
  equipment: z.string(),
  capacity: z.number().min(1),
  workingHours: z.tuple([
    z.string().regex(/^([01][0-9]|2[0-4]):[0-5][0-9]$/),
    z.string().regex(/^([01][0-9]|2[0-4]):[0-5][0-9]$/),
  ]),
  autoConfirm: z.boolean(),
})

export const office = z
  .object({
    id: z.string(),
    name: z.string(),
    icon: z.string().optional(),
    timezone: z.string(),
    country: z.string(),
    city: z.string(),
    allowGuestInvitation: z.boolean(),
    allowDeskReservation: z.boolean(),
    allowRoomReservation: z.boolean(),
    roomsPlaceholderMessage: z.string().optional(), // @todo remove
    address: z.string().optional(),
    visitsConfig: officeVisitsConfig.optional(),
    areas: z.array(officeArea).min(1).optional(),
    rooms: z.array(officeRoom).min(1).optional(),
  })
  .superRefine((office, ctx) => {
    if (office.allowDeskReservation) {
      const visitsConfigParsed = officeVisitsConfig.safeParse(
        office.visitsConfig
      )
      if (!visitsConfigParsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Property 'allowDeskReservation' is set but 'visitConfig' is missing`,
        })
      }
      const areasParsed = z.array(officeArea).min(1).safeParse(office.areas)
      if (!areasParsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Property 'allowDeskReservation' is set but 'areas' is missing`,
        })
      }
    }
    if (office.allowRoomReservation) {
      const roomsParsed = z.array(officeRoom).min(1).safeParse(office.rooms)
      const roomsPlaceholderMessageParsed = z
        .string()
        .nonempty()
        .safeParse(office.roomsPlaceholderMessage)
      if (!roomsParsed.success && !roomsPlaceholderMessageParsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Property 'allowRoomReservation' is set but 'rooms' or 'roomsPlaceholderMessageParsed' is missing`,
        })
      }
    }
    if (office.allowGuestInvitation) {
      if (!office.allowDeskReservation) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Property 'allowGuestInvitation' is set but it requires the 'allowDeskReservation' property to be true`,
        })
      }
    }
  })

export const companyConfig = z.object({
  name: z.string().nonempty(),
  offices: z.array(office).min(1),
})

export const userRole = z.object({
  id: z.string(),
  name: z.string(),
  permissions: z.array(z.string()).default([]),
  accessByDefault: z.boolean().default(false).optional(),
})

export const userRoleGroup = z.object({
  id: z.string(),
  name: z.string(),
  rules: z
    .object({
      max: z.number().min(1).optional(),
      unique: z.boolean().default(false),
      editableByRoles: z.array(z.string()).default([]),
    })
    .superRefine((rules, ctx) => {
      if (rules.unique && rules.editableByRoles.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Unique fields cannot be editable by users',
        })
      }
    })
    .default({ max: undefined, unique: false }),
  roles: z.array(userRole).min(1),
})

export const permissionsConfig = z.object({
  roleGroups: z.array(userRoleGroup).min(1),
  defaultRoleByEmailDomain: z
    .record(z.string())
    .and(z.object({ __default: z.string() })),
})

export const moduleConfig = z
  .object({
    id: z.string(),
    enabled: z.boolean(),
    enabledIntegrations: z.array(z.string()).default([]),
    metadata: z.record(z.any()).optional(),
    portals: z.record(z.array(componentRef)).default({}),
  })
  .strict()

export const modulesConfig = z.object({
  modules: z.array(moduleConfig),
})

export const moduleClientRoute = z
  .object({
    path: z.string(),
    componentId: z.string(),
    fullScreen: z.boolean().default(false).optional(),
    availablePortals: z.array(z.string()).default([]),
  })
  .strict()

export const moduleClientRouter = z
  .object({
    public: z.record(moduleClientRoute).optional(),
    user: z.record(moduleClientRoute).optional(),
    admin: z.record(moduleClientRoute).optional(),
  })
  .strict()

export const moduleManifest = z
  .object({
    id: z.string(),
    name: z.string(),
    dependencies: z.array(z.string()),
    recommendedIntegrations: z.array(z.string()).default([]),
    requiredIntegrations: z.array(z.string()).default([]),
    models: z.array(z.string()).default([]),
    clientRouter: moduleClientRouter.optional(),
  })
  .strict()

export const integrationManifest = z.object({
  id: z.string(),
  name: z.string(),
  credentials: z.array(z.string()),
})
