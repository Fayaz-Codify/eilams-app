import React from 'react';
import { Slot } from 'expo-router';

/**
 * The sign-in / sign-up screens share nothing but their background, so a Slot
 * is enough. The auth decision itself lives in app/_layout.tsx, where it can
 * also protect every other screen in the app.
 */
export default function AuthLayout() {
  return <Slot />;
}
