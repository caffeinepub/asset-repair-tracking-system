import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, LogOut, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { ManagedUserRole } from '../backend';
import { useQueryClient } from '@tanstack/react-query';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout();
    queryClient.clear();
  };

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg overflow-hidden border border-border">
          <img
            src="/assets/generated/verifone-logo.dim_256x256.png"
            alt="Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <span className="font-semibold text-sm text-foreground hidden sm:block">
          Verifone Asset Manager
        </span>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm">
              {user.role === ManagedUserRole.Admin ? (
                <Shield className="w-4 h-4 text-primary" />
              ) : (
                <User className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="font-medium text-foreground hidden sm:block">{user.username}</span>
            </div>
            <Badge
              variant={user.role === ManagedUserRole.Admin ? 'default' : 'secondary'}
              className="text-xs hidden sm:flex"
            >
              {user.role === ManagedUserRole.Admin ? 'Admin' : 'User'}
            </Badge>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-8 h-8"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="w-8 h-8 text-muted-foreground hover:text-destructive"
          aria-label="Logout"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
