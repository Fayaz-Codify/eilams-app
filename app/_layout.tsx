import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Redirect, Stack, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../src/lib/auth';
import { Spinner } from '../src/components/ui';
import { colors } from '../src/theme';

/**
 * One Stack for the whole app. Auth is a redirect in the tree rather than a
 * route guard on the navigator, so a deep link to a booking lands on sign-in
 * and then — once signed in — comes back to where it started.
 */
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
  const segments = useSegments();
  const inAuth = segments[0] === '(auth)';

  // Wait for SecureStore, otherwise a returning guest watches the sign-in
  // screen flash on every cold start.
  if (!ready) return <Spinner />;

  if (!user && !inAuth) return <Redirect href="/sign-in" />;
  if (user && inAuth) return <Redirect href="/" />;

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
