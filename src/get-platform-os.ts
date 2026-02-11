/**
 * Platform OS detection — default/web fallback.
 *
 * Metro resolves the platform-specific variant (.ios.ts / .android.ts) at
 * bundle time. This base file is the fallback used on web and in tests.
 *
 * The type is a union so that consuming code can compare against any platform
 * without TypeScript narrowing it to a single literal at compile time.
 */
export const platformOS: 'ios' | 'android' | 'web' = 'web';
