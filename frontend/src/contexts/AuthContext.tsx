import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ManagedUserRole } from '../backend';

export interface AuthUser {
  id: number;
  username: string;
  role: ManagedUserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string, actor: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (username: string, password: string, actor: any) => {
    if (!actor) throw new Error('Actor not available');
    const result = await actor.login(username, password);
    if (result.__kind__ === 'err') {
      throw new Error(result.err);
    }
    // Parse session token: "session_<username>_<role>_<id>"
    const token: string = result.ok;
    const parts = token.split('_');
    // Format: session_<username>_<role>_<id>
    // parts[0] = "session", parts[1] = username, parts[2] = role, parts[3] = id
    const roleStr = parts[2];
    const idStr = parts[parts.length - 1];
    const role = roleStr === 'Admin' ? ManagedUserRole.Admin : ManagedUserRole.User;
    const id = parseInt(idStr, 10);
    const authUser: AuthUser = { id, username, role };
    setUser(authUser);
    localStorage.setItem('auth_user', JSON.stringify(authUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('auth_user');
  }, []);

  const isAuthenticated = user !== null;
  const isAdmin = user?.role === ManagedUserRole.Admin;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
