import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Wrench,
  Package,
  BarChart3,
  ClipboardList,
  Settings,
  Heart,
  Monitor,
} from 'lucide-react';
import { useGetCallerUserProfile } from '@/hooks/useQueries';
import { AppUserRole } from '@/backend';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: AppUserRole[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Assets', path: '/assets', icon: Monitor },
  { label: 'Repair Tickets', path: '/repairs', icon: Wrench },
  { label: 'Parts Inventory', path: '/parts', icon: Package },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
  { label: 'Audit Log', path: '/audit', icon: ClipboardList },
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    roles: [AppUserRole.admin, AppUserRole.supervisor],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { data: userProfile } = useGetCallerUserProfile();

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (!userProfile) return false;
    return item.roles.includes(userProfile.appRole as AppUserRole);
  });

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border h-full">
      {/* Logo / Brand */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-sidebar-primary flex items-center justify-center">
            <Wrench className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="font-bold text-sidebar-foreground text-sm tracking-wide">RepairTrack</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      {userProfile && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <p className="text-xs font-semibold text-sidebar-foreground truncate">{userProfile.name}</p>
          <p className="text-xs text-sidebar-foreground/60 capitalize mt-0.5">{String(userProfile.appRole)}</p>
        </div>
      )}

      {/* Footer attribution */}
      <div className="px-4 py-3 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/50 flex items-center gap-1 flex-wrap">
          Built with <Heart className="h-3 w-3 text-red-400 fill-red-400" /> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sidebar-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </aside>
  );
}
