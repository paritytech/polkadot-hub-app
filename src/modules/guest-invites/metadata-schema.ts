import { z } from 'zod'

const rule = z.object({
  id: z.string().nonempty(),
  label: z.string().nonempty(),
})

export const schema = z
  .object({
    rulesByOffice: z
      .record(z.array(rule).min(1))
      .and(z.object({ __default: z.array(rule).min(1) })),
  })
  .strict()

export type Metadata = z.infer<typeof schema>
