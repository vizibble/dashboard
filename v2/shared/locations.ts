import { z } from "zod";

import { idSchema, nameSchema } from "./common";

export const createLocationSchema = z
  .object({
    name: nameSchema,
    parent_id: idSchema.nullable().optional(),
    can_have_children: z.boolean().default(false),
  })
  .strict();

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type CreateLocationFormInput = z.input<typeof createLocationSchema>;

export const renameLocationSchema = z
  .object({
    name: nameSchema,
  })
  .strict();
export type RenameLocationInput = z.infer<typeof renameLocationSchema>;

// Responses
export const locationSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  parent_id: z.string().nullable(),
  name: z.string(),
  can_have_children: z.boolean(),
});

export type Location = z.infer<typeof locationSchema>;
