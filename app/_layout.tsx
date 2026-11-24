import React from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Redirect,
  Stack,
  useGlobalSearchParams,
  usePathname,
  useSegments,
  type Href,
} from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../src/lib/auth';
import { Spinner } from '../src/components/ui';
import { colors } from '../src/theme';

/** The home, search, and hotel information are public; guest data is not. */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { user, ready } = useAuth();
  const segments = useSegments() as string[];
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const inAuth = segments[0] === '(auth)';
  const isExplore = segments[0] === '(tabs)' && (!segments[1] || segments[1] === 'index');
  const isPublicRoute =
    inAuth ||
    segments.length === 0 ||
    isExplore ||
    segments[0] === 'search' ||
    segments[0] === 'hotel';

  // Wait for SecureStore, otherwise a returning guest watches the sign-in
  // screen flash on every cold start.
  if (!ready) return <Spinner />;

  // After sign-in/sign-up, continue the protected action that sent the guest
  // here (for example, the room they were trying to book).
  if (user && inAuth) return <Redirect href={safeReturnTo(params.returnTo)} />;

  if (!user && !isPublicRoute) {
    return (
      <Redirect
        href={{
          pathname: '/sign-in',
          params: { returnTo: currentProtectedRoute(pathname, params) },
        }}
      />
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.subtle },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(auth)" options={{ animationTypeForReplace: 'pop' }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="search" options={{ presentation: 'modal' }} />
      <Stack.Screen name="hotel/[slug]" />
      <Stack.Screen name="checkout" options={{ presentation: 'modal' }} />
      <Stack.Screen name="booking/[id]" />
      <Stack.Screen name="payments/[reference]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

function currentProtectedRoute(pathname: string, params: Record<string, unknown>): string {
  if (pathname !== '/checkout') return pathname || '/';

  // Checkout details are query params, so keep them through the auth screen.
  const query = new URLSearchParams();
  for (const key of ['hotel', 'room', 'check_in', 'check_out', 'adults', 'children']) {
    const value = params[key];
    if (typeof value === 'string' && value) query.set(key, value);
    else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') query.append(key, item);
      }
    }
  }

  const search = query.toString();
  return search ? `/checkout?${search}` : '/checkout';
}

function safeReturnTo(value: unknown): Href {
  const candidate = typeof value === 'string' ? value : Array.isArray(value) ? value[0] : null;
  if (typeof candidate !== 'string' || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return '/';
  }

  const route = candidate.split('?')[0];
  const isAllowed =
    route === '/checkout' ||
    route === '/bookings' ||
    route === '/profile' ||
    /^\/booking\/[^/]+$/.test(route) ||
    /^\/payments\/[^/]+$/.test(route);

  return isAllowed ? (candidate as Href) : '/';
}
