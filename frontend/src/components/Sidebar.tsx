import { Link, useLocation } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { AppUserRole } from '../backend';
import {
  LayoutDashboard,
  Cpu,
  Wrench,
  Package,
  ClipboardList,
  BarChart2,
  Settings,
  Heart,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: null },
  { path: '/assets', label: 'Assets', icon: Cpu, roles: null },
  { path: '/repair-tickets', label: 'Repair Tickets', icon: Wrench, roles: null },
  { path: '/parts-inventory', label: 'Parts Inventory', icon: Package, roles: null },
  {
    path: '/audit-log',
    label: 'Audit Log',
    icon: ClipboardList,
    roles: [AppUserRole.supervisor, AppUserRole.admin],
  },
  { path: '/reports', label: 'Reports', icon: BarChart2, roles: null },
  {
    path: '/settings',
    label: 'Settings',
    icon: Settings,
    roles: [AppUserRole.admin],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();

  const userRole = userProfile?.appRole ?? null;

  const visibleItems = navItems.filter(item => {
    if (!item.roles) return true;
    if (!userRole) return false;
    return item.roles.includes(userRole);
  });

  const appId = encodeURIComponent(window.location.hostname || 'rebtekx-asset-repair');

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border h-full">
      {/* Logo area */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <img
            src="/assets/generated/verifone-logo.dim_256x256.png"
            alt="Rebtekx"
            className="h-7 w-7 object-contain"
          />
          <div>
            <p className="text-xs font-bold text-sidebar-foreground leading-tight">Rebtekx</p>
            <p className="text-[10px] text-sidebar-foreground/60 leading-tight">Asset Repair</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info */}
      {identity && userProfile && (
        <div className="px-3 py-2 border-t border-sidebar-border">
          <p className="text-xs font-medium text-sidebar-foreground truncate">{userProfile.name}</p>
          <p className="text-[10px] text-sidebar-foreground/60 capitalize">{userProfile.appRole}</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-3 py-2 border-t border-sidebar-border">
        <p className="text-[10px] text-sidebar-foreground/40 flex items-center gap-1 flex-wrap">
          Built with <Heart className="h-2.5 w-2.5 text-destructive fill-destructive" /> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-sidebar-foreground/60 transition-colors"
          >
            caffeine.ai
          </a>
        </p>
        <p className="text-[10px] text-sidebar-foreground/30 mt-0.5">
          © {new Date().getFullYear()} Rebtekx
        </p>
      </div>
    </aside>
  );
}
