/**
 * sync-linkedin-blogs.js — Scheduled Netlify Function
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  TEMPORARILY DEPRECATED — GitHub posts.json trial (started 2026-05-25)  │
 * │                                                                          │
 * │  The schedule has been removed so this function does not run             │
 * │  automatically during the trial.  The function body is preserved and     │
 * │  fully functional — it can still be invoked manually via the Netlify     │
 * │  dashboard or CLI for testing.                                           │
 * │                                                                          │
 * │  During the trial, data/posts.json on GitHub is the source of truth.    │
 * │  LinkedIn sync writes to Netlify Blobs (postStore.js), which is not      │
 * │  the active store right now, so re-enabling this sync without also       │
 * │  migrating it to githubPostStore.js would not have any visible effect.   │
 * │                                                                          │
 * │  To re-enable after the trial:                                           │
 * │    1. Restore the `export var config` block at the bottom of this file.  │
 * │    2. Update the handler to write via githubPostStore.js instead of      │
 * │       postStore.js (or switch back to Blobs — your call).                │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Original behaviour (preserved for easy re-enable):
 *   Runs every hour. Fetches the latest posts from the Prismix LinkedIn page,
 *   normalizes them, and MERGES them into the existing posts in Netlify Blobs.
 *
 *   - Posts from the AI agent (source: "website-agent") are never overwritten.
 *   - If LinkedIn + agent posts share the same linkedinUrl they are merged into
 *     one record with the agent's richer content winning.
 *   - If the LinkedIn API call fails, posts.json is left untouched.
 *
 * Required env vars:
 *   LINKEDIN_ORG_URN        — e.g. urn:li:organization:12345678
 *   LINKEDIN_ACCESS_TOKEN   — OAuth 2.0 token; expires every ~60 days, must be rotated
 *
 * Optional:
 *   LINKEDIN_API_VERSION    — defaults to "202401"
 */

import { getStore } from "@netlify/blobs";
import { readPosts, writePosts, mergeAllPosts } from "./lib/postStore.js";

// ─── Configuration ────────────────────────────────────────────────────────────

var LINKEDIN_API_BASE = "https://api.linkedin.com/rest";
var LINKEDIN_VERSION  = process.env.LINKEDIN_API_VERSION ?? "202401";
var PAGE_SIZE         = 50; // LinkedIn's hard cap for this endpoint

// ─── LinkedIn API fetch ───────────────────────────────────────────────────────

/**
 * Calls the LinkedIn Posts API for the organization and returns the raw
 * array of post objects.
 *
 * Throws on missing env vars or a non-200 response from LinkedIn.
 * The caller catches this and leaves posts.json untouched.
 */
