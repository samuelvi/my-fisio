export {};

declare global {
  interface Window {
    APP_TRANSLATIONS: Record<string, Record<string, string>>;
  }
}
