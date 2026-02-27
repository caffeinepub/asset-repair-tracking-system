import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Wrench,
  Package,
  BarChart3,
  ClipboardList,
  Settings,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useGetCallerRole } from '../hooks/useQueries';
import { UserRole } from '../backend';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/assets', label: 'Assets', icon: Users },
  { path: '/repairs', label: 'Repair Tickets', icon: Wrench },
  { path: '/parts', label: 'Parts Inventory', icon: Package },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/audit', label: 'Audit Log', icon: ClipboardList },
];

export default function Sidebar() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { data: callerRole } = useGetCallerRole();

  const isPrincipalAdmin = callerRole === UserRole.admin;

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-sidebar flex flex-col h-full">
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        {isAuthenticated && isPrincipalAdmin && (
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/settings'
                ? 'bg-primary text-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
          >
            <Settings className="h-4 w-4 shrink-0" />
            Settings
          </Link>
        )}
      </nav>

      <div className="p-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} Verifone
        </p>
      </div>
    </aside>
  );
}
