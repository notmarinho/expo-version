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

import { needUpdate, getVersionWithDepth } from '../need-update';
import type { NeedUpdateResult } from '../need-update';

describe('getVersionWithDepth', () => {
  it('should pad single segment to 3 parts', () => {
    expect(getVersionWithDepth('1', 3)).toBe('1.0.0');
  });

  it('should pad 2-segment version to 3 parts', () => {
    expect(getVersionWithDepth('1.2', 3)).toBe('1.2.0');
  });

  it('should keep 3-segment version as is', () => {
    expect(getVersionWithDepth('1.2.3', 3)).toBe('1.2.3');
  });

  it('should truncate to depth 2', () => {
    expect(getVersionWithDepth('1.2.3', 2)).toBe('1.2.0');
  });

  it('should truncate to depth 1', () => {
    expect(getVersionWithDepth('1.2.3', 1)).toBe('1.0.0');
  });

  it('should handle 4-segment version with depth 3', () => {
    expect(getVersionWithDepth('1.2.3.4', 3)).toBe('1.2.3');
  });

  it('should handle Infinity depth (use all segments up to 3)', () => {
    expect(getVersionWithDepth('1.2.3', Infinity)).toBe('1.2.3');
  });

  it('should handle Infinity depth with 2 segments', () => {
    expect(getVersionWithDepth('1.2', Infinity)).toBe('1.2.0');
  });
});

describe('needUpdate', () => {
  describe('with explicit versions (no store lookup)', () => {
    it('should detect update needed when latest > current', async () => {
      const result: NeedUpdateResult = await needUpdate({
        currentVersion: '2.0.0',
        latestVersion: '10.0.0',
      });

      expect(result.isNeeded).toBe(true);
      expect(result.currentVersion).toBe('2.0.0');
      expect(result.latestVersion).toBe('10.0.0');
    });

    it('should detect no update needed when versions are equal', async () => {
      const result = await needUpdate({
        currentVersion: '10.0.0',
        latestVersion: '10.0.0',
      });

      expect(result.isNeeded).toBe(false);
    });

    it('should detect no update needed when current > latest', async () => {
      const result = await needUpdate({
        currentVersion: '3.0.2',
        latestVersion: '2.6.1',
      });

      expect(result.isNeeded).toBe(false);
    });

    it('should treat 1.0 and 1.0.0 as equal (spare zeroes)', async () => {
      const result = await needUpdate({
        currentVersion: '1.0',
        latestVersion: '1.0.0',
      });

      expect(result.isNeeded).toBe(false);
    });

    it('should treat 1.0.0 and 1.0 as equal (reverse)', async () => {
      const result = await needUpdate({
        currentVersion: '1.0.0',
        latestVersion: '1.0',
      });

      expect(result.isNeeded).toBe(false);
    });

    it('should detect patch update 1.0 vs 1.0.1', async () => {
      const result = await needUpdate({
        currentVersion: '1.0',
        latestVersion: '1.0.1',
      });

      expect(result.isNeeded).toBe(true);
    });

    it('should detect major update', async () => {
      const result = await needUpdate({
        currentVersion: '1.9.9',
        latestVersion: '2.0.0',
      });

      expect(result.isNeeded).toBe(true);
    });

    it('should detect minor update', async () => {
      const result = await needUpdate({
        currentVersion: '1.0.0',
        latestVersion: '1.1.0',
      });

      expect(result.isNeeded).toBe(true);
    });
  });

  describe('with depth option', () => {
    it('should ignore patch when depth is 2', async () => {
      const result = await needUpdate({
        currentVersion: '1.0.0',
        latestVersion: '1.0.5',
        depth: 2,
      });

      // depth 2: "1.0.0" => "1.0.0", "1.0.5" => "1.0.0"
      expect(result.isNeeded).toBe(false);
    });

    it('should still detect minor update with depth 2', async () => {
      const result = await needUpdate({
        currentVersion: '1.0.0',
        latestVersion: '1.1.5',
        depth: 2,
      });

      // depth 2: "1.0.0" => "1.0.0", "1.1.5" => "1.1.0"
      expect(result.isNeeded).toBe(true);
    });

    it('should ignore minor and patch when depth is 1', async () => {
      const result = await needUpdate({
        currentVersion: '1.0.0',
        latestVersion: '1.5.3',
        depth: 1,
      });

      // depth 1: "1.0.0" => "1.0.0", "1.5.3" => "1.0.0"
      expect(result.isNeeded).toBe(false);
    });

    it('should still detect major update with depth 1', async () => {
      const result = await needUpdate({
        currentVersion: '1.5.3',
        latestVersion: '2.0.0',
        depth: 1,
      });

      // depth 1: "1.5.3" => "1.0.0", "2.0.0" => "2.0.0"
      expect(result.isNeeded).toBe(true);
    });
  });

  describe('using expo-application for current version', () => {
    it('should use nativeApplicationVersion when currentVersion not provided', async () => {
      const result = await needUpdate({
        latestVersion: '2.0.0',
      });

      expect(result.isNeeded).toBe(true);
      expect(result.currentVersion).toBe('1.0.0'); // from mock
    });

    it('should throw when expo-application returns null and no currentVersion', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Application = require('expo-application');
      const original = Application.nativeApplicationVersion;
      Application.nativeApplicationVersion = null;

      await expect(
        needUpdate({ latestVersion: '2.0.0' })
      ).rejects.toThrow('Could not determine current version');

      Application.nativeApplicationVersion = original;
    });
  });

  describe('with store lookup via provider', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should fetch latest version from appStore when not provided', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            resultCount: 1,
            results: [{ version: '5.0.0', trackId: 123 }],
          }),
      } as any);

      const result = await needUpdate({
        currentVersion: '4.0.0',
      });

      expect(result.isNeeded).toBe(true);
      expect(result.latestVersion).toBe('5.0.0');
    });

    it('should include storeUrl from provider', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            resultCount: 1,
            results: [{ version: '5.0.0', trackId: 999 }],
          }),
      } as any);

      const result = await needUpdate({
        currentVersion: '4.0.0',
        provider: 'appStore',
      });

      expect(result.storeUrl).toContain('itms-apps://');
    });
  });

  describe('storeUrl in result', () => {
    it('should return empty storeUrl when versions are provided directly', async () => {
      const result = await needUpdate({
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
      });

      expect(result.storeUrl).toBe('');
    });
  });
});
