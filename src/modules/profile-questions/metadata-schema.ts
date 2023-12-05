import { z } from 'zod'

export const schema = z
  .object({
    questions: z
      .array(
        z.object({
          category: z.string().nonempty(),
          questions: z.array(z.string().nonempty()),
        })
      )
      .min(1),
  })
  .strict()

export type Metadata = z.infer<typeof schema>
