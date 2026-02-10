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

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import {
  getAppStoreUrl,
  getPlayStoreUrl,
  getStoreUrl,
} from '../get-store-url';

describe('getAppStoreUrl', () => {
  it('should build an App Store URL with appID and country', () => {
    const url = getAppStoreUrl({ appID: '123456789', country: 'US' });
    expect(url).toBe('itms-apps://apps.apple.com/US/app/id123456789');
  });

  it('should use default region from expo-localization', () => {
    const url = getAppStoreUrl({ appID: '999' });
    expect(url).toBe('itms-apps://apps.apple.com/US/app/id999');
  });

  it('should work with numeric appID', () => {
    const url = getAppStoreUrl({ appID: 123 });
    expect(url).toBe('itms-apps://apps.apple.com/US/app/id123');
  });

  it('should build URL without country when region is unavailable', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getLocales } = require('expo-localization');
    (getLocales as jest.Mock).mockReturnValueOnce([]);

    const url = getAppStoreUrl({ appID: '123' });
    expect(url).toBe('itms-apps://apps.apple.com/app/id123');
  });

  it('should throw when appID is missing', () => {
    expect(() => getAppStoreUrl({ appID: '' })).toThrow('appID is required');
  });

  it('should override country when explicitly provided', () => {
    const url = getAppStoreUrl({ appID: '123', country: 'BR' });
    expect(url).toBe('itms-apps://apps.apple.com/BR/app/id123');
  });
});

describe('getPlayStoreUrl', () => {
  it('should build a Play Store URL with explicit packageName', () => {
    const url = getPlayStoreUrl({ packageName: 'com.custom.app' });
    expect(url).toBe(
      'https://play.google.com/store/apps/details?id=com.custom.app'
    );
  });

  it('should use default package name from expo-application', () => {
    const url = getPlayStoreUrl();
    expect(url).toBe(
      'https://play.google.com/store/apps/details?id=com.example.myapp'
    );
  });

  it('should throw when no package name is available', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Application = require('expo-application');
    const original = Application.applicationId;
    Application.applicationId = null;

    expect(() => getPlayStoreUrl({})).toThrow(
      'Could not determine package name'
    );

    Application.applicationId = original;
  });
});

describe('getStoreUrl', () => {
  it('should return App Store URL on iOS', () => {
    const url = getStoreUrl({
      appID: '123',
      packageName: 'com.test',
    });
    expect(url).toBe('itms-apps://apps.apple.com/US/app/id123');
  });

  it('should return Play Store URL on Android', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Platform } = require('react-native');
    const originalOS = Platform.OS;
    Platform.OS = 'android';

    const url = getStoreUrl({
      appID: '123',
      packageName: 'com.test',
    });
    expect(url).toBe(
      'https://play.google.com/store/apps/details?id=com.test'
    );

    Platform.OS = originalOS;
  });
});
