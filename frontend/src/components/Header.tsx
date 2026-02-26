import React from 'react';
import { Moon, Sun, LogOut, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile } from '@/hooks/useQueries';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <img
          src="/assets/generated/verifone-logo.dim_256x256.png"
          alt="Verifone"
          className="h-7 w-7 object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <span className="font-semibold text-foreground text-sm tracking-wide">
          Verifone Repair Tracker
        </span>
      </div>

      <div className="flex items-center gap-3">
        {identity && (
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">
                {userProfile?.name || 'User'}
              </span>
            </div>
            {userProfile?.appRole && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium capitalize">
                {String(userProfile.appRole)}
              </span>
            )}
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {identity && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-8 text-muted-foreground hover:text-foreground hover:bg-accent gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="text-xs">Logout</span>
          </Button>
        )}
      </div>
    </header>
  );
}
