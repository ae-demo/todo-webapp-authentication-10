// Typed read of window._env_, the platform's runtime config. Mounted as
// /env-config.js at request time — never build-time. Throw on a missing key,
// never default it: a silent fallback hides a missing OIDC issuer.
type Env = {
  // The `user-auth` platform-resource (thunder-app) dependency's four
  // browser-facing keys. USER_AUTH_JWKS_URL is emitted too, but the browser
  // never validates a token — the API gateway does — so it is not read here.
  USER_AUTH_CLIENT_ID: string;
  USER_AUTH_ISSUER: string;
  USER_AUTH_SCOPES: string;
  USER_AUTH_RESOURCE: string;
};

declare global {
  interface Window {
    _env_: Env;
  }
}

if (!window._env_) {
  throw new Error(
    "window._env_ not set — /env-config.js failed to load. " +
      "The platform mounts this file; if you see this locally, host " +
      "/env-config.js from your dev server.",
  );
}

export const env: Env = window._env_;
