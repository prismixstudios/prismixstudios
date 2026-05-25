/**
 * blogService.js — Frontend blog data fetcher
 *
 * GitHub posts.json trial (active since 2026-05-25):
 *   Reads posts directly from raw.githubusercontent.com via VITE_BLOGS_JSON_URL.
 *   This avoids a Netlify Function call for every visitor page load.
 *
 * Caching strategy (two layers):
 *   1. Cache-buster query param: ?v=<5-minute bucket>
 *      GitHub's raw CDN caches files aggressively.  Appending a bucket value
 *      that changes every 5 minutes ensures visitors see posts within 5 minutes
 *      of a GitHub commit, without hammering the CDN on every request.
 *
 *   2. In-memory module cache (60 seconds):
 *      Stores the last successful fetch result.  If the Blogs page is re-mounted
 *      within 60 seconds (SPA navigation), the cached array is returned instantly
 *      with no network call at all.
 *
 * Fallback:
 *   If VITE_BLOGS_JSON_URL is not set, or the fetch fails, or GitHub returns an
 *   empty/invalid array, the static posts in src/data/blogs.js are returned.
 *   This covers local development without a .env and catastrophic fetch failures.
 */

import { blogs } from "../data/blogs.js";

// Static fallback sorted newest-first — used only when the GitHub fetch fails
const FALLBACK_POSTS = [...blogs].sort(
  (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
);

// Raw GitHub URL set at build time by Netlify (or locally in .env)
// Example: https://raw.githubusercontent.com/<owner>/<repo>/<branch>/data/posts.json
const RAW_URL = import.meta.env.VITE_BLOGS_JSON_URL;

// In-memory cache
const CACHE_TTL_MS = 60_000; // 60 seconds
let _cache   = null;
let _cacheAt = 0;

/**
 * Returns blog posts sorted newest-first.
 *
 * On a cache hit (last fetch < 60 s ago) the cached array is returned immediately.
 * Otherwise fetches VITE_BLOGS_JSON_URL with a 5-minute cache-buster, caches the
 * result, and returns it.  Falls back to the static local dataset on any failure.
 */
export async function getBlogPosts() {
  const now = Date.now();

  // Return cached result if it is still fresh
  if (_cache && now - _cacheAt < CACHE_TTL_MS) {
    return _cache;
  }

  if (!RAW_URL) {
    // No URL configured — expected in pure Vite dev (npm run dev without .env)
    console.warn(
      "[blogService] VITE_BLOGS_JSON_URL is not set; using static fallback posts."
    );
    return FALLBACK_POSTS;
  }

  try {
    // Append a 5-minute bucket so the CDN cache is busted at most every 5 minutes
    const bucket = Math.floor(now / 300_000);
    const res    = await fetch(RAW_URL + "?v=" + bucket);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Strip drafts and dry-run posts — they exist in posts.json but must
        // not appear on the public Blogs page.
        // A post is visible only when published !== false AND dryRun !== true.
        const visible = data.filter(
          (p) => p.published !== false && p.dryRun !== true
        );
        const sorted = visible.sort(
          (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
        );
        _cache   = sorted;
        _cacheAt = now;
        return sorted;
      }
    }
  } catch (err) {
    console.warn(
      "[blogService] GitHub raw fetch failed; using static fallback posts:",
      err.message
    );
  }

  return FALLBACK_POSTS;
}

/**
 * Clears the in-memory cache so the next getBlogPosts() call fetches fresh data.
 * Useful after a successful agent POST if you want to show the new post immediately.
 */
export function invalidateBlogCache() {
  _cache   = null;
  _cacheAt = 0;
}
