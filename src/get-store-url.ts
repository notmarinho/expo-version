/**
 * Store URL helpers.
 *
 * Builds deep-link URLs to the App Store and Play Store for the current app.
 */
import { Platform } from 'react-native';
import { getPackageName, getRegionCode } from './version-info';

export interface GetAppStoreUrlOption {
  /** The numeric App Store app ID (required for App Store URL). */
  appID: string | number;
  /** Country code (e.g. "US"). Defaults to device region. */
  country?: string;
}

export interface GetPlayStoreUrlOption {
  /** Android package name. Defaults to Application.applicationId. */
  packageName?: string;
}

export type GetStoreUrlOption = GetAppStoreUrlOption & GetPlayStoreUrlOption;

/**
 * Builds an App Store deep-link URL.
 *
 * @param option - Must include `appID`.
 * @returns The `itms-apps://` URL.
 */
export function getAppStoreUrl(option: GetAppStoreUrlOption): string {
  if (!option.appID) {
    throw new Error('[expo-version-check] appID is required for getAppStoreUrl.');
  }

  const country = option.country ?? getRegionCode() ?? undefined;
  const countrySegment = country ? `${country}/` : '';

  return `itms-apps://apps.apple.com/${countrySegment}app/id${option.appID}`;
}

/**
 * Builds a Play Store URL.
 *
 * @param option - Optionally provide `packageName`.
 * @returns The Play Store web URL.
 */
export function getPlayStoreUrl(option: GetPlayStoreUrlOption = {}): string {
  const packageName = option.packageName ?? getPackageName();

  if (!packageName) {
    throw new Error(
      '[expo-version-check] Could not determine package name for getPlayStoreUrl.'
    );
  }

  return `https://play.google.com/store/apps/details?id=${packageName}`;
}

/**
 * Returns the store URL for the current platform.
 *
 * On iOS, delegates to `getAppStoreUrl`. On Android, delegates to `getPlayStoreUrl`.
 */
export function getStoreUrl(option: GetStoreUrlOption): string {
  if (Platform.OS === 'ios') {
    return getAppStoreUrl(option);
  }
  return getPlayStoreUrl(option);
}
