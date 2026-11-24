import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import Constants, { AppOwnership } from 'expo-constants';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { api } from './api';
import { useAuth } from './auth';

/**
 * Registers this device with Expo's push service and hands the token to the
 * API, so a booking confirmation can reach the lock screen.
 *
 * Every failure here is deliberately silent: no EAS project id, a refused
 * permission, a simulator, or no network must never stop someone booking a
 * room. The server only sends pushes while EXPO_PUSH_ENABLED is true.
 */
export function usePushRegistration() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.id <= 0) return;

    let cancelled = false;

    (async () => {
      try {
        // Expo Go is not a supported remote-push target for current SDKs.
        // Skip unsupported calls instead of logging runtime warnings.
        if (Constants.appOwnership === AppOwnership.Expo || !Device.isDevice) return;

        const settings = await Notifications.getPermissionsAsync();
        const status = settings.granted
          ? 'granted'
          : (await Notifications.requestPermissionsAsync()).status;

        if (status !== 'granted' || cancelled) return;

        const token = (await Notifications.getExpoPushTokenAsync()).data;
        if (cancelled) return;

        await api.registerDevice(token, Platform.OS === 'ios' ? 'ios' : 'android');
      } catch {
        // See above: push is a nicety, not a precondition.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);
}
