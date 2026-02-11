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

jest.mock('../get-platform-os', () => ({
  platformOS: 'ios',
}));

import { getLatestVersion } from '../get-latest-version';
import { IProvider, IVersionAndStoreUrl } from '../providers/types';

describe('getLatestVersion', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('with built-in provider names', () => {
    it('should use appStore provider on iOS by default', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            resultCount: 1,
            results: [{ version: '3.0.0', trackId: 123 }],
          }),
      } as any);

      const version = await getLatestVersion();
      expect(version).toBe('3.0.0');
    });

    it('should use playStore provider when explicitly specified', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        text: () => Promise.resolve('[[["2.1.0"]]]'),
      } as any);

      const version = await getLatestVersion({ provider: 'playStore' });
      expect(version).toBe('2.1.0');
    });

    it('should use appStore provider when explicitly specified', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            resultCount: 1,
            results: [{ version: '4.0.0', trackId: 456 }],
          }),
      } as any);

      const version = await getLatestVersion({ provider: 'appStore' });
      expect(version).toBe('4.0.0');
    });

    it('should throw for invalid provider name', async () => {
      await expect(
        getLatestVersion({ provider: 'invalidStore' as any })
      ).rejects.toThrow('Invalid provider name');
    });
  });

  describe('with custom IProvider instance', () => {
    it('should call getVersion on the custom provider', async () => {
      const customProvider: IProvider = {
        getVersion: jest.fn().mockResolvedValue({
          version: '9.9.9',
          storeUrl: 'https://custom.store/app',
        } as IVersionAndStoreUrl),
      };

      const version = await getLatestVersion({ provider: customProvider });
      expect(version).toBe('9.9.9');
      expect(customProvider.getVersion).toHaveBeenCalledTimes(1);
    });

    it('should pass options to custom provider', async () => {
      const customProvider: IProvider = {
        getVersion: jest.fn().mockResolvedValue({
          version: '1.0.0',
          storeUrl: '',
        } as IVersionAndStoreUrl),
      };

      await getLatestVersion({
        provider: customProvider,
        packageName: 'com.custom.app',
        country: 'BR',
      });

      expect(customProvider.getVersion).toHaveBeenCalledWith(
        expect.objectContaining({
          packageName: 'com.custom.app',
          country: 'BR',
        })
      );
    });
  });

  describe('with custom function provider', () => {
    it('should call the function and return its result', async () => {
      const customFn = jest.fn().mockResolvedValue('7.7.7');

      const version = await getLatestVersion({ provider: customFn });
      expect(version).toBe('7.7.7');
      expect(customFn).toHaveBeenCalledTimes(1);
    });

    it('should pass the full option to the function', async () => {
      const customFn = jest.fn().mockResolvedValue('1.0.0');

      await getLatestVersion({
        provider: customFn,
        packageName: 'com.fn.app',
      });

      expect(customFn).toHaveBeenCalledWith(
        expect.objectContaining({
          packageName: 'com.fn.app',
        })
      );
    });

    it('should propagate errors from the custom function', async () => {
      const customFn = jest.fn().mockRejectedValue(new Error('Custom error'));

      await expect(
        getLatestVersion({ provider: customFn })
      ).rejects.toThrow('Custom error');
    });
  });

  describe('error propagation', () => {
    it('should propagate errors from built-in providers', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network down'));

      await expect(getLatestVersion()).rejects.toThrow('Network down');
    });
  });
});
