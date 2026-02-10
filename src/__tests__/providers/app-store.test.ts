jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.0.0',
  nativeBuildVersion: '1',
  applicationId: 'com.example.myapp',
  applicationName: 'MyApp',
}));

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [
    { regionCode: 'US', languageTag: 'en-US', languageCode: 'en' },
  ]),
}));

import appStoreProvider from '../../providers/app-store';

describe('AppStoreProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function mockFetchJson(json: any) {
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve(json),
    } as any);
  }

  describe('getVersion - success cases', () => {
    it('should return version and store URL from iTunes API', async () => {
      mockFetchJson({
        resultCount: 1,
        results: [
          {
            version: '2.3.1',
            trackId: 123456789,
          },
        ],
      });

      const result = await appStoreProvider.getVersion({
        packageName: 'com.example.myapp',
        country: 'US',
      });

      expect(result.version).toBe('2.3.1');
      expect(result.storeUrl).toBe('itms-apps://apps.apple.com/US/app/id123456789');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(fetchUrl).toContain('https://itunes.apple.com/US/lookup');
      expect(fetchUrl).toContain('bundleId=com.example.myapp');
    });

    it('should use default package name and region from expo-application', async () => {
      mockFetchJson({
        resultCount: 1,
        results: [{ version: '1.0.0', trackId: 999 }],
      });

      const result = await appStoreProvider.getVersion({});

      expect(result.version).toBe('1.0.0');
      expect(result.storeUrl).toBe('itms-apps://apps.apple.com/US/app/id999');
    });

    it('should build URL without country when not available', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getLocales } = require('expo-localization');
      (getLocales as jest.Mock).mockReturnValueOnce([]);

      mockFetchJson({
        resultCount: 1,
        results: [{ version: '3.0.0', trackId: 111 }],
      });

      const result = await appStoreProvider.getVersion({
        packageName: 'com.test.app',
      });

      expect(result.version).toBe('3.0.0');
      const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(fetchUrl).toContain('https://itunes.apple.com/lookup');
    });

    it('should pass fetchOptions to fetch', async () => {
      mockFetchJson({
        resultCount: 1,
        results: [{ version: '1.0.0', trackId: 1 }],
      });

      const fetchOptions = { headers: { 'X-Custom': 'value' } };
      await appStoreProvider.getVersion({
        packageName: 'com.test.app',
        fetchOptions,
      });

      expect((global.fetch as jest.Mock).mock.calls[0][1]).toEqual(fetchOptions);
    });
  });

  describe('getVersion - error cases', () => {
    it('should throw when no package name is available', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Application = require('expo-application');
      const original = Application.applicationId;
      Application.applicationId = null;

      await expect(
        appStoreProvider.getVersion({ packageName: undefined })
      ).rejects.toThrow('Could not determine package name');

      Application.applicationId = original;
    });

    it('should throw when iTunes returns zero results', async () => {
      mockFetchJson({ resultCount: 0, results: [] });

      await expect(
        appStoreProvider.getVersion({ packageName: 'com.nonexistent.app' })
      ).rejects.toThrow('No App Store results found');
    });

    it('should throw when fetch rejects', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(
        appStoreProvider.getVersion({ packageName: 'com.test.app' })
      ).rejects.toThrow('Network error');
    });

    it('should throw when JSON parsing fails', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as any);

      await expect(
        appStoreProvider.getVersion({ packageName: 'com.test.app' })
      ).rejects.toThrow('Invalid JSON');
    });
  });
});
