import { zodResolver } from '@hookform/resolvers/zod';
import { EnvelopeSimpleIcon } from '@phosphor-icons/react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { useForgotPassword } from '@/app/pages/(auth)/(password)/forgot-password/hooks/use-forgot-password';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/app/pages/(auth)/(password)/forgot-password/schemas/forgot-password-schema';
import { AuthNotice } from '@/app/pages/(auth)/shared/components/auth-notice';
import { StatusBanner } from '@/app/shared/components/status-banner';
import { Spinner } from '@/app/shared/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onBlur',
  });
  const { onSubmit, sentTo, submitError, reset } = useForgotPassword();

  if (sentTo) {
    return (
      <AuthNotice
        icon={EnvelopeSimpleIcon}
        title="Check your email"
        actions={
          <>
            <Button asChild size="lg" className="w-full">
              <Link to="/login">Back to log in</Link>
            </Button>
            <Button variant="ghost" size="lg" className="w-full" onClick={reset}>
              Use a different email
            </Button>
          </>
        }
      >
        <p>
          If an account exists for <span className="text-foreground font-medium">{sentTo}</span>, we’ve sent a link to
          reset your password.
        </p>
        <p>The link expires in 1 hour. If you can’t find it, check your spam folder.</p>
      </AuthNotice>
    );
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-muted-foreground text-sm">Enter your account email and we’ll send you a reset link.</p>
      </div>

      {submitError && <StatusBanner variant="destructive">{submitError}</StatusBanner>}

      <FieldGroup>
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

        <Field>
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner aria-hidden="true" />
                Sending link…
              </>
            ) : (
              'Send reset link'
            )}
          </Button>
          <FieldDescription className="text-center">
            Remembered it?{' '}
            <Link
              to="/login"
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
