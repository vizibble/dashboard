import {
  CustomAlertIcon,
  CustomDashboardIcon,
  CustomDeviceIcon,
  CustomLocationIcon,
  CustomProfileIcon,
  CustomRecordsIcon,
  CustomReportIcon,
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
  { id: 'devices', label: 'Devices', path: '/devices', icon: CustomDeviceIcon, permission: { device: ['read'] } },
  {
    id: 'templates',
    label: 'Templates',
    path: '/templates',
    icon: CustomTemplateIcon,
    permission: { template: ['read'] },
  },
  { id: 'records', label: 'Records', path: '/records', icon: CustomRecordsIcon, permission: { telemetry: ['read'] } },
  { id: 'alerts', label: 'Alerts', path: '/alerts', icon: CustomAlertIcon, permission: { device: ['read'] } },
  {
    id: 'locations',
    label: 'Locations',
    path: '/locations',
    icon: CustomLocationIcon,
    permission: { location: ['read'] },
  },
  { id: 'reports', label: 'Reports', path: '/reports', icon: CustomReportIcon, permission: { report: ['read'] } },
] as const satisfies readonly NavItem[];

export const UTILITY_NAV_ITEMS = [
  { id: 'members', label: 'Members', path: '/members', icon: UsersThreeIcon },
  { id: 'integrations', label: 'Integrations', path: '/integrations', icon: PlugsConnectedIcon },
  { id: 'profile', label: 'Profile', path: '/profile', icon: CustomProfileIcon },
] as const satisfies readonly NavItem[];

export const MOBILE_PRIMARY_ITEMS: NavItem[] = [
  MAIN_NAV_ITEMS[0],
  MAIN_NAV_ITEMS[1],
  MAIN_NAV_ITEMS[3],
  MAIN_NAV_ITEMS[4],
];

export const MOBILE_MORE_ITEMS: NavItem[] = [
  MAIN_NAV_ITEMS[2],
  MAIN_NAV_ITEMS[5],
  MAIN_NAV_ITEMS[6],
  ...UTILITY_NAV_ITEMS,
];

/** Filters nav items down to those the current member may open. */
export function useVisibleNavItems(items: readonly NavItem[]): NavItem[] {
  const { can } = usePermissions();
  return items.filter((item) => !item.permission || can(item.permission));
}
