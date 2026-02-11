/**
 * App Store provider.
 *
 * Fetches the latest app version from the iTunes lookup API.
 */
import { getPackageName, getRegionCode } from '../version-info';
import { IProvider, IVersionAndStoreUrl, ProviderGetVersionOption } from './types';

/**
 * Builds the iTunes lookup URL for a given bundle ID and country.
 */
function buildLookupUrl(packageName: string, country?: string): string {
  const countrySegment = country ? `${country}/` : '';
  const cacheBuster = Date.now();
  return `https://itunes.apple.com/${countrySegment}lookup?bundleId=${packageName}&date=${cacheBuster}`;
}

/**
 * Builds the App Store deep-link URL for a given app.
 */
function buildStoreUrl(appId: string | number, country?: string): string {
  const countrySegment = country ? `${country}/` : '';
  return `itms-apps://apps.apple.com/${countrySegment}app/id${appId}`;
}

/**
 * Fetches the latest version and store URL from the Apple App Store.
 */
async function getVersion(
  option: ProviderGetVersionOption = {}
): Promise<IVersionAndStoreUrl> {
  const packageName = option.packageName ?? getPackageName();
  const country = option.country ?? getRegionCode() ?? undefined;

  if (!packageName) {
    throw new Error(
      '[expo-version-check] Could not determine package name. Pass it via option.packageName.'
    );
  }

  const url = buildLookupUrl(packageName, country);
  const response = await fetch(url, option.fetchOptions);
  const json = (await response.json()) as { resultCount: number; results: { version: string; trackId: string | number }[] };

  if (!json.resultCount || json.resultCount === 0) {
    throw new Error(
      `[expo-version-check] No App Store results found for bundle ID "${packageName}".`
    );
  }

  const { version, trackId } = json.results[0];
  const storeUrl = buildStoreUrl(trackId, country);

  return { version, storeUrl };
}

const appStoreProvider: IProvider = { getVersion };

export default appStoreProvider;
