/**
 * expo-version-check
 *
 * Version checker for Expo applications.
 * Provides utilities to retrieve the current app version, check for updates
 * on the App Store / Play Store, and compare versions.
 */

// Version info (expo-application wrappers)
export {
  getCurrentVersion,
  getBuildNumber,
  getPackageName,
  getRegionCode,
} from './src/version-info';

// Latest version from store
export {
  getLatestVersion,
  type GetLatestVersionOption,
} from './src/get-latest-version';

// Update check
export {
  needUpdate,
  getVersionWithDepth,
  type NeedUpdateOption,
  type NeedUpdateResult,
} from './src/need-update';

// Store URLs
export {
  getStoreUrl,
  getAppStoreUrl,
  getPlayStoreUrl,
  type GetAppStoreUrlOption,
  type GetPlayStoreUrlOption,
  type GetStoreUrlOption,
} from './src/get-store-url';

// Providers (for advanced usage / custom providers)
export { appStore, playStore } from './src/providers';
export type { IProvider, IVersionAndStoreUrl, ProviderGetVersionOption } from './src/providers';
