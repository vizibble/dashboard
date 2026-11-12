import { CheckCircleIcon, LinkBreakIcon } from '@phosphor-icons/react';
import { Link, useSearchParams } from 'react-router-dom';

import { AuthNotice } from '@/app/pages/(auth)/shared/components/auth-notice';
import { getSafeReturnPath, type CheckEmailState } from '@/app/pages/(auth)/shared/utils/auth-redirects';
import { Button } from '@/components/ui/button';

// Better Auth redirects here after handling the link, adding ?error=<code> on failure
export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();

  const error = searchParams.get('error');

  const next = getSafeReturnPath(searchParams.get('next'), '/dashboard');

  if (error) {
    const expired = error.toLowerCase().includes('expired');

    const state: CheckEmailState = { next };

    return (
      <AuthNotice
        icon={LinkBreakIcon}
        tone="destructive"
        title={expired ? 'This link has expired' : "This link isn't valid"}
        actions={
          <>
            <Button asChild size="lg" className="w-full">
              <Link to="/check-email" state={state}>
                Send a new link
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="w-full">
              <Link to="/login">Back to log in</Link>
            </Button>
          </>
        }
      >
        <p>
          {expired
            ? 'Verification links last 1 hour. Request a new one and use it straight away.'
            : 'It may have been used already or copied incorrectly. If your email is already verified, you can log in.'}
        </p>
      </AuthNotice>
    );
  }

  return (
    <AuthNotice
      icon={CheckCircleIcon}
      tone="success"
      title="Email verified"
      actions={
        <Button asChild size="lg" className="w-full">
          <Link to={next}>Continue</Link>
        </Button>
      }
    >
      <p>Your account is active. You’re signed in and ready to go.</p>
    </AuthNotice>
  );
}
