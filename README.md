# expo-version-check

Version checker for Expo applications. Retrieves app version info using `expo-application`, fetches the latest version from the App Store or Play Store, and compares versions to determine if an update is needed.

## Installation

```bash
npx expo install expo-application expo-localization
npm install expo-version-check
```

### Peer Dependencies

| Package              | Version |
|----------------------|---------|
| `expo`               | >= 50   |
| `expo-application`   | >= 5    |
| `expo-localization`  | >= 14   |

## API

### Version Info

```ts
import { getCurrentVersion, getBuildNumber, getPackageName, getRegionCode } from 'expo-version-check';

getCurrentVersion(); // "2.5.0" (Application.nativeApplicationVersion)
getBuildNumber();    // "42"    (Application.nativeBuildVersion)
getPackageName();    // "com.example.myapp" (Application.applicationId)
getRegionCode();     // "US"   (from expo-localization)
```

### Get Latest Version

Fetch the latest version from the App Store (iOS) or Play Store (Android):

```ts
import { getLatestVersion } from 'expo-version-check';

// Auto-selects provider based on platform
const version = await getLatestVersion();

// Explicit provider
const version = await getLatestVersion({ provider: 'appStore', country: 'US' });

// Custom provider
const version = await getLatestVersion({
  provider: async (option) => {
    const res = await fetch('https://my-api.com/version');
    return res.text();
  },
});
```

### Check for Updates

```ts
import { needUpdate } from 'expo-version-check';

const result = await needUpdate();
// result = {
//   isNeeded: true,
//   currentVersion: "1.0.0",
//   latestVersion: "2.0.0",
//   storeUrl: "itms-apps://apps.apple.com/US/app/id123456"
// }

// With depth (ignore patch versions)
const result = await needUpdate({ depth: 2 });

// With explicit versions (skip store lookup)
const result = await needUpdate({
  currentVersion: '1.0.0',
  latestVersion: '2.0.0',
});
```

### Store URLs

```ts
import { getStoreUrl, getAppStoreUrl, getPlayStoreUrl } from 'expo-version-check';

// Platform-aware
const url = getStoreUrl({ appID: '123456789', packageName: 'com.myapp' });

// Explicit
getAppStoreUrl({ appID: '123456789' });
// => "itms-apps://apps.apple.com/US/app/id123456789"

getPlayStoreUrl({ packageName: 'com.myapp' });
// => "https://play.google.com/store/apps/details?id=com.myapp"
```

### Custom Providers

You can create a custom provider implementing the `IProvider` interface:

```ts
import { getLatestVersion, type IProvider } from 'expo-version-check';

const myProvider: IProvider = {
  async getVersion(option) {
    const res = await fetch(`https://my-api.com/version?app=${option.packageName}`);
    const data = await res.json();
    return { version: data.version, storeUrl: data.url };
  },
};

const version = await getLatestVersion({ provider: myProvider });
```

## License

MIT
