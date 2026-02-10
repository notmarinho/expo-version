const mockApplication: Record<string, any> = {
  nativeApplicationVersion: '2.5.0',
  nativeBuildVersion: '42',
  applicationId: 'com.example.myapp',
  applicationName: 'MyApp',
};

jest.mock('expo-application', () => mockApplication);

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [
    { regionCode: 'US', languageTag: 'en-US', languageCode: 'en' },
  ]),
}));

import { getLocales } from 'expo-localization';
import {
  getCurrentVersion,
  getBuildNumber,
  getPackageName,
  getRegionCode,
} from '../version-info';

describe('version-info', () => {
  afterEach(() => {
    // Restore defaults
    mockApplication.nativeApplicationVersion = '2.5.0';
    mockApplication.nativeBuildVersion = '42';
    mockApplication.applicationId = 'com.example.myapp';
  });

  describe('getCurrentVersion', () => {
    it('should return the native application version from expo-application', () => {
      expect(getCurrentVersion()).toBe('2.5.0');
    });

    it('should return null when nativeApplicationVersion is null', () => {
      mockApplication.nativeApplicationVersion = null;
      expect(getCurrentVersion()).toBeNull();
    });
  });

  describe('getBuildNumber', () => {
    it('should return the native build version from expo-application', () => {
      expect(getBuildNumber()).toBe('42');
    });

    it('should return null when nativeBuildVersion is null', () => {
      mockApplication.nativeBuildVersion = null;
      expect(getBuildNumber()).toBeNull();
    });
  });

  describe('getPackageName', () => {
    it('should return the application ID from expo-application', () => {
      expect(getPackageName()).toBe('com.example.myapp');
    });

    it('should return null when applicationId is null', () => {
      mockApplication.applicationId = null;
      expect(getPackageName()).toBeNull();
    });
  });

  describe('getRegionCode', () => {
    it('should return the region code from the first locale', () => {
      expect(getRegionCode()).toBe('US');
    });

    it('should return null when locales array is empty', () => {
      (getLocales as jest.Mock).mockReturnValueOnce([]);
      expect(getRegionCode()).toBeNull();
    });

    it('should return null when regionCode is undefined', () => {
      (getLocales as jest.Mock).mockReturnValueOnce([
        { languageTag: 'en', languageCode: 'en' },
      ]);
      expect(getRegionCode()).toBeNull();
    });
  });
});
