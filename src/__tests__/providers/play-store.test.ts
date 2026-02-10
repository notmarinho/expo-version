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

import playStoreProvider from '../../providers/play-store';
import { parseVersionFromHtml } from '../../providers/play-store';

describe('PlayStoreProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function mockFetchText(text: string) {
    global.fetch = jest.fn().mockResolvedValueOnce({
      text: () => Promise.resolve(text),
    } as any);
  }

  describe('parseVersionFromHtml', () => {
    it('should parse version from legacy layout (pre-2018)', () => {
      const html = `
        <div class="hAyfc">
          <div class="BgcNfc">Current Version</div>
          <span class="htlgb">
            <span class="htlgb">0.10.0</span>
          </span>
        </div>
      `;
      expect(parseVersionFromHtml(html)).toBe('0.10.0');
    });

    it('should parse version from mid-2018 layout', () => {
      const html = `
        <div class="hAyfc">
          <div class="BgcNfc">Current Version</div>
          <span class="htlgb">
            <div class="IQ1z0d">
              <span class="htlgb">2.5.3</span>
            </div>
          </span>
        </div>
      `;
      expect(parseVersionFromHtml(html)).toBe('2.5.3');
    });

    it('should parse numeric-only version from legacy layout', () => {
      const html = `
        <div class="hAyfc">
          <div class="BgcNfc">Current Version</div>
          <span class="htlgb">
            <div class="IQ1z0d">
              <span class="htlgb">234</span>
            </div>
          </span>
        </div>
      `;
      expect(parseVersionFromHtml(html)).toBe('234');
    });

    it('should parse version from modern layout (post-May 2022) x.y.z', () => {
      const text =
        'null,null,[[null,1]],null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[2],null,[[["0.10.0"]],[[[30,"11"]],[[[16,"4.1"]]]],[["May 31, 2022"]]]';
      expect(parseVersionFromHtml(text)).toBe('0.10.0');
    });

    it('should parse version from modern layout (post-May 2022) numeric', () => {
      const text =
        'null,null,[[null,1]],null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[2],null,[[["234"]],[[[30,"11"]],[[[16,"4.1"]]]],[["May 31, 2022"]]]';
      expect(parseVersionFromHtml(text)).toBe('234');
    });

    it('should return null when no version pattern is found', () => {
      expect(parseVersionFromHtml('<html><body>No version here</body></html>')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseVersionFromHtml('')).toBeNull();
    });
  });

  describe('getVersion - success cases', () => {
    it('should return version and store URL from legacy layout', async () => {
      mockFetchText(`
        <html>
        <div class="hAyfc">
          <div class="BgcNfc">Current Version</div>
          <span class="htlgb">
            <span class="htlgb">1.2.3</span>
          </span>
        </div>
        </html>
      `);

      const result = await playStoreProvider.getVersion({
        packageName: 'com.myapp',
      });

      expect(result.version).toBe('1.2.3');
      expect(result.storeUrl).toBe(
        'https://play.google.com/store/apps/details?id=com.myapp&hl=en&gl=US'
      );
    });

    it('should return version from modern layout', async () => {
      mockFetchText(
        'null,null,[[null,1]],null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[2],null,[[["5.0.1"]]]'
      );

      const result = await playStoreProvider.getVersion({
        packageName: 'com.myapp',
      });

      expect(result.version).toBe('5.0.1');
    });

    it('should use default package name from expo-application', async () => {
      mockFetchText(
        'null,null,[[null,1]],null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[2],null,[[["2.0.0"]]]'
      );

      const result = await playStoreProvider.getVersion({});

      expect(result.version).toBe('2.0.0');
      expect(result.storeUrl).toContain('com.example.myapp');
    });

    it('should include sec-fetch-site header by default', async () => {
      mockFetchText('[[["1.0.0"]]]');

      await playStoreProvider.getVersion({ packageName: 'com.test' });

      const fetchOpts = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(fetchOpts.headers['sec-fetch-site']).toBe('same-origin');
    });

    it('should merge custom fetchOptions', async () => {
      mockFetchText('[[["1.0.0"]]]');

      await playStoreProvider.getVersion({
        packageName: 'com.test',
        fetchOptions: { headers: { 'X-Custom': 'yes' } },
      });

      const fetchOpts = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(fetchOpts.headers['X-Custom']).toBe('yes');
    });
  });

  describe('getVersion - error cases', () => {
    it('should throw when no package name is available', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Application = require('expo-application');
      const original = Application.applicationId;
      Application.applicationId = null;

      await expect(
        playStoreProvider.getVersion({ packageName: undefined })
      ).rejects.toThrow('Could not determine package name');

      Application.applicationId = original;
    });

    it('should throw when version cannot be parsed from page', async () => {
      mockFetchText('<html><body>No version info here</body></html>');

      await expect(
        playStoreProvider.getVersion({ packageName: 'com.test' })
      ).rejects.toThrow('Could not parse version from Play Store page');
    });

    it('should throw when fetch rejects', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(
        playStoreProvider.getVersion({ packageName: 'com.test' })
      ).rejects.toThrow('Network error');
    });
  });
});
