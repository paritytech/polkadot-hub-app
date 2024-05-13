import { z } from 'zod'

export const schema = z
  .object({
    publicHolidayCalendarExternalIds: z.array(z.string()).optional(),
  })
  .strict()

export type Metadata = z.infer<typeof schema>
