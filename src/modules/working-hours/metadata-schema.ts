import { z } from 'zod'

const timeSchema = z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)

export const schema = z
  .object({
    configByRole: z.record(
      z
        .object({
          workingDays: z.array(z.number().min(0).max(6)).min(1),
          defaultEntries: z.array(z.tuple([timeSchema, timeSchema])).min(1),
          canPrefillDay: z.boolean().default(false),
          canPrefillWeek: z.boolean().default(false),
          weeklyWorkingHours: z.number().min(1).default(40),
          weeklyOvertimeHoursNotice: z.number().min(1).default(2),
          weeklyOvertimeHoursWarning: z.number().min(1).default(6),
          editablePeriod: z.object({
            current: z.enum(['isoWeek', 'month', 'day']),
            extraDaysAtEdges: z.tuple([z.number(), z.number()]),
          }),
        })
        .strict()
    ),
  })
  .strict()

export type Metadata = z.infer<typeof schema>
