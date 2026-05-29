/**
 * newsService.js — Frontend fetcher for the Latest News homepage section.
 *
 * Mirrors src/services/blogService.js. The Home page never hits the Netlify
 * Function on a normal visitor render; instead it reads the raw GitHub URL
 * (VITE_NEWS_JSON_URL) and applies the public visibility rules client-side.
 *
 * Caching strategy
 *   1. URL cache-buster `?v=<5-minute bucket>` so the GitHub CDN cache flips
 *      at most every 5 minutes after an admin edit.
 *   2. 60-second in-memory module cache so SPA route changes do not re-fetch.
 *
 * Fallback
 *   If VITE_NEWS_JSON_URL is not configured, or the fetch fails, or the file
 *   is empty/invalid, we fall back to the seeded `src/data/news.js`. This
 *   keeps `npm run dev` working without a .env file and also masks transient
 *   network failures in production.
 */

import { news as FALLBACK_NEWS } from "../data/news.js";

// Raw GitHub URL. Configured via Vite env at build time.
// Example: https://raw.githubusercontent.com/<owner>/<repo>/<branch>/data/latest-news.json
const RAW_URL = import.meta.env.VITE_NEWS_JSON_URL;

// In-memory module-scoped cache (lives until the JS bundle is reloaded).
const CACHE_TTL_MS = 60_000; // 60 seconds
let _cache   = null;
let _cacheAt = 0;

/** Pre-sort the static fallback by order ascending so the first 3 are stable. */
const FALLBACK_SORTED = [...FALLBACK_NEWS].sort(byOrderAsc);

/**
 * Returns published news items sorted ascending by `order`.
 *
 * @returns {Promise<Array<{
 *   id: string, title: string, image: string, link: string,
 *   published: boolean, order: number, createdAt: string, updatedAt: string
 * }>>}
 */
export async function getLatestNews() {
  const now = Date.now();

  // Cached result still fresh? Return immediately.
  if (_cache && now - _cacheAt < CACHE_TTL_MS) {
    return _cache;
  }

  if (!RAW_URL) {
    // Normal in pure Vite dev without .env — keep noise low.
    return FALLBACK_SORTED;
  }

  try {
    const bucket = Math.floor(now / 300_000); // 5-minute CDN buster
    const res    = await fetch(RAW_URL + "?v=" + bucket);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const visible = data
          .filter(function (n) { return n && n.published !== false; })
          .sort(byOrderAsc);
        _cache   = visible;
        _cacheAt = now;
        return visible;
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[newsService] raw GitHub fetch failed; using fallback:", err.message);
  }

  return FALLBACK_SORTED;
}

/** Clears the cache. Useful after an admin edit if the site is hot-reloading. */
export function invalidateNewsCache() {
  _cache   = null;
  _cacheAt = 0;
}

function byOrderAsc(a, b) {
  const ao = typeof a.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
  const bo = typeof b.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;
  return ao - bo;
}
