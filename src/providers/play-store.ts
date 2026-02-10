/**
 * Play Store provider.
 *
 * Fetches the latest app version by scraping the Google Play Store page.
 */
import { getPackageName } from '../version-info';
import { IProvider, IVersionAndStoreUrl, ProviderGetVersionOption } from './types';

/**
 * Builds the Play Store URL for a given package name.
 */
function buildStoreUrl(packageName: string): string {
  return `https://play.google.com/store/apps/details?id=${packageName}&hl=en&gl=US`;
}

/**
 * Attempts to parse the app version from various Play Store HTML layouts.
 *
 * Supports:
 * - Legacy layout (pre-2018): `Current Version` followed by `<span>` with version
 * - Post-May 2022 layout: `[[["x.y.z"]]]` JSON-like pattern
 */
function parseVersionFromHtml(text: string): string | null {
  // Legacy layout: "Current Version...>x.y.z</span>" (may span multiple lines)
  const legacyMatch = text.match(/Current Version[\s\S]+?>([\d.-]+)<\/span>/);
  if (legacyMatch) {
    return legacyMatch[1].trim();
  }

  // Modern layout (since ~May 2022): `[[["x.y.z"]]]`
  const modernMatch = text.match(/\[\[\["([\d\-.]+?)"\]\]/);
  if (modernMatch) {
    return modernMatch[1].trim();
  }

  return null;
}

/**
 * Fetches the latest version and store URL from the Google Play Store.
 */
async function getVersion(
  option: ProviderGetVersionOption = {}
): Promise<IVersionAndStoreUrl> {
  const packageName = option.packageName ?? getPackageName();

  if (!packageName) {
    throw new Error(
      '[expo-version] Could not determine package name. Pass it via option.packageName.'
    );
  }

  const storeUrl = buildStoreUrl(packageName);

  const fetchOptions: RequestInit = {
    headers: { 'sec-fetch-site': 'same-origin' },
    ...option.fetchOptions,
  };

  const response = await fetch(storeUrl, fetchOptions);
  const text = await response.text();

  const version = parseVersionFromHtml(text);

  if (!version) {
    throw new Error(
      "[expo-version] Could not parse version from Play Store page. " +
        "The page layout may have changed."
    );
  }

  return { version, storeUrl };
}

const playStoreProvider: IProvider = { getVersion };

export { parseVersionFromHtml };
export default playStoreProvider;
