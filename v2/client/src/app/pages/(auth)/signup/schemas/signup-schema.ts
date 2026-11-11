import { z } from 'zod';

const unicodeLength = (value: string) => Array.from(value).length;

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .refine((value) => unicodeLength(value) >= 2, 'Name must contain at least 2 characters')
    .refine((value) => unicodeLength(value) <= 80, 'Name is too long'),

  email: z
    .string()
    .trim()
    .pipe(z.email({ error: 'Enter a valid email address' }))
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .refine((value) => unicodeLength(value) >= 8, 'Password must contain at least 8 characters')
    .refine((value) => unicodeLength(value) <= 1024, 'Password is too long'),
});

export type SignupInput = z.infer<typeof signupSchema>;
