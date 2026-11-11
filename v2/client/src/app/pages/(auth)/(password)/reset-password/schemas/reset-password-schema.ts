import { z } from 'zod';

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Must be at least 8 characters').max(128, 'Must be 128 characters or fewer'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    error: "Passwords don't match",
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
