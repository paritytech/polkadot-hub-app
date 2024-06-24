import { z } from 'zod'

export const schema = z
  .object({
    publicHolidayCalendarExternalIds: z.array(z.string()).optional(),
    excludeTimeOffTypes: z.array(z.string()).default([]),
  })
  .strict()

export type Metadata = z.infer<typeof schema>
