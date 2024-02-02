import { z } from 'zod'

export const schema = z
  .object({
    statistics: z.object({
      splitByRoleGroup: z.string(),
    }),
  })
  .strict()

export type Metadata = z.infer<typeof schema>
