import { z } from 'zod'

export const schema = z
  .object({
    navigation: z
      .array(
        z.object({
          section: z.string(),
          main: z.boolean().optional(),
          links: z.array(
            z.object({
              url: z.string(),
              name: z.string(),
              icon: z.string().optional(),
              sameTab: z.boolean().optional(),
              external: z.boolean(),
            })
          ),
        })
      )
      .min(1),
  })
  .strict()

export type Metadata = z.infer<typeof schema>
