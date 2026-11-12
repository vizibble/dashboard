import type { Icon } from '@phosphor-icons/react';
import type * as React from 'react';

type AuthNoticeProps = {
  icon: Icon;
  tone?: 'default' | 'success' | 'destructive';
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

const toneStyles = {
  default: 'bg-accent text-accent-foreground',
  success: 'bg-status-healthy-bg text-status-healthy-fg',
  destructive: 'bg-destructive/10 text-destructive',
};

// Status screen used by the verification and password-reset flows
export function AuthNotice({
  icon: IconComponent,
  tone = 'default',
  title,
  children,
  actions,
}: AuthNoticeProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-4">
        <span className={`inline-flex size-11 items-center justify-center rounded-xl ${toneStyles[tone]}`}>
          <IconComponent className="size-5" weight="duotone" aria-hidden="true" />
        </span>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <div className="text-muted-foreground space-y-2 text-sm leading-relaxed">{children}</div>
        </div>
      </div>
      {actions && <div className="flex flex-col gap-3">{actions}</div>}
    </div>
  );
}
