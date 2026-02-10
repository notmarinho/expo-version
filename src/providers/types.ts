/**
 * Result returned by a store provider containing version and store URL.
 */
export interface IVersionAndStoreUrl {
  version: string;
  storeUrl: string;
}

/**
 * A provider capable of fetching the latest app version from a store.
 */
export interface IProvider {
  getVersion(option: ProviderGetVersionOption): Promise<IVersionAndStoreUrl>;
}

/**
 * Options passed to a provider's getVersion method.
 */
export interface ProviderGetVersionOption {
  packageName?: string;
  country?: string;
  fetchOptions?: RequestInit;
  ignoreErrors?: boolean;
}
