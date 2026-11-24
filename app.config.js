const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() ?? '';
const isLocalHttpApi = /^http:\/\/(localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|192\.168(?:\.\d{1,3}){2})(?::|\/)/i.test(
  apiUrl,
);
const allowLocalHttp = process.env.EAS_BUILD_PROFILE !== 'production' && isLocalHttpApi;

/**
 * Native development builds need explicit local HTTP exceptions on iOS and
 * Android; only a private-LAN API URL gets those exceptions, never a
 * production EAS build.
 */
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    ...(allowLocalHttp ? { usesCleartextTraffic: true } : {}),
  },
  ios: {
    ...config.ios,
    infoPlist: {
      ...config.ios?.infoPlist,
      ...(allowLocalHttp
        ? {
            NSAppTransportSecurity: {
              ...config.ios?.infoPlist?.NSAppTransportSecurity,
              NSAllowsLocalNetworking: true,
            },
          }
        : {}),
    },
  },
});
