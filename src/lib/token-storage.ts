import * as SecureStore from 'expo-secure-store';

/**
 * The bearer token and small offline profile cache never live in plain
 * AsyncStorage: on iOS they sit in the Keychain, on Android in
 * EncryptedSharedPreferences, both backed by the device keystore. SecureStore
 * is unavailable on web, so that path is a no-op and sessions do not persist
 * there — acceptable for a native-first app.
 */
const TOKEN_KEY = 'eilams.session.token';
const USER_KEY = 'eilams.session.user';

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

  async getUser<T>(): Promise<T | null> {
    try {
      const serialized = await SecureStore.getItemAsync(USER_KEY);
      return serialized ? (JSON.parse(serialized) as T) : null;
    } catch {
      return null;
    }
  },

  async setUser(user: unknown | null): Promise<void> {
    try {
      if (user) {
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user), {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
      } else {
        await SecureStore.deleteItemAsync(USER_KEY);
      }
    } catch {
      // Web / unsupported device: the profile cache is optional.
    }
  },
};
