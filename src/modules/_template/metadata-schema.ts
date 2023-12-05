import { z } from 'zod'

export const schema = z.object({}).strict()

export type Metadata = z.infer<typeof schema>
