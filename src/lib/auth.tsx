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
const OFFLINE_USER: User = {
  id: 0,
  name: 'Traveler',
  email: '',
  phone: null,
  email_verified: false,
  member_since: null,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = await tokenStorage.get();

        if (token) {
          const cachedUser = await tokenStorage.getUser<User>();
          if (!cancelled) {
            // A saved token means this is a signed-in session. Show cached
            // content immediately instead of blocking the app on startup I/O.
            setUser(cachedUser ?? OFFLINE_USER);
            setReady(true);
          }

          try {
            const me = await api.me();
            // Ignore a late startup response if the guest signed out or changed
            // accounts while the request was in flight.
            if ((await tokenStorage.get()) === token) {
              if (!cancelled) setUser(me.data);
              await tokenStorage.setUser(me.data);
            }
          } catch (error) {
            // Keep the encrypted profile cache if the phone is offline, but
            // discard both values when the server rejects the same token.
            if (
              error instanceof ApiError &&
              error.status === 401 &&
              (await tokenStorage.get()) === token
            ) {
              await tokenStorage.set(null);
              await tokenStorage.setUser(null);
              if (!cancelled) setUser(null);
            }
          }
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await api.login({ email, password, device_name: DEVICE_NAME });
    await tokenStorage.set(session.token);
    await tokenStorage.setUser(session.user);
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
      await tokenStorage.setUser(session.user);
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
    await tokenStorage.setUser(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const me = await api.me();
      await tokenStorage.setUser(me.data);
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
