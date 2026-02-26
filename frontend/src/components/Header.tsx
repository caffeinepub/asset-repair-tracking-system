import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useTheme } from '../hooks/useTheme';
import { Sun, Moon, LogOut, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { identity, clear, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();
  const { theme, toggleTheme } = useTheme();

  const isAuthenticated = !!identity;
  const isLoggingOut = loginStatus === 'logging-in';

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const roleLabel = userProfile?.appRole
    ? userProfile.appRole.charAt(0).toUpperCase() + userProfile.appRole.slice(1)
    : null;

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <img
          src="/assets/generated/verifone-logo.dim_256x256.png"
          alt="Rebtekx"
          className="h-7 w-7 object-contain"
        />
        <div>
          <h1 className="text-sm font-bold text-foreground leading-tight">Rebtekx</h1>
          <p className="text-xs text-muted-foreground leading-tight hidden sm:block">Asset Repair Tracking</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* User Info */}
        {isAuthenticated && userProfile && (
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground hidden sm:block">{userProfile.name}</span>
            {roleLabel && (
              <span className="text-xs text-muted-foreground hidden md:block">· {roleLabel}</span>
            )}
          </div>
        )}

        {/* Logout Button */}
        {isAuthenticated && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="h-8 text-muted-foreground hover:text-foreground gap-1.5"
          >
            {isLoggingOut ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline text-xs">Logout</span>
          </Button>
        )}
      </div>
    </header>
  );
}
