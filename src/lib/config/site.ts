const FALLBACK_SITE_URL = "https://fitnotes-seven.vercel.app";

const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim().length > 0
    ? process.env.NEXT_PUBLIC_SITE_URL
    : FALLBACK_SITE_URL;

/**
 * Canonical origin for generating absolute URLs in metadata/manifest.
 * Ensures we do not accidentally point to another domain (which would break PWA installs).
 */
export const siteOrigin = rawSiteUrl.replace(/\/+$/, "");

export const buildAbsoluteUrl = (path = "/") =>
  new URL(path, siteOrigin).toString();
