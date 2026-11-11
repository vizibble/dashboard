import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from 'cn';
import type * as React from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { useLogin } from '@/app/pages/(auth)/login/hooks/use-login';
import { loginSchema, type LoginInput } from '@/app/pages/(auth)/login/schemas/login-schema';
import { PasswordInput } from '@/app/pages/(auth)/shared/components/password-input';
import { StatusBanner } from '@/app/shared/components/status-banner';
import { Spinner } from '@/app/shared/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function LoginForm({ className, ...props }: React.ComponentProps<'form'>) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  const { onSubmit, submitError, authQuery } = useLogin();

  return (
    <form
      className={cn('flex flex-col gap-6', className)}
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
      {...props}
    >
      {/* Heading */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">Log in with your email and password.</p>
      </div>

      {/* Global error banner */}
      {submitError && <StatusBanner variant="destructive">{submitError}</StatusBanner>}

      <FieldGroup>
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
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              to="/forgot-password"
              className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 transition-colors hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          {errors.password && (
            <FieldDescription id="password-error" role="alert" className="text-destructive">
              {errors.password.message}
            </FieldDescription>
          )}
        </Field>

        {/* Submit */}
        <Field>
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner aria-hidden="true" />
                Logging in…
              </>
            ) : (
              'Log in'
            )}
          </Button>
          <FieldDescription className="text-center">
            New here?{' '}
            <Link
              to={`/signup${authQuery ? `?${authQuery}` : ''}`}
              className="text-foreground hover:text-foreground/80 font-medium underline underline-offset-4 transition-colors"
            >
              Create an account
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
