import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';

export interface AuthUser {
  id: string;
  username: string;
  role: 'Admin' | 'User';
  isAdmin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  principalIsAdmin: boolean;
  setPrincipalIsAdmin: (val: boolean) => void;
  login: (actor: any, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoggingIn: boolean;
  loginError: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [principalIsAdmin, setPrincipalIsAdmin] = useState(false);

  const { login: iiLogin, clear: iiClear, identity, loginStatus, isLoginError, loginError: iiLoginError } = useInternetIdentity();
  const queryClient = useQueryClient();

  // Refs to hold pending login state across async identity resolution
  const pendingActorRef = useRef<any>(null);
  const pendingUsernameRef = useRef<string | null>(null);
  const pendingPasswordRef = useRef<string | null>(null);
  const pendingResolveRef = useRef<(() => void) | null>(null);
  const pendingRejectRef = useRef<((err: Error) => void) | null>(null);

  // When II login errors out, reject the pending login promise
  useEffect(() => {
    if (isLoginError && pendingRejectRef.current) {
      const reject = pendingRejectRef.current;
      pendingActorRef.current = null;
      pendingUsernameRef.current = null;
      pendingPasswordRef.current = null;
      pendingResolveRef.current = null;
      pendingRejectRef.current = null;
      setIsLoggingIn(false);
      const msg = iiLoginError?.message || 'Authentication failed';
      setLoginError(msg);
      reject(new Error(msg));
    }
  }, [isLoginError, iiLoginError]);

  // When identity becomes available and we have pending credentials, complete login
  useEffect(() => {
    if (
      identity &&
      pendingActorRef.current &&
      pendingUsernameRef.current !== null &&
      pendingPasswordRef.current !== null &&
      pendingResolveRef.current !== null
    ) {
      const actor = pendingActorRef.current;
      const username = pendingUsernameRef.current;
      const password = pendingPasswordRef.current;
      const resolve = pendingResolveRef.current;
      const reject = pendingRejectRef.current;

      // Clear pending refs immediately to avoid re-triggering
      pendingActorRef.current = null;
      pendingUsernameRef.current = null;
      pendingPasswordRef.current = null;
      pendingResolveRef.current = null;
      pendingRejectRef.current = null;

      actor.login(username, password)
        .then((result: any) => {
          if (result.__kind__ === 'ok') {
            const token: string = result.ok;
            const parts = token.split('_');
            // Format: session_<username>_<Role>_<id>
            const roleStr = parts[2] || 'User';
            const idStr = parts[3] || '0';
            const authUser: AuthUser = {
              id: idStr,
              username,
              role: roleStr as 'Admin' | 'User',
              isAdmin: roleStr === 'Admin',
            };
            setUser(authUser);
            setIsLoggingIn(false);
            resolve();
          } else {
            const errMsg: string = result.err || 'Invalid username or password';
            setLoginError(errMsg);
            setIsLoggingIn(false);
            if (reject) reject(new Error(errMsg));
          }
        })
        .catch((err: any) => {
          const msg: string = err?.message || 'Login failed';
          setLoginError(msg);
          setIsLoggingIn(false);
          if (reject) reject(new Error(msg));
        });
    }
  }, [identity]);

  const login = useCallback(async (actor: any, username: string, password: string): Promise<void> => {
    setIsLoggingIn(true);
    setLoginError(null);

    // If already authenticated with II, call backend directly
    if (identity) {
      try {
        const result = await actor.login(username, password);
        if (result.__kind__ === 'ok') {
          const token: string = result.ok;
          const parts = token.split('_');
          const roleStr = parts[2] || 'User';
          const idStr = parts[3] || '0';
          const authUser: AuthUser = {
            id: idStr,
            username,
            role: roleStr as 'Admin' | 'User',
            isAdmin: roleStr === 'Admin',
          };
          setUser(authUser);
          setIsLoggingIn(false);
        } else {
          const errMsg: string = result.err || 'Invalid username or password';
          setLoginError(errMsg);
          setIsLoggingIn(false);
          throw new Error(errMsg);
        }
      } catch (err: any) {
        setIsLoggingIn(false);
        const msg: string = err?.message || 'Login failed';
        setLoginError(msg);
        throw new Error(msg);
      }
      return;
    }

    // Need II authentication first — store credentials and trigger II login
    return new Promise<void>((resolve, reject) => {
      pendingActorRef.current = actor;
      pendingUsernameRef.current = username;
      pendingPasswordRef.current = password;
      pendingResolveRef.current = resolve;
      pendingRejectRef.current = reject;
      // iiLogin() returns void — result is handled reactively via useEffect above
      iiLogin();
    });
  }, [identity, iiLogin]);

  const logout = useCallback(async () => {
    setUser(null);
    setPrincipalIsAdmin(false);
    setLoginError(null);
    queryClient.clear();
    iiClear();
  }, [iiClear, queryClient]);

  const isAuthenticated = !!user && !!identity;
  const isAdmin = user?.isAdmin === true;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isAdmin,
      principalIsAdmin,
      setPrincipalIsAdmin,
      login,
      logout,
      isLoggingIn,
      loginError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
