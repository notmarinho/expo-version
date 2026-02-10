/**
 * Retrieves the latest version of the app from the configured store provider.
 */
import { Platform } from 'react-native';
import { appStore, playStore } from './providers';
import { IProvider, ProviderGetVersionOption } from './providers/types';

type ProviderNameOrInstance = 'appStore' | 'playStore' | IProvider | ((option: GetLatestVersionOption) => Promise<string>);

const builtInProviders: Record<string, IProvider> = {
  appStore,
  playStore,
};

export interface GetLatestVersionOption extends ProviderGetVersionOption {
  /** Store provider name, IProvider instance, or async function returning a version string. */
  provider?: ProviderNameOrInstance;
}

/**
 * Returns the default provider name based on the current platform.
 */
function getDefaultProviderName(): 'appStore' | 'playStore' {
  return Platform.OS === 'ios' ? 'appStore' : 'playStore';
}

/**
 * Resolves the provider from the option into an IProvider instance, a custom function, or null.
 */
function resolveProvider(
  provider: ProviderNameOrInstance | undefined
): IProvider | ((option: GetLatestVersionOption) => Promise<string>) {
  const resolved = provider ?? getDefaultProviderName();

  // Named built-in provider
  if (typeof resolved === 'string') {
    const builtIn = builtInProviders[resolved];
    if (!builtIn) {
      throw new Error(`[expo-version] Invalid provider name: "${resolved}".`);
    }
    return builtIn;
  }

  // IProvider instance (has getVersion method)
  if (typeof resolved === 'object' && typeof resolved.getVersion === 'function') {
    return resolved;
  }

  // Custom async function
  if (typeof resolved === 'function') {
    return resolved;
  }

  throw new Error('[expo-version] Invalid provider. Pass a name, IProvider, or function.');
}

/**
 * Fetches the latest app version from the store.
 *
 * @param option - Configuration for provider, package name, country, etc.
 * @returns The latest version string.
 *
 * @example
 * ```ts
 * const version = await getLatestVersion();
 * const version = await getLatestVersion({ provider: 'appStore', country: 'US' });
 * const version = await getLatestVersion({ provider: myCustomProvider });
 * ```
 */
export async function getLatestVersion(
  option: GetLatestVersionOption = {}
): Promise<string> {
  const provider = resolveProvider(option.provider);

  // Custom function provider
  if (typeof provider === 'function') {
    return provider(option);
  }

  // IProvider instance
  const { version } = await provider.getVersion(option);
  return version;
}
