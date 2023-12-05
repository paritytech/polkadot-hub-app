import { z } from 'zod'

export const schema = z
  .object({
    links: z
      .array(
        z.object({
          name: z.string().nonempty(),
          url: z.string().nonempty(),
        })
      )
      .default([]),
    typeColorMap: z.record(
      z.enum(['green', 'blue', 'red', 'purple', 'gray', 'yellow'])
    ),
    officesWithGlobalEvents: z.array(z.string().nonempty()),
    notionGlobalEventsDatabaseId: z.string().optional(),
  })
  .strict()
  .optional()

export type Metadata = z.infer<typeof schema>
