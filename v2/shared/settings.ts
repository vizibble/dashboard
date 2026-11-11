import { z } from "zod";

/** True when the runtime knows this IANA zone (e.g. "Europe/London", "Asia/Kolkata"). */
export function isValidTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const timezoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .refine(isValidTimezone, { message: "Unknown timezone" });

export const updateOrganisationSettingsSchema = z
  .object({ timezone: timezoneSchema })
  .strict();

export type UpdateOrganisationSettingsInput = z.infer<
  typeof updateOrganisationSettingsSchema
>;

export const organisationSettingsSchema = z.object({
  timezone: z.string(),
  can_edit: z.boolean(),
});

export type OrganisationSettings = z.infer<typeof organisationSettingsSchema>;
