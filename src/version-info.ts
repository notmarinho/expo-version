/**
 * Version info helpers for Expo.
 *
 * Uses expo-application for app metadata and expo-localization for device region.
 */
import * as Application from 'expo-application';
import { getLocales } from 'expo-localization';

/**
 * Returns the current app version string (e.g. "2.11.0").
 * Maps to `Application.nativeApplicationVersion`.
 */
export const getCurrentVersion = (): string | null =>
  Application.nativeApplicationVersion;

/**
 * Returns the native build number (e.g. "114").
 * Maps to `Application.nativeBuildVersion`.
 */
export const getBuildNumber = (): string | null =>
  Application.nativeBuildVersion;

/**
 * Returns the application ID / bundle identifier (e.g. "com.myapp").
 * Maps to `Application.applicationId`.
 */
export const getPackageName = (): string | null => Application.applicationId;

/**
 * Returns the device region code (e.g. "US", "BR").
 * Uses `expo-localization` getLocales() and reads the first locale's regionCode.
 */
export const getRegionCode = (): string | null => {
  const locales = getLocales();
  return locales[0]?.regionCode ?? null;
};
