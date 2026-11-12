import {
  CustomDashboardIcon,
  CustomDeviceIcon,
  CustomLocationIcon,
  CustomTemplateIcon,
} from '@/app/shared/components/icons/nav-icons';
import type { Icon } from '@phosphor-icons/react';
import { PlugsConnectedIcon, UsersThreeIcon } from '@phosphor-icons/react';
import type { Permissions } from '@vizibble/shared/permissions';

import { usePermissions } from '@/app/pages/(organisation)/shared/hooks/use-permission';

export type NavItem = {
  id: string;
  label: string;
  path: string;
  icon: Icon;
  /** Hidden from members whose role lacks these permissions. */
  permission?: Permissions;
};

export const MAIN_NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: CustomDashboardIcon,
    permission: { dashboard: ['read'] },
  },
  {
    id: 'devices',
    label: 'Devices',
    path: '/devices',
    icon: CustomDeviceIcon,
    permission: { device: ['read'] },
  },
  {
    id: 'templates',
    label: 'Templates',
    path: '/templates',
    icon: CustomTemplateIcon,
    permission: { template: ['read'] },
  },
  {
    id: 'locations',
    label: 'Locations',
    path: '/locations',
    icon: CustomLocationIcon,
    permission: { location: ['read'] },
  },
] as const satisfies readonly NavItem[];

export const UTILITY_NAV_ITEMS = [
  { id: 'members', label: 'Members', path: '/members', icon: UsersThreeIcon },
  { id: 'integrations', label: 'Integrations', path: '/integrations', icon: PlugsConnectedIcon },
] as const satisfies readonly NavItem[];

export const MOBILE_PRIMARY_ITEMS: readonly NavItem[] = MAIN_NAV_ITEMS;

export const MOBILE_MORE_ITEMS: readonly NavItem[] = UTILITY_NAV_ITEMS;

/** Filters nav items down to those the current member may open. */
export function useVisibleNavItems(items: readonly NavItem[]): NavItem[] {
  const { can } = usePermissions();

  return items.filter((item) => !item.permission || can(item.permission));
}
