import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Device from 'expo-device';
import { api, ApiError, type User } from './api';
import { tokenStorage } from './token-storage';

type Session = {
  user: User | null;
  /** null until SecureStore has been read, so the first frame does not flash the sign-in screen. */
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Context = createContext<Session | null>(null);

const DEVICE_NAME = `${Device.manufacturer ?? ''} ${Device.modelName ?? ''}`.trim() || 'Eilams app';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = await tokenStorage.get();

      if (token) {
        try {
          const me = await api.me();
          if (!cancelled) setUser(me.data);
        } catch (error) {
          // An expired or revoked token is not an error worth showing: clear it
          // and let the guest land on sign-in.
          if (error instanceof ApiError && error.status === 401) await tokenStorage.set(null);
        }
      }

      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await api.login({ email, password, device_name: DEVICE_NAME });
    await tokenStorage.set(session.token);
    setUser(session.user);
  }, []);

  const signUp = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
      phone?: string;
    }) => {
      const session = await api.register({ ...input, device_name: DEVICE_NAME });
      await tokenStorage.set(session.token);
      setUser(session.user);
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // The token may already be gone; clearing it locally is what matters.
    }
    await tokenStorage.set(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const me = await api.me();
      setUser(me.data);
    } catch {
      // Keep whatever we have; the caller decides whether that is fatal.
    }
  }, []);

  const value = useMemo(
    () => ({ user, ready, signIn, signUp, signOut, refresh }),
    [user, ready, signIn, signUp, signOut, refresh],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAuth(): Session {
  const session = useContext(Context);

  if (!session) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }

  return session;
}
