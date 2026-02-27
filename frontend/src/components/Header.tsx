import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, LogOut, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { useGetCallerRole } from '../hooks/useQueries';
import { UserRole } from '../backend';

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: callerRole, isLoading: roleLoading } = useGetCallerRole();

  const isPrincipalAdmin = callerRole === UserRole.admin;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <img
          src="/assets/generated/verifone-logo.dim_256x256.png"
          alt="Verifone"
          className="h-8 w-8 object-contain"
        />
        <span className="font-bold text-lg tracking-tight text-foreground">
          Verifone Asset Manager
        </span>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="font-medium text-foreground">{user.username}</span>
            </div>
            {roleLoading ? (
              <Badge variant="outline" className="text-xs animate-pulse">
                Verifying...
              </Badge>
            ) : isPrincipalAdmin ? (
              <Badge className="text-xs bg-primary text-primary-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Admin
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                {user.role}
              </Badge>
            )}
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-9 w-9"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        )}
      </div>
    </header>
  );
}
