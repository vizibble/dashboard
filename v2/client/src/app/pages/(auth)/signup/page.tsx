import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from 'cn';
import type * as React from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { PasswordInput } from '@/app/pages/(auth)/shared/components/password-input';
import { useSignup } from '@/app/pages/(auth)/signup/hooks/use-signup';
import { signupSchema, type SignupInput } from '@/app/pages/(auth)/signup/schemas/signup-schema';
import { StatusBanner } from '@/app/shared/components/status-banner';
import { Spinner } from '@/app/shared/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function SignupForm({ className, ...props }: React.ComponentProps<'form'>) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  const { onSubmit, submitError, authQuery } = useSignup();

  return (
    <form
      className={cn('flex flex-col gap-6', className)}
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
      {...props}
    >
      {/* Heading */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground text-sm">It takes less than a minute.</p>
      </div>

      {/* Global error banner */}
      {submitError && <StatusBanner variant="destructive">{submitError}</StatusBanner>}

      <FieldGroup>
        {/* Full name */}
        <Field>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="Jane Doe"
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            {...register('name')}
          />
          {errors.name && (
            <FieldDescription id="name-error" role="alert" className="text-destructive">
              {errors.name.message}
            </FieldDescription>
          )}
        </Field>

        {/* Email */}
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <FieldDescription id="email-error" role="alert" className="text-destructive">
              {errors.email.message}
            </FieldDescription>
          )}
        </Field>

        {/* Password */}
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby="password-hint password-error"
            {...register('password')}
          />
          {errors.password ? (
            <FieldDescription id="password-error" role="alert" className="text-destructive">
              {errors.password.message}
            </FieldDescription>
          ) : (
            <FieldDescription id="password-hint">Must be at least 8 characters.</FieldDescription>
          )}
        </Field>

        {/* Submit */}
        <Field>
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner aria-hidden="true" />
                Creating account…
              </>
            ) : (
              'Create account'
            )}
          </Button>
          <FieldDescription className="text-center">
            Already have an account?{' '}
            <Link
              to={`/login${authQuery ? `?${authQuery}` : ''}`}
              className="text-foreground hover:text-foreground/80 font-medium underline underline-offset-4 transition-colors"
            >
              Log in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