async function fetchLinkedInPosts() {
  var orgUrn      = process.env.LINKEDIN_ORG_URN;
  var accessToken = process.env.LINKEDIN_ACCESS_TOKEN;

  if (!orgUrn || !accessToken) {
    throw new Error("Missing env vars: LINKEDIN_ORG_URN and/or LINKEDIN_ACCESS_TOKEN");
  }

  var url = new URL(LINKEDIN_API_BASE + "/posts");
  url.searchParams.set("author", orgUrn);
  url.searchParams.set("q",      "author");
  url.searchParams.set("count",  String(PAGE_SIZE));
  url.searchParams.set("sortBy", "CREATED");

  var res = await fetch(url.toString(), {
    headers: {
      "Authorization":             "Bearer " + accessToken,
      "LinkedIn-Version":          LINKEDIN_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });

  if (!res.ok) {
    var errorBody = await res.text();
    throw new Error("LinkedIn API returned " + res.status + ": " + errorBody);
  }

  var json = await res.json();
  return json.elements ?? [];
}

// ─── Normalization ────────────────────────────────────────────────────────────

/**
 * Extracts the best available image URL from a LinkedIn post's content block.
 * Returns null if no image can be found.
 */
function extractImage(content) {
  if (!content) return null;

  // Prefer an embedded media thumbnail
  var media = content.media;
  if (media) {
    if (Array.isArray(media.thumbnails) && media.thumbnails[0] && media.thumbnails[0].url) {
      return media.thumbnails[0].url;
    }
    if (media.originalUrl) return media.originalUrl;
  }

  // Fall back to an article thumbnail
  var article = content.article;
  if (article) {
    if (article.thumbnail)    return article.thumbnail;
    if (article.thumbnailUrl) return article.thumbnailUrl;
  }

  return null;
}

/**
 * Converts a raw LinkedIn API post object into the standard blog post shape
 * that Blogs.jsx and postStore.js expect.
 *
 * Every field has a safe default so the frontend never crashes on a
 * missing or malformed value.
 *
 * @param {object} raw  - a single element from LinkedIn's posts API
 * @returns {object}    - normalized post ready for storage / merging
 */
function normalizeLinkedInPost(raw) {
  // The LinkedIn post id is used as both the stable id and sourceId so
  // the dedup logic in postStore.js can match it reliably in future syncs.
  var linkedInId = raw.id ?? String(raw.created && raw.created.time ? raw.created.time : Date.now());
  var text       = raw.commentary ?? "";

  // Title: the first non-empty line, capped at 140 characters
  var lines = text.split("\n").filter(Boolean);
  var title = (lines[0] ?? "Prismix Update").slice(0, 140);

  // Excerpt: up to 280 characters of the full post text
  var excerpt;
  if (text.length > 280) {
    excerpt = text.slice(0, 277).trimEnd() + "…";
  } else {
    excerpt = text || "Read this post on LinkedIn.";
  }

  // Body: all lines after the title; fall back to the excerpt as one paragraph
  var bodyLines = lines.slice(1).filter(function (l) { return l.trim().length > 0; });
  var body      = bodyLines.length > 0 ? bodyLines : [excerpt];

  // readMinutes: word-count estimate at 200 wpm, minimum 1 minute
  var wordCount   = text.split(/\s+/).filter(Boolean).length;
  var readMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Tags: hashtags found in the post text, stripped of the # prefix
  var tags = Array.from(text.matchAll(/#(\w+)/g)).map(function (m) { return m[1]; });

  // pullQuote: first full sentence, or the excerpt if the sentence is too short
  var firstSentence = (text.split(/[.!?]/)[0] ?? "").trim();
  var pullQuote = firstSentence.length > 20
    ? firstSentence.slice(0, 200)
    : excerpt.slice(0, 200);

  var publishedAt = raw.publishedAt
    ? new Date(raw.publishedAt).toISOString()
    : new Date(raw.created && raw.created.time ? raw.created.time : Date.now()).toISOString();

  return {
    id:          linkedInId,
    title:       title,
    excerpt:     excerpt,
    body:        body,
    publishedAt: publishedAt,
    image:       extractImage(raw.content ?? null),
    source:      "linkedin",
    sourceId:    linkedInId,
    linkedinUrl: "https://www.linkedin.com/feed/update/" + linkedInId + "/",
    author: {
      name:     "Prismix Studios",
      role:     "LinkedIn",
      initials: "PS",
    },
    readMinutes: readMinutes,
    category:    "LinkedIn",
    pullQuote:   pullQuote,
    tags:        tags,
  };
}

// ─── Scheduled handler ────────────────────────────────────────────────────────

/**
 * Netlify scheduled function entry point — runs every hour.
 *
 * On success:
 *   - Fetches LinkedIn posts and normalizes them.
 *   - Reads existing posts.json from Blobs.
 *   - Merges LinkedIn posts into existing posts (agent posts are preserved).
 *   - Writes the merged result back to posts.json.
 *   - Writes a success record to sync-state.json.
 *
 * On failure (LinkedIn API error, network issue, etc.):
 *   - posts.json is NOT modified — the frontend keeps serving the last good data.
 *   - sync-state.json is updated with the error message so it can be diagnosed.
 */
export default async function handler() {
  // We use getStore directly here only for sync-state.json.
  // All posts.json access goes through postStore helpers.
  var store = getStore("blogs");

  try {
    console.log("[sync] Starting LinkedIn post fetch…");

    // 1. Fetch from LinkedIn
    var rawPosts      = await fetchLinkedInPosts();
    var linkedInPosts = rawPosts.map(normalizeLinkedInPost);

    console.log("[sync] Fetched " + linkedInPosts.length + " posts from LinkedIn.");

    // 2. Read what the website already has stored
    var existingPosts = await readPosts();

    // 3. Merge — LinkedIn posts are added/updated; agent posts are preserved
    var mergedPosts = mergeAllPosts(existingPosts, linkedInPosts);

    // 4. Save the merged result (mergeAllPosts already sorts newest-first)
    await writePosts(mergedPosts);

    // 5. Record a successful sync
    await store.setJSON("sync-state.json", {
      lastSync:   new Date().toISOString(),
      postCount:  mergedPosts.length,
      newFromLI:  linkedInPosts.length,
      status:     "ok",
    });

    console.log("[sync] Saved " + mergedPosts.length + " posts to Blobs (" + linkedInPosts.length + " from LinkedIn).");

  } catch (err) {
    console.error("[sync] Failed:", err.message);

    // Write the error to sync-state.json but leave posts.json untouched
    try {
      await store.setJSON("sync-state.json", {
        lastSync: new Date().toISOString(),
        status:   "error",
        error:    err.message,
      });
    } catch (writeErr) {
      console.error("[sync] Could not write sync-state.json either:", writeErr.message);
    }
  }
}

// Schedule disabled for the GitHub posts.json trial (2026-05-25).
// Restore this export when re-enabling LinkedIn sync after the trial.
//
// export var config = {
//   schedule: "@hourly",
// };
