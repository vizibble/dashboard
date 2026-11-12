import { ArrowLeftIcon, DotsThreeIcon, type Icon } from '@phosphor-icons/react';
import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/app/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/shared/components/ui/dropdown-menu';
import { cn } from '@/app/shared/utils/cn';

export type PageMenuItem = {
  label: string;
  icon?: Icon;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Status indicator shown next to the title, e.g. <Indicator tone="green">Online</Indicator>. */
  status?: ReactNode;
  /** Link back to the parent page (list or parent record). */
  back?: { to: string; label: string };
  /** Buttons on the right. Put the primary action last. */
  actions?: ReactNode;
  /** Secondary actions collected in a "…" menu. */
  menu?: PageMenuItem[];
  className?: string;
};

/**
 * Sticky page head (ERPNext-style): title + status on the left, actions on the right.
 * Must be the first child of <PageContainer>.
 */
export function PageHeader({ title, description, status, back, actions, menu, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'bg-background/95 sticky top-0 z-20 -mx-4 border-b px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8',
        className,
      )}
    >
      {back && (
        <Link
          to={back.to}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring mb-1 inline-flex max-w-full items-center gap-1 rounded-sm text-xs font-medium focus-visible:ring-2 focus-visible:outline-none"
        >
          <ArrowLeftIcon size={12} weight="bold" aria-hidden="true" />
          <span className="truncate">{back.label}</span>
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <h1 className="text-foreground truncate text-lg font-semibold tracking-tight sm:text-xl">
            {title}
          </h1>
          {status}
        </div>
        {(actions || (menu && menu.length > 0)) && (
          <div className="flex shrink-0 items-center gap-2">
            {menu && menu.length > 0 && <PageMenu items={menu} />}
            {actions}
          </div>
        )}
      </div>
      {description && <p className="text-muted-foreground mt-0.5 line-clamp-1 text-sm">{description}</p>}
    </header>
  );
}

function PageMenu({ items }: { items: PageMenuItem[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon-sm" aria-label="More actions">
          <DotsThreeIcon weight="bold" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {item.destructive && index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onSelect={item.onSelect}
              disabled={item.disabled}
              variant={item.destructive ? 'destructive' : 'default'}
            >
              {item.icon && <item.icon aria-hidden="true" />}
              {item.label}
            </DropdownMenuItem>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const INDICATOR_TONES = {
  gray: 'bg-muted text-muted-foreground [--dot:var(--color-muted-foreground)]',
  green: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 [--dot:var(--color-emerald-500)]',
  orange: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 [--dot:var(--color-amber-500)]',
  red: 'bg-red-500/10 text-red-700 dark:text-red-400 [--dot:var(--color-red-500)]',
  blue: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 [--dot:var(--color-sky-500)]',
} as const;

/** ERPNext-style status pill: coloured dot + label. */
export function Indicator({
  tone = 'gray',
  children,
}: {
  tone?: keyof typeof INDICATOR_TONES;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        INDICATOR_TONES[tone],
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-(--dot)" />
      {children}
    </span>
  );
}
