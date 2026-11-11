import { EnvelopeSimpleIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useResendVerification } from '@/app/pages/(auth)/(email)/check-email/hooks/use-resend-verification';
import { AuthNotice } from '@/app/pages/(auth)/shared/components/auth-notice';
import { getSafeReturnPath, type CheckEmailState } from '@/app/pages/(auth)/shared/utils/auth-redirects';
import { StatusBanner } from '@/app/shared/components/status-banner';
import { Spinner } from '@/app/shared/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function CheckEmailPage() {
  const location = useLocation();
  const state = location.state as CheckEmailState | null;
  const next = getSafeReturnPath(state?.next);

  const [email, setEmail] = useState(state?.email ?? '');
  const knownEmail = Boolean(state?.email);

  const { resend, status, cooldown } = useResendVerification(next);
  const normalizedEmail = email.trim().toLowerCase();
  const canResend = normalizedEmail.includes('@') && status.kind !== 'sending' && cooldown === 0;

  return (
    <AuthNotice
      icon={EnvelopeSimpleIcon}
      title="Check your email"
      actions={
        <>
          {status.kind === 'sent' && (
            <StatusBanner variant="success">A new verification link is on its way.</StatusBanner>
          )}

          {status.kind === 'error' && <StatusBanner variant="destructive">{status.message}</StatusBanner>}

          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (canResend) {
                void resend(normalizedEmail);
              }
            }}
          >
            {!knownEmail && (
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>
            )}
            <Button type="submit" variant="outline" size="lg" className="w-full" disabled={!canResend}>
              {status.kind === 'sending' ? (
                <>
                  <Spinner aria-hidden="true" />
                  Sending…
                </>
              ) : cooldown > 0 ? (
                `Resend email in ${cooldown}s`
              ) : (
                'Resend verification email'
              )}
            </Button>
          </form>

          <p className="text-muted-foreground text-center text-sm">
            Wrong address?{' '}
            <Link
              to="/signup"
              className="text-foreground hover:text-foreground/80 font-medium underline underline-offset-4 transition-colors"
            >
              Sign up again
            </Link>{' '}
            or{' '}
            <Link
              to="/login"
              className="text-foreground hover:text-foreground/80 font-medium underline underline-offset-4 transition-colors"
            >
              log in
            </Link>
          </p>
        </>
      }
    >
      {knownEmail ? (
        <p>
          We sent a verification link to <span className="text-foreground font-medium">{state?.email}</span>. Open it to
          activate your account.
        </p>
      ) : (
        <p>We sent you a verification link. Open it to activate your account.</p>
      )}
      <p>The link expires in 1 hour. If you can’t find it, check your spam folder.</p>
    </AuthNotice>
  );
}
