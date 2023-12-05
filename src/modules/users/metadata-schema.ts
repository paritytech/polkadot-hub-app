import { z } from 'zod'

const contactFieldSchema = z.object({
  label: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  prefix: z.string().optional(), // Optional because not all fields have it
})

const profileFieldSchema = z.object({
  label: z.string().optional(), // Optional because some fields use 'fieldName' instead
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
})

const contactsSchema = z.record(contactFieldSchema)

export const schema = z
  .object({
    profileFields: z.object({
      birthday: profileFieldSchema.optional(),
      department: profileFieldSchema.optional(),
      team: profileFieldSchema.optional(),
      jobTitle: profileFieldSchema.optional(),
      bio: profileFieldSchema.optional(),
      contacts: contactsSchema.optional(),
    }),
  })
  .strict()

export type Metadata = z.infer<typeof schema>
