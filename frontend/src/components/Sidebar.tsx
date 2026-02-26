import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Cpu,
  Wrench,
  Package,
  BarChart3,
  ClipboardList,
  Settings,
  Heart,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ManagedUserRole } from '../backend';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Assets', path: '/assets', icon: <Cpu className="w-4 h-4" /> },
  { label: 'Repair Tickets', path: '/repair-tickets', icon: <Wrench className="w-4 h-4" /> },
  { label: 'Parts Inventory', path: '/parts-inventory', icon: <Package className="w-4 h-4" /> },
  { label: 'Reports', path: '/reports', icon: <BarChart3 className="w-4 h-4" /> },
  { label: 'Audit Log', path: '/audit-log', icon: <ClipboardList className="w-4 h-4" /> },
  { label: 'Settings', path: '/settings', icon: <Settings className="w-4 h-4" />, adminOnly: true },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="w-56 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-lg overflow-hidden border border-sidebar-border shrink-0">
          <img
            src="/assets/generated/verifone-logo.dim_256x256.png"
            alt="Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <span className="font-bold text-sm text-sidebar-foreground truncate">Asset Manager</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      {user && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <p className="text-xs font-medium text-sidebar-foreground truncate">{user.username}</p>
          <p className="text-xs text-sidebar-foreground/60 mt-0.5">
            {user.role === ManagedUserRole.Admin ? 'Administrator' : 'User'}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/50 flex items-center gap-1">
          Built with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-sidebar-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
        <p className="text-xs text-sidebar-foreground/40 mt-1">© {new Date().getFullYear()}</p>
      </div>
    </aside>
  );
}
