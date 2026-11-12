import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircleIcon, LinkBreakIcon } from '@phosphor-icons/react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { useResetPassword } from '@/app/pages/(auth)/(password)/reset-password/hooks/use-reset-password';
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@/app/pages/(auth)/(password)/reset-password/schemas/reset-password-schema';
import { AuthNotice } from '@/app/pages/(auth)/shared/components/auth-notice';
import { PasswordInput } from '@/app/pages/(auth)/shared/components/password-input';
import { StatusBanner } from '@/app/shared/components/status-banner';
import { Spinner } from '@/app/shared/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';

export function ResetPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onBlur',
  });

  const { status, onSubmit, submitError } = useResetPassword();

  if (status === 'invalid') {
    return (
      <AuthNotice
        icon={LinkBreakIcon}
        tone="destructive"
        title="This reset link isn't valid"
        actions={
          <Button asChild size="lg" className="w-full">
            <Link to="/forgot-password">Request a new link</Link>
          </Button>
        }
      >
        <p>Reset links expire after 1 hour and can only be used once.</p>
      </AuthNotice>
    );
  }

  if (status === 'done') {
    return (
      <AuthNotice
        icon={CheckCircleIcon}
        tone="success"
        title="Password updated"
        actions={
          <Button asChild size="lg" className="w-full">
            <Link to="/login">Log in</Link>
          </Button>
        }
      >
        <p>For your security, you’ve been signed out on all devices. Log in with your new password.</p>
      </AuthNotice>
    );
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
        <p className="text-muted-foreground text-sm">You’ll be signed out on all other devices.</p>
      </div>

      {submitError && <StatusBanner variant="destructive">{submitError}</StatusBanner>}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : 'password-hint'}
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

        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <FieldDescription id="confirm-password-error" role="alert" className="text-destructive">
              {errors.confirmPassword.message}
            </FieldDescription>
          )}
        </Field>

        <Field>
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner aria-hidden="true" />
                Updating password…
              </>
            ) : (
              'Update password'
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
