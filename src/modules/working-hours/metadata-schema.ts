import { z } from 'zod'

const timeSchema = z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)

export const roleConfigSchema = z
  .object({
    workingDays: z.array(z.number().min(0).max(6)).min(1),
    defaultEntries: z.array(z.tuple([timeSchema, timeSchema])).min(1),
    canPrefillDay: z.boolean().default(false),
    canPrefillWeek: z.boolean().default(false),
    weeklyWorkingHours: z.number().min(1).default(40),
    weeklyOvertimeHoursNotice: z.number().min(1).default(2),
    weeklyOvertimeHoursWarning: z.number().min(1).default(6),
    editablePeriod: z.object({
      /*
        Editable period:
          + current month
          + prev month (if now.date() > {prevMonthBefore})
          + {nextWeeks} whole weeks from now
      */
      prevMonthBefore: z.number().min(1).max(28),
      nextWeeks: z.number().min(0).max(18),
    }),
    publicHolidayCalendarId: z.string().optional(),
    policyText: z.string().optional(),
    maxConsecutiveWorkingHours: z.number().min(2).max(24).optional(),
  })
  .strict()

export type WorkingHoursRoleConfig = z.infer<typeof roleConfigSchema>

export const schema = z
  .object({
    configByRole: z.record(roleConfigSchema),
  })
  .strict()

export type Metadata = z.infer<typeof schema>
