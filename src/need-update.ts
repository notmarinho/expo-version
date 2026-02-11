/**
 * Determines whether the app needs an update by comparing the current
 * version against the latest store version.
 */
import * as semver from 'semver';
import { getCurrentVersion } from './version-info';
import { getLatestVersion, GetLatestVersionOption } from './get-latest-version';

const DELIMITER = '.';

/**
 * Normalises a version string to a given depth (number of segments)
 * and pads with zeroes to always produce a valid 3-part semver string.
 *
 * @example
 * getVersionWithDepth("1.2", 3) => "1.2.0"
 * getVersionWithDepth("1.2.3.4", 2) => "1.2.0"
 */
export function getVersionWithDepth(version: string, depth: number): string {
  const parts =
    version.indexOf(DELIMITER) === -1
      ? [version]
      : version.split(DELIMITER).slice(0, Math.min(depth, version.split(DELIMITER).length));

  // Pad to exactly 3 segments for valid semver
  const padded = [...parts, ...['0', '0', '0'].slice(0, 3 - parts.length)];
  return padded.join(DELIMITER);
}

export interface NeedUpdateOption extends GetLatestVersionOption {
  /** Override the current app version (defaults to expo-application value). */
  currentVersion?: string;
  /** Override the latest version (skips store lookup). */
  latestVersion?: string;
  /** Number of version segments to compare (default: Infinity = all). */
  depth?: number;
}

export interface NeedUpdateResult {
  /** True if the latest version is greater than the current version. */
  isNeeded: boolean;
  /** The store URL for the app (empty string if not available). */
  storeUrl: string;
  /** The current app version used for comparison. */
  currentVersion: string;
  /** The latest store version used for comparison. */
  latestVersion: string;
}

/**
 * Checks whether an app update is needed.
 *
 * Compares the current app version (from expo-application) against the latest
 * version from the store. Supports limiting comparison depth (e.g., ignore patch).
 *
 * @example
 * ```ts
 * const result = await needUpdate();
 * if (result.isNeeded) {
 *   Alert.alert('Update available', `Version ${result.latestVersion} is out!`);
 * }
 * ```
 */
export async function needUpdate(
  option: NeedUpdateOption = {}
): Promise<NeedUpdateResult> {
  const depth = option.depth ?? Infinity;

  // Resolve current version
  const currentVersion = option.currentVersion ?? getCurrentVersion();
  if (!currentVersion) {
    throw new Error(
      '[expo-version-check] Could not determine current version. Pass it via option.currentVersion.'
    );
  }

  // Resolve latest version
  let latestVersion = option.latestVersion;
  let storeUrl = '';

  if (!latestVersion) {
    // Try to get storeUrl from the provider directly
    const providerOption = { ...option };
    const resolved = resolveProviderForStoreUrl(providerOption);

    if (resolved) {
      const result = await resolved.getVersion(providerOption);
      latestVersion = result.version;
      storeUrl = result.storeUrl;
    } else {
      latestVersion = await getLatestVersion(providerOption);
    }
  }

  const currentWithDepth = getVersionWithDepth(currentVersion, depth);
  const latestWithDepth = getVersionWithDepth(latestVersion, depth);

  return {
    isNeeded: semver.gt(latestWithDepth, currentWithDepth),
    storeUrl,
    currentVersion,
    latestVersion,
  };
}

/**
 * Attempts to resolve an IProvider from the option for getting store URL alongside version.
 */
function resolveProviderForStoreUrl(
  option: NeedUpdateOption
): { getVersion: (opt: any) => Promise<{ version: string; storeUrl: string }> } | null {
  // Import providers lazily to avoid circular dependency issues
  const providers = require('./providers');

  if (!option.provider) {
    return null;
  }

  // Named provider
  if (typeof option.provider === 'string' && providers[option.provider]) {
    return providers[option.provider];
  }

  // IProvider instance
  if (typeof option.provider === 'object' && typeof option.provider.getVersion === 'function') {
    return option.provider;
  }

  return null;
}
