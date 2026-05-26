import { getStore } from "@netlify/blobs";

// ─── Config ──────────────────────────────────────────────────────
const LINKEDIN_API_BASE = "https://api.linkedin.com/rest";
// LinkedIn requires this header on every REST call.
// Bump the date string when LinkedIn releases a new API version.
const LINKEDIN_VERSION = process.env.LINKEDIN_API_VERSION ?? "202401";
// Max posts per page (LinkedIn hard cap is 50 for this endpoint)
const PAGE_SIZE = 50;

// ─── LinkedIn fetch ───────────────────────────────────────────────
/**
 * Fetches up to PAGE_SIZE posts from the Prismix LinkedIn company page.
 * Throws if the API key / org URN env vars are missing or if the
 * LinkedIn API returns a non-2xx status.
 */
async function fetchLinkedInPosts() {
  const orgUrn      = process.env.LINKEDIN_ORG_URN;
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;

  if (!orgUrn || !accessToken) {
    throw new Error(
      "Missing env vars: LINKEDIN_ORG_URN and/or LINKEDIN_ACCESS_TOKEN"
    );
  }

  const url = new URL(`${LINKEDIN_API_BASE}/posts`);
  url.searchParams.set("author",  orgUrn);
  url.searchParams.set("q",       "author");
  url.searchParams.set("count",   String(PAGE_SIZE));
  url.searchParams.set("sortBy",  "CREATED");

  const res = await fetch(url.toString(), {
    headers: {
      "Authorization":               `Bearer ${accessToken}`,
      "LinkedIn-Version":            LINKEDIN_VERSION,
      "X-Restli-Protocol-Version":   "2.0.0",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LinkedIn API returned ${res.status}: ${body}`);
  }

  const json = await res.json();
  return json.elements ?? [];
}

// ─── Normalization ────────────────────────────────────────────────
/**
 * Best-effort extraction of a thumbnail URL from the LinkedIn content
 * block. LinkedIn returns different shapes depending on post type
 * (image upload, article share, external link, plain text).
 */
function extractImage(content) {
  if (!content) return null;

  // Uploaded image — thumbnails array
  const media = content.media;
  if (media) {
    if (Array.isArray(media.thumbnails) && media.thumbnails[0]?.url) {
      return media.thumbnails[0].url;
    }
    if (media.originalUrl) return media.originalUrl;
  }

  // Article / link preview thumbnail
  const article = content.article;
  if (article) {
    if (article.thumbnail) return article.thumbnail;
    if (article.thumbnailUrl) return article.thumbnailUrl;
  }

  return null;
}

/**
 * Converts a raw LinkedIn post element into the shape the frontend
 * expects.  Add or remove fields here if the frontend schema changes.
 */
function normalizePost(raw) {
  const id = raw.id ?? String(raw.created?.time ?? Date.now());

  // The main post text lives in `commentary` for the new Posts API
  const text  = raw.commentary ?? "";
  const lines = text.split("\n").filter(Boolean);

  // Use the first non-empty line as the title (capped at 140 chars)
  const title = (lines[0] ?? "Prismix Update").slice(0, 140);

  // Excerpt: first 280 chars of the full text
  const excerpt = text.length > 280
    ? text.slice(0, 280).trimEnd() + "…"
    : text;

  // publishedAt is a Unix timestamp in ms in the LinkedIn response
  const publishedAt = raw.publishedAt
    ? new Date(raw.publishedAt).toISOString()
    : new Date(raw.created?.time ?? Date.now()).toISOString();

  return {
    id,
    title,
    excerpt,
    publishedAt,
    image:       extractImage(raw.content ?? null),
    source:      "LinkedIn",
    linkedinUrl: `https://www.linkedin.com/feed/update/${id}/`,
  };
}

// ─── Scheduled handler ────────────────────────────────────────────
/**
 * Runs every hour (see `config.schedule` below).
 * On success: writes normalized posts to Netlify Blobs `posts.json`.
 * On failure: writes an error entry to `sync-state.json` but leaves
 *             `posts.json` untouched so the frontend keeps serving
 *             the last good data.
 */
export default async function handler() {
  const store = getStore("blogs");

  try {
    console.log("[sync] Starting LinkedIn post fetch…");
    const raw   = await fetchLinkedInPosts();
    const posts = raw
      .map(normalizePost)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    await store.setJSON("posts.json", posts);
    await store.setJSON("sync-state.json", {
      lastSync:  new Date().toISOString(),
      postCount: posts.length,
      status:    "ok",
    });

    console.log(`[sync] Saved ${posts.length} posts to Blobs.`);
  } catch (err) {
    console.error("[sync] Failed:", err.message);

    // Record the error without touching posts.json
    try {
      await store.setJSON("sync-state.json", {
        lastSync: new Date().toISOString(),
        status:   "error",
        error:    err.message,
      });
    } catch (_) {
      // If Blobs itself is down, nothing we can do — just log
      console.error("[sync] Could not write sync-state.json either.");
    }
  }
}

// Runs every hour on Netlify's scheduler
export const config = {
  schedule: "@hourly",
};
