import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email({ error: 'Enter a valid email address' }))
    .transform((value) => value.toLowerCase()),

  password: z.string().min(1, 'Password is required').max(1024, 'Password is too long'),
});

export type LoginInput = z.infer<typeof loginSchema>;
