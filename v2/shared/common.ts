import { z } from "zod";

export const nameSchema = z.string().trim().min(1).max(160);

export const descriptionSchema = z.string().trim().max(2000).nullable();

export const idSchema = z.uuid();

export const metricKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z][a-zA-Z0-9_.-]*$/);

export const timestampSchema = z.iso.datetime();

export const numericMetricValueSchema = z
  .number()
  .max(99_999_999_999_999_999_999)
  .min(-99_999_999_999_999_999_999)
  .refine((value) => Number(value.toFixed(10)) === value, {
    message: "Numeric values support at most 10 decimal places",
  })
  .refine((value) => Math.abs(value) < 1e20, {
    message: "Numeric value is out of range",
  });
