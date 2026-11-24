import * as SecureStore from 'expo-secure-store';

/**
 * The bearer token never lives in plain AsyncStorage: on iOS it sits in the
 * Keychain, on Android in EncryptedSharedPreferences, both backed by the
 * device keystore. SecureStore is unavailable on web, so that path is a no-op
 * and the session simply does not persist there — acceptable for a native app.
 */
const TOKEN_KEY = 'eilams.session.token';

export const tokenStorage = {
  async get(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async set(token: string | null): Promise<void> {
    try {
      if (token) {
        await SecureStore.setItemAsync(TOKEN_KEY, token, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch {
      // Web / unsupported device: the session just won't survive a reload.
    }
  },
};
