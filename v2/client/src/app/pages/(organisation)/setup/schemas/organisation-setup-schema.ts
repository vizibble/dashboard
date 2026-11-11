import { z } from 'zod';

export const organisationSchema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters.').max(100, 'Organisation name is too long.'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must contain at least 2 characters.')
    .max(48, 'Slug must contain no more than 48 characters.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only.'),
  location: z.string().trim().max(150, 'Location is too long.').min(1, 'Location is required.'),
});

export type OrganisationFormValues = z.infer<typeof organisationSchema>;
