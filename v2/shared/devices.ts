import { z } from "zod";

import { idSchema, nameSchema } from "./common";

export const createDeviceSchema = z
  .object({
    name: nameSchema,
    template_id: idSchema,
    location_id: idSchema,
  })
  .strict();
export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;

export const updateDeviceSchema = z
  .object({
    name: nameSchema.optional(),
    template_id: idSchema.optional(),
    location_id: idSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);

export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;

// Responses
export const deviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  location_id: z.string(),
  template_id: z.string(),
  template_name: z.string(),
});

/** Returned once, on create and key rotation. The server only stores a hash. */
export const deviceWithKeySchema = deviceSchema.extend({
  device_key: z.string(),
});

export type Device = z.infer<typeof deviceSchema>;
export type DeviceWithKey = z.infer<typeof deviceWithKeySchema>;
